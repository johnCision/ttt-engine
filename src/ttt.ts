import { Game, User, Offer, GenericGameBoard, ActionableGame } from './ttt.types'

function isOwner(game: Game, user: User) { return game.owner === user }
function isPlayer(game: Game, user: User) { return game.players?.includes(user) }
function isChallenger(game: Game, user: User) { return game.offers?.includes(user) }
function isActive(game: Game, user: User) { return game.active?.includes(user) }

function isViewable(game: Game, user: User) {
	return isOwner(game, user) ||
		isChallenger(game, user) ||
		isPlayer(game, user) ||
		isActive(game, user)
}

export const EMPTY = 0

const STATES = {
	NEW: 'new',
	PENDING: 'pending',
	ACTIVE: 'active',
	RESOLVED: 'resolved'
}

const ACTIONS = {
	ACCEPT: 'Accept',
	DECLINE: 'Decline',
	FORFEIT: 'Forfeit',
	CLOSE: 'Close',
	MOVE: 'Move',
	OFFER: 'Offer',
}

const MACHINA  = {
	owner: {
		[STATES.NEW]: [ ACTIONS.CLOSE, ACTIONS.OFFER ],
		[STATES.PENDING]: [ ACTIONS.CLOSE ],
		[STATES.ACTIVE]: [ ACTIONS.CLOSE ]
	},
	challenger: {
		[STATES.PENDING]: [ ACTIONS.ACCEPT, ACTIONS.DECLINE ],
		[STATES.ACTIVE]: [] // accept/decline - late to the game?
	},
	player: {
		[STATES.ACTIVE]: [ ACTIONS.MOVE, ACTIONS.FORFEIT ],
	}
}

function firstPlayer(game: Game) {
	return [ game.players[0] ]
}

function nextPlayerAfterUser_RR(game: Game, user: User) {
	const { players } = game

	const idx = players.indexOf(user)

	if(idx < 0) { return [] }

	const nextVirtualIdx = idx + 1
	if(nextVirtualIdx >= players.length) {
		return [ players[ 0 ] ]
	}

	return [ players[ nextVirtualIdx ] ]
}

export class Board {
	static defaultBoard<T>(): GenericGameBoard<T> {
		const e = EMPTY as T
		return [
			e,e,e, e,e,e, e,e,e
		]
	}

	static isFull<T>(board: GenericGameBoard<T>) {
		return !board.includes(EMPTY as T)
	}

	static winningUser<T>(board: GenericGameBoard<T>) {

		function matchUser(...args: Array<number>) {
			const firstUser = board[args[0]]
			if(firstUser === EMPTY) { return false }

			return args
				.map(boardIdx => board[boardIdx])
				.every(user => user === firstUser)
		}

		// hardcoded rules
		if(matchUser(0, 1, 2)) { return board[0] }
		if(matchUser(3, 4, 5)) { return board[3] }
		if(matchUser(6, 7, 8)) { return board[6] }

		if(matchUser(0, 3, 6)) { return board[0] }
		if(matchUser(1, 4, 7)) { return board[1] }
		if(matchUser(2, 5, 8)) { return board[2] }

		if(matchUser(0, 4, 8)) { return board[4] }

		if(matchUser(2, 4, 6)) { return board[4] }

		return EMPTY
	}

	static isWin<T>(board: GenericGameBoard<T>) {
		const winner = Board.winningUser(board)
		return winner !== EMPTY
	}

	static isDraw<T>(board: GenericGameBoard<T>) {
		if(!Board.isFull(board)) { return false }
		return !Board.isWin(board)
	}

	static isResolved<T>(board: GenericGameBoard<T>) {
		return Board.isFull(board) || Board.isWin(board)
	}
}

export class Action {
	static actionsFor(game: Game, user: User) {
		const { state } = game
		if(state === undefined) { return [] }

		const o = isOwner(game, user) ? MACHINA.owner[state] ?? [] : []
		const p = isPlayer(game, user) ? MACHINA.player[state] ?? [] : []
		const c = isChallenger(game, user) ? MACHINA.challenger[state] ?? [] : []

		return [ ...new Set([ ...o, ...p, ...c]) ]
	}
}

export class TTT {
	static games = new Map()
	// static gameCleanerTimer: number

	static actionableGame(game: Game, user: User, note?: string): ActionableGame {
		const actions = Action.actionsFor(game, user)
		return {
			...game,
			actions,
			note
		}
	}

	static uniqueId() {
		while(true) {
			const id = `${Math.floor(Math.random() * 1000)}`
			if(!TTT.games.has(id)) { return id }
		}
	}

	static handleListGames(user: User) {
		return [ ...TTT.games.values() ]
			.filter(game => isViewable(game, user))
			.map(game => ({
				gameId: game.gameId,
				state: game.state
			}))
	}

	static handleNewGame(user: User) {
		const newGame: Game = {
			gameId: TTT.uniqueId(),
			state: STATES.NEW,

			owner: user,
			players: [],
			offers: [],
			active: [],

			board: Board.defaultBoard(),

			createdAt: Date.now(),

			// resolvedAt: undefined
			// winners: []
		}

		TTT.games.set(newGame.gameId, newGame)

		return TTT.actionableGame(newGame, user)
	}
}

export class TTTOwner {
	static handleOfferGame(game: Game, user: User, offer: Offer) {
		const { target, autoAccept } = offer

		if(!isOwner(game, user)) {
			return TTT.actionableGame(game, user, 'not the owner')
		}

		if(game.state !== STATES.NEW) {
			return TTT.actionableGame(game, user, 'can only offer new games')
		}

		const offers = game.offers !== undefined ?
			[ ...game.offers, target ] : [ target ]

		const players = autoAccept ? [ ...game.players, user ] :  game.players

		const newGame = {
			...game,
			players,
			offers,
			state: STATES.PENDING
		}

		TTT.games.set(game.gameId, newGame)

		return TTT.actionableGame(newGame, user)
	}

	static handleCloseGame(game: Game, user: User) {
		if(!isOwner(game, user)) {
			return TTT.actionableGame(game, user, 'not the owner')
		}

		if(game.state === STATES.RESOLVED) {
			return TTT.actionableGame(game, user, 'game already closed')
		}

		const newGame = {
			...game,
			active: [],
			state: STATES.RESOLVED
		}

		TTT.games.set(game.gameId, newGame)

		return TTT.actionableGame(newGame, user)
	}
}

export class TTTPlayer {
	static handleMove(game: Game, user: User, move: number) {
		const { gameId, state } = game

		if(state !== STATES.ACTIVE) {
			return TTT.actionableGame(game, user, 'can not move on a non-active game')
		}

		if(!isPlayer(game, user)) {
			return TTT.actionableGame(game, user, 'only players can make moves')
		}

		if(!isActive(game, user)) {
			return TTT.actionableGame(game, user, 'only active players can make moves')
		}

		if(game.board[move] !== EMPTY) {
			return TTT.actionableGame(game, user, 'invalid move, cell taken')
		}

		const nextActive = nextPlayerAfterUser_RR(game, user)

		//
		const nextBoard = game.board
		nextBoard[move] = user

		const nextState = Board.isResolved(nextBoard) ? STATES.RESOLVED : game.state

		// const winner = Board.winningUser(nextBoard)

		const newGame = {
			...game,
			board: nextBoard,
			active: nextActive,
			state: nextState
		}

		TTT.games.set(gameId, newGame)

		return TTT.actionableGame(newGame, user)
	}

	static handleForfeit(game: Game, user: User) {
		const { state } = game

		if(state !== STATES.ACTIVE) {
			return TTT.actionableGame(game, user, 'can not forfeit a non-active game')
		}

		if(!isPlayer(game, user)) {
			return TTT.actionableGame(game, user, 'only players can forfeit')
		}

		if(!isActive(game, user)) {
			return TTT.actionableGame(game, user, 'only active players can forfeit')
		}

		const newGame = {
			...game,
			active: [],
			state: STATES.RESOLVED
		}

		TTT.games.set(game.gameId, newGame)

		return TTT.actionableGame(newGame, user)
	}
}

export class TTTChallenger {
	static handleAcceptOffer(game: Game, user: User) {

		if(game.state !== STATES.PENDING) {
			return TTT.actionableGame(game, user, 'can only accept pending games')
		}

		if(!isChallenger(game, user)) {
			return TTT.actionableGame(game, user, 'only challenger can accept a game')
		}

		const offers = game.offers.filter(offer => offer !== user)
		const players = [ ...game.players, user ]

		const state = STATES.ACTIVE

		const active = firstPlayer(game)

		const newGame = {
			...game,
			state,
			active,
			offers,
			players
		}

		TTT.games.set(game.gameId, newGame)

		return TTT.actionableGame(newGame, user)
	}

	static handleDeclineOffer(game: Game, user: User) {

		if(!isChallenger(game, user)) {
			return TTT.actionableGame(game, user, 'only challenger can decline')
		}

		const offers = game.offers?.filter(offer => offer !== user) ?? []

		const state = STATES.RESOLVED

		const newGame = {
			...game,
			state,
			offers
		}

		TTT.games.set(game.gameId, newGame)

		return TTT.actionableGame(newGame, user)
	}
}

function isOwner(game, user) { return game.owner === user }
function isPlayer(game, user) { return game.players.includes(user) }
function isChallenger(game, user) { return game.offers.includes(user) }
function isActive(game, user) { return game.active.includes(user) }

function isViewable(game, user) {
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
	OFFER: 'offer',
	ACCEPT: 'accept',
	DECLINE: 'decline',
	MOVE: 'move',
	FORFEIT: 'forfeit',
	CLOSE: 'close'
}

function firstPlayer(game) {
	return [ game.players[0] ]
}

function nextPlayerAfterUser_RR(game, user) {
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
	static defaultBoard() {
		return [
			EMPTY,EMPTY,EMPTY,
			EMPTY,EMPTY,EMPTY,
			EMPTY,EMPTY,EMPTY
		]
	}

	static isFull(board) {
		return !board.includes(EMPTY)
	}

	static winningUser(board) {

		function matchUser(...args) {
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

	static isWin(board) {
		const winner = Board.winningUser(board)
		return winner !== EMPTY
	}

	static isDraw(board) {
		if(!Board.isFull(board)) { return false }
		return !isWin(board)
	}

	static isResolved(board) {
		return Board.isFull(board) || Board.isWin(board)
	}
}

export class Action {
	static actionsFromUserGameState(game, user) {
		switch(game.state) {
		case STATES.NEW:

			break
		}

	}
}

export class TTT {
	static games = new Map()
	static gameCleanerTimer

	static uniqueId() {
		while(true) {
			const id = `${Math.floor(Math.random() * 1000)}`
			if(!TTT.games.has(id)) { return id }
		}
	}

	static handleListGames(user) {
		return [ ...TTT.games.values() ]
			.filter(game => isViewable(game, user))
			.map(game => ({
				gameId: game.gameId,
				state: game.state
			}))
	}

	static handleNewGame(user) {
		const game = {
			gameId: TTT.uniqueId(),
			state: STATES.NEW,

			owner: user,
			players: [],
			offers: [],
			active: [],

			board: Board.defaultBoard(),

			createdAt: Date.now()
		}

		TTT.games.set(game.gameId, game)

		return {
			...game,
			actions: [ ACTIONS.CLOSE, ACTIONS.OFFER ]
		}
	}
}

export class TTTOwner {
	static handleOfferGame(game, user, offer) {
		const { target, autoAccept } = offer

		if(!isOwner(game, user)) {
			console.warn('not the owner')
			return game
		}

		if(game.state !== STATES.NEW) {
			console.warn('can only offer new games')
			return game
		}

		// handle self-accept
		const ownerActions = target === user ? [ ACTIONS.ACCEPT ] : []

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

		return {
			...newGame,
			actions: [ ACTIONS.CLOSE, ACTIONS.OFFER, ...ownerActions ]
		}
	}

	static handleCloseGame(game, user) {
		if(!isOwner(game, user)) {
			console.warn('not the owner')
			return game
		}

		if(game.state === STATES.RESOLVED) {
			console.warn('game already closed')
			return game
		}

		const newGame = {
			...game,
			active: [],
			state: STATES.RESOLVED
		}

		TTT.games.set(game.gameId, newGame)

		return {
			...newGame,
			actions: [ ]
		}
	}
}

export class TTTPlayer {
	static handleMove(game, user, move) {
		const { gameId, state } = game

		if(state !== STATES.ACTIVE) {
			console.warn('can not move on a non-active game')
			return game
		}

		if(!isPlayer(game, user)) {
			console.warn('only players can make moves', game, user)
			return game
		}

		if(!isActive(game, user)) {
			console.warn('only active players can make moves', game, user)
			return game
		}

		if(game.board[move] !== EMPTY) {
			console.warn('invalid move, cell taken', game, user)
			return game
		}

		const nextActive = nextPlayerAfterUser_RR(game, user)

		//
		const nextBoard = game.board
		nextBoard[move] = user

		const nextState = Board.isResolved(nextBoard) ? STATES.RESOLVED : game.state

		const winner = Board.winningUser(nextBoard)

		const nextGame = {
			...game,
			board: nextBoard,
			active: nextActive,
			state: nextState
		}

		TTT.games.set(gameId, nextGame)

		return {
			...nextGame,
			actions: [ ]
		}
	}

	static handleForfeit(game, user) {
		const { gameId, state } = game

		if(state !== STATES.ACTIVE) {
			console.warn('can not forfeit a non-active game')
			return game
		}

		if(!isPlayer(game, user)) {
			console.warn('only players can forfeit', game, user)
			return game
		}

		if(!isActive(game, user)) {
			console.warn('only active players can forfeit', game, user)
			return game
		}




		const newGame = {
			...game,
			active: [],
			state: STATES.RESOLVED
		}

		TTT.games.set(game.gameId, newGame)

		return {
			...newGame,
			actions: [ ]
		}




	}
}

export class TTTChallenger {
	static handleAcceptOffer(game, user) {

		if(game.state !== STATES.PENDING) {
			console.warn('can only accept pending games')
			return game
		}

		if(!isChallenger(game, user)) {
			console.warn('only challenger can accept a game')
			return game
		}

		const offers = game.offers.filter(offer => offer !== user)
		const players = [ ...game.players, user ]

		const state = STATES.ACTIVE
		const actions = state === STATES.ACTIVE ? [ ACTIONS.MOVE ] : []

		const active = firstPlayer(game)

		const newGame = {
			...game,
			state,
			active,
			offers,
			players
		}

		TTT.games.set(game.gameId, newGame)

		return {
			...newGame,
			actions
		}
	}

	static handleDeclineOffer(game, user) {
		const offers = game.offers.filter(offer => offer !== user)

		const state = STATES.RESOLVED

		const newGame = {
			...game,
			state,
			offers,
			players
		}

		TTT.games.set(game.gameId, newGame)

		return {
			...newGame,
			actions: [ ]
		}
	}
}


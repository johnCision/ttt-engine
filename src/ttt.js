function isOwner(game, user) { return game.owner === user }
function isPlayer(game, user) { return game.players.includes(user) }
function isChallenger(game, user) { return game.offers.includes(user) }

export class Board {
	static defaultBoard() { return [ 0,0,0, 0,0,0, 0,0,0 ]}

	static makeMove() {
		// return [ 0 0 0 0 0]
	}
}

export class TTT {
	static games = new Map()
	static gameCleanerTimer

	static uniqueId() { return 0 }



	static handleListGames(user) {
		return [ ...TTT.games.values() ]
			.filter(game => isOwner(game, user) || isChallenger(game, user) || isPlayer(game, user))
			.map(game => ({
				gameId: game.gameId,
				state: game.state
			}))
	}

	static handleNewGame(user) {
		const game = {
			gameId: TTT.uniqueId(),
			state: 'new',

			owner: user,
			players: [],
			offers: [],

			board: Board.defaultBoard(),

			createdAt: Date.now()
		}

		TTT.games.set(game.gameId, game)

		return {
			...game,
			actions: [ 'close', 'offer' ]
		}
	}
}


export class TTTOwner {
	static handleOfferGame(game, user, offer) {
		const { target, autoAccept } = offer

		if(!isOwner(game, user)) {
			console.warn('not the owner')
			return
		}

		// handle self-accept
		const ownerActions = target === user ? [ 'accept' ] : []

		const offers = game.offers !== undefined ?
			[ ...game.offers, target ] : [ target ]

		const players = autoAccept ? [ ...game.players, user ] :  game.players

		const newGame = {
			...game,
			players,
			offers,
			state: 'pending'
		}

		TTT.games.set(game.gameId, newGame)

		return {
			...newGame,
			actions: [ 'close', 'offer', ...ownerActions ]
		}
	}

	static handleCloseGame(game, user) {
		const isOwner = user === game.owner
		if(!isOwner) {
			console.warn('not the owner')
			return
		}

		const newGame = {
			...game,
			state: 'resolved'
		}

		TTT.games.set(game.gameId, newGame)

		return {
			...newGame,
			actions: [ ]
		}
	}
}

export class TTTPlayer {
	handleMove(game, user, move) {

	}
}

export class TTTChallenger {
	static handleAcceptOffer(game, user) {

		if(!isChallenger(game, user)) { return }

		const offers = game.offers.filter(offer => offer !== user)
		const players = [ ...game.players, user ]

		const state = 'active'
		const actions = state === 'active' ? [ 'move' ] : []

		const newGame = {
			...game,
			state,
			offers, players
		}

		TTT.games.set(game.gameId, newGame)
		console.log(TTT.games)

		return {
			...newGame,
			actions
		}
	}

	static handleDeclineOffer(game, user) {
		const offers = game.offers.filter(offer => offer !== user)

		const state = 'closed'

		const newGame = {
			...game,
			state,
			offers, players
		}

		TTT.games.set(game.gameId, newGame)

		return {
			...newGame,
			actions: [ ]
		}
	}
}


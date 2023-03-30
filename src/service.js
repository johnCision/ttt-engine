// file deepcode ignore UsageOfUndefinedReturnValue: early exists are ok
import { TTT, TTTOwner, TTTChallenger, TTTPlayer } from './ttt.js'

export const MSG_TYPES = {
	LISTING: 'game-listing',
	UPDATE: 'game-update',
	GAME: 'game!',
}

export const CLIENT_MSG_TYPES = {
	LIST: 'list-games',
	GAME: 'game?',
	OFFER: 'offer-game',
	CLOSE: 'close',
	ACCEPT: 'accept',
	DECLINE: 'decline',
	MOVE: 'move',
	FORFEIT: 'forfeit'
}

//
function serviceHandleListGames(replyPort, data) {
	const { user } = data

	const games = TTT.handleListGames(user)
	console.log('list games', games)

	replyPort.postMessage({
		type: 'game-listing',
		games
	})
}

function serviceHandleGame(replyPort, data) {
	const { gameId, user } = data

	if(gameId !== undefined) {
		// requesting game info not a new game
		// console.log('request gameId info', gameId)

		const game = TTT.games.get(gameId)
		if(game === undefined) {
			console.warn('invalid game id', gameId)
			return
		}

		replyPort.postMessage({
			type: MSG_TYPES.UPDATE,
			gameId: game.gameId,
			state: game.state
		})

		replyPort.postMessage({
			type: MSG_TYPES.GAME,
			...game
		})

		return
	}

	const game = TTT.handleNewGame(user)

	if(game.owner !== user && !game.offers.includes(owner)) { return }

	replyPort.postMessage({
		type: MSG_TYPES.UPDATE,
		gameId: game.gameId,
		state: game.state
	})
	replyPort.postMessage({
		type: MSG_TYPES.GAME,
		...game
	})
}

function serviceHandleOfferGame(replyPort, data) {
	const { gameId, user, target } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const offeredGame = TTTOwner.handleOfferGame(game, user, { autoAccept: true, target })
	if(offeredGame === undefined) {
		return
	}

	replyPort.postMessage({
		type: MSG_TYPES.UPDATE,
		gameId: offeredGame.gameId,
		state: offeredGame.state
	})
	replyPort.postMessage({
		type: MSG_TYPES.GAME,
		...offeredGame
	})
}

function serviceHandleCloseGame(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const closedGame = TTTOwner.handleCloseGame(game, user)

	replyPort.postMessage({
		type: MSG_TYPES.UPDATE,
		gameId: closedGame.gameId,
		state: closedGame.state
	})
	replyPort.postMessage({
		type: MSG_TYPES.GAME,
		...closedGame
	})
}

function serviceHandleForfeitGame(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const forfeitGame = TTTPlayer.handleForfeit(game, user)

	replyPort.postMessage({
		type: MSG_TYPES.UPDATE,
		gameId: forfeitGame.gameId,
		state: forfeitGame.state
	})
	replyPort.postMessage({
		type: MSG_TYPES.GAME,
		...forfeitGame
	})
}

function serviceHandleAcceptOffer(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const acceptedGame = TTTChallenger.handleAcceptOffer(game, user)
	if(acceptedGame === undefined) { return }

	replyPort.postMessage({
		type: MSG_TYPES.UPDATE,
		gameId: acceptedGame.gameId,
		state: acceptedGame.state
	})
	replyPort.postMessage({
		type: MSG_TYPES.GAME,
		...acceptedGame
	})
}

function serviceHandleDeclineOffer(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const declinedGame = TTTChallenger.handleDeclineOffer(game, user)

	replyPort.postMessage({
		type: MSG_TYPES.UPDATE,
		gameId: declinedGame.gameId,
		state: declinedGame.state
	})
	replyPort.postMessage({
		type: MSG_TYPES.GAME,
		...declinedGame
	})
}

function serviceHandleMove(replyPort, data) {
	const { gameId, user, move } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) {
		console.warn('invalid game id', gameId)
		return
	}

	const currentGame = TTTPlayer.handleMove(game, user, move)

	replyPort.postMessage({
		type: MSG_TYPES.UPDATE,
		gameId: currentGame.gameId,
		state: currentGame.state
	})

	replyPort.postMessage({
		type: MSG_TYPES.GAME,
		...currentGame
	})
}

function initPort(port) {

	let pingTask
	setTimeout(() => {
			pingTask = setInterval(() => {
				port.postMessage({ type: '_service_ping' })
			}, 1000 * 4)
		}, 1000 * 1)

	port.onmessage = message => {
		const replyPort = port
		const { data } = message
		const { type } = data

		if(type === '_service_ping') {
			console.warn('Service PING ... close')
			clearInterval(pingTask)
			port.close()
		}

		const IGNORE_TYPES = [ 'game-listing', '_service_ping' ]
		if(IGNORE_TYPES.includes(type)) {
			return
		}

  	if(type === CLIENT_MSG_TYPES.LIST) { return serviceHandleListGames(replyPort, data) }
		if(type === CLIENT_MSG_TYPES.GAME) { return serviceHandleGame(replyPort, data) }
		if(type === CLIENT_MSG_TYPES.OFFER) { return serviceHandleOfferGame(replyPort, data) }
		if(type === CLIENT_MSG_TYPES.CLOSE) { return serviceHandleCloseGame(replyPort, data) }
		if(type === CLIENT_MSG_TYPES.ACCEPT) { return serviceHandleAcceptOffer(replyPort, data) }
		if(type === CLIENT_MSG_TYPES.DECLINE) { return serviceHandleDeclineOffer(replyPort, data) }
		if(type === CLIENT_MSG_TYPES.MOVE) { return serviceHandleMove(replyPort, data) }
		if(type === CLIENT_MSG_TYPES.FORFEIT) { return serviceHandleForfeitGame(replyPort, data) }

		console.warn('unhandled message', type)
	}
}

export class Service {
	#port

	static from(port) {
		return new Service(port)
	}

	constructor(port) { this.#port = initPort(port) }
}
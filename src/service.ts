// file deepcode ignore UsageOfUndefinedReturnValue: early exists are ok
import { TTT, TTTOwner, TTTChallenger, TTTPlayer } from './ttt.js'
import { ClientMessage } from './service.msg-types.js'

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
function serviceHandleListGames(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { user } = data

	const games = TTT.handleListGames(user)
	console.log('list games', games)

	replyPort.postMessage({
		for: user,
		type: 'game-listing',
		games
	})
}

function serviceHandleGame(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { gameId, user } = data

	if(gameId !== undefined) {
		// requesting game info not a new game
		// console.log('request gameId info', gameId)

		if(!TTT.games.has(gameId)) {
			console.warn('invalid game id', gameId)
			return
		}

		const existingGame = TTT.actionableGame(TTT.games.get(gameId), user)

		replyPort.postMessage({
			for: user,
			type: MSG_TYPES.UPDATE,
			gameId: existingGame.gameId,
			state: existingGame.state,
			actions: existingGame.actions
		})

		replyPort.postMessage({
			for: user,
			type: MSG_TYPES.GAME,
			...existingGame
		})

		return
	}

	const game = TTT.handleNewGame(user)

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.UPDATE,
		gameId: game.gameId,
		state: game.state,
		actions: game.actions
	})
	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.GAME,
		...game
	})
}

function serviceHandleOfferGame(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { gameId, user, target } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const offeredGame = TTTOwner.handleOfferGame(game, user, { autoAccept: true, target })

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.UPDATE,
		gameId: offeredGame.gameId,
		state: offeredGame.state,
		actions: offeredGame.actions
	})
	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.GAME,
		...offeredGame
	})
}

function serviceHandleCloseGame(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const closedGame = TTTOwner.handleCloseGame(game, user)

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.UPDATE,
		gameId: closedGame.gameId,
		state: closedGame.state,
		actions: closedGame.actions
	})
	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.GAME,
		...closedGame
	})
}

function serviceHandleForfeitGame(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const forfeitGame = TTTPlayer.handleForfeit(game, user)

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.UPDATE,
		gameId: forfeitGame.gameId,
		state: forfeitGame.state,
		actions: forfeitGame.actions
	})
	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.GAME,
		...forfeitGame
	})
}

function serviceHandleAcceptOffer(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const acceptedGame = TTTChallenger.handleAcceptOffer(game, user)
	if(acceptedGame === undefined) { return }

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.UPDATE,
		gameId: acceptedGame.gameId,
		state: acceptedGame.state,
		actions: acceptedGame.actions
	})
	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.GAME,
		...acceptedGame
	})
}

function serviceHandleDeclineOffer(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const declinedGame = TTTChallenger.handleDeclineOffer(game, user)

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.UPDATE,
		gameId: declinedGame.gameId,
		state: declinedGame.state,
		actions: declinedGame.actions
	})
	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.GAME,
		...declinedGame
	})
}

function serviceHandleMove(replyPort: MessagePort | BroadcastChannel, data: ClientMessage) {
	const { gameId, user, move } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) {
		console.warn('invalid game id', gameId)
		return
	}

	const currentGame = TTTPlayer.handleMove(game, user, move)

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.UPDATE,
		gameId: currentGame.gameId,
		state: currentGame.state,
		actions: currentGame.actions
	})

	replyPort.postMessage({
		for: user,
		type: MSG_TYPES.GAME,
		...currentGame
	})
}

function initPort(port: MessagePort | BroadcastChannel) {

	let pingTask: number = 0
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

	return port
}

export class Service {
	#port: MessagePort | BroadcastChannel

	static from(port: MessagePort | BroadcastChannel) {
		return new Service(port)
	}

	constructor(port: MessagePort | BroadcastChannel) { this.#port = initPort(port) }

	close() { this.#port.close() }
}
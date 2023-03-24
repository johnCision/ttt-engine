import { TTT, TTTOwner, TTTChallenger, TTTPlayer } from './ttt.js'

const MSG_TYPES = {
	LISTING: 'game-listing',
	UPDATE: 'game-update',
	GAME: 'game',
}

const CLIENT_MSG_TYPES = {
	LIST: 'list-games',
	NEW: 'game',
	OFFER: 'offer-game',
	CLOSE: 'close',
	ACCEPT: 'accept',
	DECLINE: 'decline',
	MOVE: 'move'
}

//
function serviceHandleListGames(replyPort, data) {
	const { user } = data

	const games = TTT.handleListGames(user)

	replyPort.postMessage({
		type: 'game-listing',
		games
	})
}

function serviceHandleGame(replyPort, data) {
	const { user } = data

	const game = TTT.handleNewGame(user)

	if(game.owner !== user && !game.offers.includes(owner)) { return }

	replyPort.postMessage({
		type: 'game-update',
		gameId: game.gameId,
		state: game.state
	})
	replyPort.postMessage({
		type: 'game',
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
		type: 'game-update',
		gameId: offeredGame.gameId,
		state: offeredGame.state
	})
	replyPort.postMessage({
		type: 'game',
		...offeredGame
	})

	// if(target === 'AI') {
	// 	const acceptedGame = TTTChallenger.handleAcceptOffer(offeredGame, 'AI')
	// 	replyPort.postMessage({
	// 		type: 'game-update',
	// 		gameId: acceptedGame.gameId,
	// 		state: acceptedGame.state
	// 	})
	// 	replyPort.postMessage({
	// 		type: 'game',
	// 		...acceptedGame
	// 	})
	// }
}

function serviceHandleCloseGame(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const closedGame = TTTOwner.handleCloseGame(game, user)

	replyPort.postMessage({
		type: 'game-update',
		gameId: closedGame.gameId,
		state: closedGame.state
	})
	replyPort.postMessage({
		type: 'game',
		...closedGame
	})
}

function serviceHandleAcceptOffer(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const acceptedGame = TTTChallenger.handleAcceptOffer(game, user)
	if(acceptedGame === undefined) { return }

	replyPort.postMessage({
		type: 'game-update',
		gameId: acceptedGame.gameId,
		state: acceptedGame.state
	})
	replyPort.postMessage({
		type: 'game',
		...acceptedGame
	})
}


function serviceHandleDeclineOffer(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const declinedGame = TTTChallenger.handleDeclineOffer(game, user)

	replyPort.postMessage({
		type: 'game-update',
		gameId: declinedGame.gameId,
		state: declinedGame.state
	})
	replyPort.postMessage({
		type: 'game',
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
		type: 'game-update',
		gameId: currentGame.gameId,
		state: currentGame.state
	})

	replyPort.postMessage({
		type: 'game',
		...currentGame
	})
}

function initPort(port) {
	port.onmessage = message => {
		const replyPort = port
		const { data } = message
		const { type } = data

		console.log('service handle', type)

		if(type === 'list-games') { return serviceHandleListGames(replyPort, data) }
		if(type === 'game') { return serviceHandleGame(replyPort, data) }
		if(type === 'offer-game') { return serviceHandleOfferGame(replyPort, data) }
		if(type === 'close') { return serviceHandleCloseGame(replyPort, data) }
		if(type === 'accept') { return serviceHandleAcceptOffer(replyPort, data) }
		if(type === 'decline') { return serviceHandleDeclineOffer(replyPort, data) }
		if(type === 'move') { return serviceHandleMove(replyPort, data) }

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
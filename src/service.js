import { TTT, TTTOwner, TTTChallenger } from './ttt.js'

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
}

function serviceHandleOfferGame(replyPort, data) {
	const { gameId, user, target } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const offeredGame = TTTOwner.handleOfferGame(game, user, { autoAccept: true, target })

	replyPort.postMessage({
		type: 'game-update',
		gameId: offeredGame.gameId,
		state: offeredGame.state
	})
}

function serviceHandleCloseGame(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	TTTOwner.handleCloseGame(game, user)
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
}

function serviceHandleMove(replyPort, data) {
	const { gameId, user } = data

	const game = TTT.games.get(gameId)
	if(game === undefined) { return }

	const currentGame = TTTPlayer.handleMove(game, user, move)

	replyPort.postMessage({
		type: 'game-update',
		gameId: currentGame.gameId,
		state: currentGame.state
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
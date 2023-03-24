import {
	patchGames,
	patchGame,
	onContentLoad
} from './ui.js'
import { Service } from './service.js'
import { AI } from './ai.js'

const USER = 'me'

// const ch = new MessageChannel()
// const { port1: servicePort, port2: clientPort } = ch

// const service = Service.from(servicePort)
// const client = { clientPort, user: USER }

const servicePort = new BroadcastChannel('TTT')
const clientPort = new BroadcastChannel('TTT')
const clientAIPort = new BroadcastChannel('TTT')

const service = Service.from(servicePort)
const clientAI = AI.from(clientAIPort)
const client = { clientPort, user: USER }


clientPort.onmessage = message => {
	// console.log({ message })
	const { data } = message
	const { type } = data

	//
	if (type === 'game-listing') {
		const { games } = data
		patchGames(games)
		return
	}

	if(type === 'game-update') {
		//patchGameById()
		return
	}

	if (type === 'game') {
		patchGame(data, client)
		return
	}

	console.warn('unknown client message', type)
}

//
onContentLoad(client)

//
clientPort.postMessage({ user: USER, type: 'list-games' })




// client.games.forEach()

//
// clientPort.postMessage({ user, type: 'list-games' })
// clientPort.postMessage({ user, type: 'game' })
// clientPort.postMessage({ user, type: 'list-games' })

// clientPort.postMessage({ user, type: 'offer-game', gameId: 0, target: 'AI' })
//clientPort.postMessage({ user, type: 'offer-game', gameId: 0, target: 'AI' })
// clientPort.postMessage({ user: 'AI', type: 'accept', gameId: 0  })

// clientPort.postMessage({ user, type: 'list-games' })
// clientPort.postMessage({ user: 'AI', type: 'list-games' })


// clientPort.postMessage({ user, type: 'move', index: 3 })
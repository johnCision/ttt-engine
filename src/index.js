import {
	patchGames,
	patchGame,
	onContentLoad
} from './ui.js'
import { Service } from './service.js'
import { AI, STRATEGIES } from './ai.js'

const USER = 'me'

// const ch = new MessageChannel()
// const { port1: servicePort, port2: clientPort } = ch

// const service = Service.from(servicePort)
// const client = { clientPort, user: USER }

const clientPort = new BroadcastChannel('TTT')

const client = { clientPort, user: USER }
const service = Service.from(new BroadcastChannel('TTT'))
const clientAI_random = AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.RANDOM, user: 'AI:random' })
const clientAI_minmax = AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.MINMAX, user: 'AI:minmax' })
const clientAI_alphabeta = AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.ALPHABETA, user: 'AI:alphabeta' })


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

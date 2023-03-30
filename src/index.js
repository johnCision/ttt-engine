import {
	patchGames,
	patchGame,
	onContentLoad
} from './ui.js'
import { Service } from './service.js'
import { AI, STRATEGIES } from './ai.js'

// import * as mod from 'mqtt'
// mqtt.connect('ws://test.mosquitto.org:8080')
// mqtt.connect('ws://broker.emqx.io:8083')
// const mqttClient = mqtt.connect('ws://broker.hivemq.com:8000')

// mqttClient.on('connect', () => {
// 	console.log('connect')
// 	mqttClient.subscribe('test', () => {
// 		console.log('test')
// 	})
// })

// mqttClient.on('message', (topic, message) => {
// 	console.log('message', { topic, message })
// })

// mqttClient.publish('test', JSON.stringify({ test: 'hello' }))

	//
	const query = new URLSearchParams(window.location.search)
	const hint = query.has('hint') ? query.get('hint') : 'self'
	const noServ = query.has('noserv')

// const ch = new MessageChannel()
// const { port1: servicePort, port2: clientPort } = ch
// const service = Service.from(servicePort)
// const client = { clientPort, user: hint }

const clientPort = new BroadcastChannel('TTT')
const client = { clientPort, user: hint }

if(!noServ) {
	document.body.toggleAttribute('data-green', true)

	const service = Service.from(new BroadcastChannel('TTT'))

	const clientAI_random = AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.RANDOM, user: 'AI:random' })
	const clientAI_minmax = AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.MINMAX, user: 'AI:minmax' })
	const clientAI_threat = AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.THREAT, user: 'AI:threat' })
	const clientAI_alphabeta = AI.from(new BroadcastChannel('TTT'), { strategy: STRATEGIES.ALPHABETA, user: 'AI:alphabeta' })
}

clientPort.onmessage = message => {
	// console.log({ message })
	const { data } = message
	const { type } = data

	const IGNORE_TYPES = [ 'move', 'accept', 'list-games', 'offer-game', 'close', 'game?', '_service_ping' ]
	if(IGNORE_TYPES.includes(type)) { return }

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

	if (type === 'game!') {
		patchGame(data, client)
		return
	}

	console.warn('unknown client message', type)
}

//
onContentLoad(client)

//
clientPort.postMessage({ user: client.user, type: 'list-games' })

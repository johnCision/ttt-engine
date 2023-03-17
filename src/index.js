import { Client } from './client.js'

import { Service } from './service.js'

const ch = new MessageChannel()
const { port1, port2 } = ch

const service = Service.from(port1)

//
const client = Client.from(port2)


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
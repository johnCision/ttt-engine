
import { evaluateMove as evaluateMove_threatMatrix } from './ai/threat_matrix.js'
import { evaluateMove as evaluateMove_random } from './ai/random.js'
import { evaluateMove as evaluateMove_minmax } from './ai/minmax.js'
import { evaluateMove as evaluateMove_alphabeta } from './ai/alpha_beta.js'

import { User } from './ttt.types.js'

export type Strategy = 'threat' | 'random' | 'minmax' | 'alphabeta'

type Strategies = {
	THREAT: Strategy,
	RANDOM: Strategy,
	MINMAX: Strategy,
	ALPHABETA: Strategy,
}

export const STRATEGIES: Strategies = {
	THREAT: 'threat',
	RANDOM: 'random',
	MINMAX: 'minmax',
	ALPHABETA: 'alphabeta'
}


export type AIOptions = {
	strategy: Strategy,
	user: User
}

export const DEFAULT_STRATEGY = STRATEGIES.RANDOM

function initPort(port: MessagePort | BroadcastChannel, options: AIOptions) {
	const strategy = options?.strategy ?? DEFAULT_STRATEGY
	const aiUser = options?.user

	if(aiUser === undefined) { throw new Error('no user name') }

	const evaluateMove = strategy === STRATEGIES.ALPHABETA ? evaluateMove_alphabeta :
		strategy === STRATEGIES.MINMAX ? evaluateMove_minmax :
		strategy === STRATEGIES.THREAT ? evaluateMove_threatMatrix :
		strategy === STRATEGIES.RANDOM ? evaluateMove_random :
		() => { throw new Error('strategy unknown') }

	port.onmessage = message => {
		const { data } = message
		const { type } = data

		const IGNORE_TYPES = [ 'game?', 'list-games', 'offer-game', 'move', 'accept', 'close', '_service_ping' ]
		if(IGNORE_TYPES.includes(type)) {
			return
		}

		if (type === 'game-listing') {
			// console.log('AI:Listing', data)
			return
		}

		if (type === 'game!') {
			// console.log('AI:Game Info', data)
			const { active, offers, state, gameId, board } = data

			// accept offers
			if(state === 'pending') {
				if(offers.includes(aiUser)) {
					console.log('AI:Game - accept')
					port.postMessage({ user: aiUser, type: 'accept', gameId })
				}

				return
			}
			else if(state === 'active') {
				if(active.includes(aiUser)) {
					console.log('AI:Game - my turn')

					setTimeout(() => {
						// make move
						const { move } = evaluateMove(board, aiUser)
						console.log('AI:Game - move', move)

						port.postMessage({
							user: aiUser,
							type: 'move',
							gameId,
							move
						})
					}, 1000 * Math.random() * 4 + 1)

				}
				else if(state === 'resolved') {
					// game resolved
				}

				return
			}

			return
		}

		if (type === 'game-update') {
			// console.log('AI:Update', data)
			// const { gameId } = data
			return
		}

		if (type === 'game-offer') {
			// console.log('AI:Game Offer', from)
			return
		}

		console.warn('unhandled message', type)
	}

	return port
}

export class AI {
	#port

	static from(port: MessagePort | BroadcastChannel, options: AIOptions) {
		return new AI(port, options)
	}

	constructor(port: MessagePort | BroadcastChannel, options: AIOptions) { this.#port = initPort(port, options) }

	close() { this.#port.close() }
}

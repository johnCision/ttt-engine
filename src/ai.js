const AI_USER = 'AI'

function initPort(port) {
	port.onmessage = message => {
		const { data } = message
		const { type } = data

		const CLIENT_TYPES = ['list-games', 'offer-game', 'move']
		if(CLIENT_TYPES.includes(type)) {
			return
		}

		if (type === 'game-listing') {
			console.log('AI:Listing', data)
			return
		}

		if (type === 'game') {
			// console.log('AI:Game Info', data)
			const { active, offers, state, gameId } = data

			// accept offers
			if(state === 'pending') {
				if(offers.includes(AI_USER)) {
					console.log('AI:Game - accept')
					port.postMessage({ user: AI_USER, type: 'accept', gameId })
				}

				return
			}

			if(state === 'active') {
				if(active.includes(AI_USER)) {
					console.log('AI:Game - my move')

					// make move
					const move = Math.floor(Math.random() * 9)

					setTimeout(() => {
						port.postMessage({
							user: AI_USER,
							type: 'move',
							gameId,
							move
						})
					}, 1000 * Math.random() * 4 + 1)

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
			console.log('AI:Game Offer', from)
			return
		}

		console.warn('unhandled message', type)
	}

	return port
}

export class AI {
	#port

	static from(port) {
		return new AI(port)
	}

	constructor(port) { this.#port = initPort(port) }
}


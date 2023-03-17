

function initPort(port) {
	port.onmessage = message => {
		const { data } = message
		const { type } = data

		if (type === 'game-listing') {
			console.log('---- Listing', data)
			return
		}

		if (type === 'game') {
			console.log('---- Game Info', data)
			return
		}

		if (type === 'game-update') {
			console.log('---- Update', data)
			const { gameId } = data
			return
		}

		if (type === 'game-offer') {
			console.log('----- Game Offer', from)
			return
		}

		console.warn('unhandled message', type)
	}

	return port
}

export class Client {
	#port

	static from(port) {
		return new Client(port)
	}

	constructor(port) { this.#port = initPort(port) }
}


function playersToVs(game) {
	if(game.players.length <= 0) { return '...' }
	return game.players.join(' vs ')
}

function buildGameRow(gamesTable, game, client) {
	const { gameId, state } = game

	function buildOfferGameHandler(offerButton, gameId) {
		const OFFER_TARGET = Math.random() > 0.5 ? 'AI:minmax' : 'AI:random'

		return event => {
			event.preventDefault()
			event.stopPropagation()
			offerButton.disabled = true
			client.clientPort.postMessage({ user: client.user, type: 'offer-game', gameId, target: OFFER_TARGET })
		}
	}

	function buildCloseGameHandler(closeButton, gameId) {
		return event => {
			event.preventDefault()
			event.stopPropagation()
			closeButton.disabled = true
			client.clientPort.postMessage({ user: client.user, type: 'close', gameId })
		}
	}

	const templates = gamesTable.getElementsByTagName('template')
	const content = templates[0].content
	const tr = content.cloneNode(true).children[0]

	//
	tr.setAttribute('data-game-id', gameId)

	const gameIdSlot = tr.querySelector('slot[name="gameId"]')
	const vsSlot = tr.querySelector('slot[name="vs"]')
	const stateSlot = tr.querySelector('slot[name="state"]')

	gameIdSlot.innerText = gameId
	vsSlot.innerText = playersToVs(game)
	stateSlot.innerText = state

	const closeButton = tr.querySelector('button[data-close-game]')
	closeButton.addEventListener('click', buildCloseGameHandler(closeButton, gameId), { once: true })

	const offerButton = tr.querySelector('button[data-offer-game]')
	offerButton.addEventListener('click', buildOfferGameHandler(offerButton, gameId), { once: true })

	tr.addEventListener('click', event => {
		//
		const board = document.getElementById('gameBoard')
		const currentGameId = board.getAttribute('game-id')

		console.log('!! update game board')

		board.setAttribute('game-id', gameId)
		board.setAttribute('state', '')

		// request game update
		client.clientPort.postMessage({ user: client.user, type: 'game', gameId })

		showGameBoard()
	})

	return tr
}

function updateGameRow(tr, game) {
	const { gameId, state } = game

	const gameIdSlot = tr.querySelector('slot[name="gameId"]')
	const vsSlot = tr.querySelector('slot[name="vs"]')
	const stateSlot = tr.querySelector('slot[name="state"]')

	gameIdSlot.innerText = gameId
	vsSlot.innerText = playersToVs(game)
	stateSlot.innerText = state

}


function hidePages() {
	const pages = document.querySelectorAll('[data-page]')
	pages.forEach(page => page.toggleAttribute('data-active', false))
}

function showPage(pageName) {
	const page = document.querySelector(`[data-page="${pageName}"]`)
	page.toggleAttribute('data-active', true)
}

function showGameListing() {
	hidePages()
	showPage('listing')
}

function showGameBoard() {
	hidePages()
	showPage('board')
}

export function  onContentLoad(client) {
	//
	const newGameElem = document.getElementById('newGameButton')
	newGameElem.addEventListener('click', event => {
		newGameElem.disabled = true

		client.clientPort.postMessage({ user: client.user, type: 'game' })

		newGameElem.disabled = false
	})

	//
	const gameListingNav = document.getElementById('gameListingLink')
	gameListingNav.addEventListener('click', event => {
		showGameListing()
	})

	//
	const cells = document.querySelectorAll('ttt-cell[position]')
	cells.forEach(cell => {
		const moveButton = cell.querySelector('button')

		moveButton.addEventListener('click', event => {
			const board = document.getElementById('gameBoard')
			const gameId = board.getAttribute('game-id')

			const move = cell.getAttribute('position')

			client.clientPort.postMessage({ user: client.user, type: 'move', gameId, move })
		})
	})
}


export function patchGames(games) {
	const gamesTable = document.getElementById('gamesTable')

	const adds = games
	const updates = games
	const removes = games

	adds.forEach(add => {
		const templates = gamesTable.getElementsByTagName('template')
		const content = templates[0].content
		const tr = content.cloneNode(true)

		console.log('add', add)
	})

	updates.forEach(update => {

	})

	removes.forEach(remove => {
			remove.remove()
	})
}

export function patchGame(game, client) {
	const { gameId } = game

	// listing
	const gamesTable = document.getElementById('gamesTable')
	const gameRow = gamesTable.querySelector(`tr[data-game-id="${gameId}"]`)
	if (gameRow !== null) {
		// update row
		updateGameRow(gameRow, game)
	}
	else
	{
		const tr = buildGameRow(gamesTable, game, client)
		gamesTable.tBodies[0].appendChild(tr)
	}

	// game board
	const currentBoard = document.getElementById('gameBoard')
	const currentGameId = currentBoard.getAttribute('game-id')
	if(currentGameId === gameId) {
		console.log('update current game board', game.board, game.state)

		currentBoard.setAttribute('state', game.state)


		game.board.forEach((value, index) => {
			const cell = currentBoard.querySelector(`ttt-cell[position="${index}"]`)

			if(value === 0) {
				cell.removeAttribute('player')

			} else {
				cell.setAttribute('player', value)
			}

		})
	}

	// activity
	// update activity feed with user move and game offers?
}
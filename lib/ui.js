function playersToVs(game) {
    if (game.players.length <= 0) {
        return '...';
    }
    return game.players.join(' vs ');
}
function buildGameRow(gamesTable, game, client) {
    const { gameId } = game;
    function buildOfferGameHandler(offerButton, gameId) {
        const roll = Math.random();
        const OFFER_TARGET = (roll > 0.66) ? 'AI:minmax' : (roll > 0.33) ? 'AI:threat' : 'AI:random';
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            offerButton.disabled = true;
            client.clientPort.postMessage({ user: client.user, type: 'offer-game', gameId, target: OFFER_TARGET });
        };
    }
    function buildCloseGameHandler(closeButton, gameId) {
        return (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeButton.disabled = true;
            client.clientPort.postMessage({ user: client.user, type: 'close', gameId });
        };
    }
    const templates = gamesTable.getElementsByTagName('template');
    const content = templates[0].content;
    const clone = content.cloneNode(true);
    const tr = clone.children[0];
    //
    tr.setAttribute('data-game-id', gameId);
    //
    updateGameRow(tr, game);
    //
    const closeButton = tr.querySelector('button[data-close-game]');
    closeButton?.addEventListener('click', buildCloseGameHandler(closeButton, gameId), { once: true });
    const offerButton = tr.querySelector('button[data-offer-game]');
    offerButton?.addEventListener('click', buildOfferGameHandler(offerButton, gameId), { once: true });
    tr.addEventListener('click', (_event) => {
        //
        const board = document.getElementById('gameBoard');
        if (board === null) {
            console.warn('gameBoard not found');
            return;
        }
        const currentGameId = board.getAttribute('game-id');
        console.log('!! update game board', currentGameId, gameId);
        board.setAttribute('game-id', gameId);
        board.setAttribute('state', '');
        // request game update
        client.clientPort.postMessage({ user: client.user, type: 'game?', gameId });
        showGameBoard();
    });
    return tr;
}
function updateGameRow(tr, game) {
    const { gameId, state, actions } = game;
    // console.log('updateGameRow', game)
    const gameIdSlot = tr.querySelector('slot[name="gameId"]');
    const vsSlot = tr.querySelector('slot[name="vs"]');
    const stateSlot = tr.querySelector('slot[name="state"]');
    if (gameIdSlot !== null) {
        gameIdSlot.innerText = gameId;
    }
    if (vsSlot !== null) {
        vsSlot.innerText = playersToVs(game);
    }
    if (stateSlot !== null) {
        stateSlot.innerText = state;
    }
    const buttonAccept = tr.querySelector('button[data-accept-game]');
    const buttonDecline = tr.querySelector('button[data-decline-game]');
    const buttonForfeit = tr.querySelector('button[data-forfeit-game]');
    const buttonClose = tr.querySelector('button[data-close-game]');
    const buttonOffer = tr.querySelector('button[data-offer-game]');
    buttonAccept?.toggleAttribute('disabled', !actions.includes('Accept'));
    buttonDecline?.toggleAttribute('disabled', !actions.includes('Decline'));
    buttonForfeit?.toggleAttribute('disabled', !actions.includes('Forfeit'));
    buttonClose?.toggleAttribute('disabled', !actions.includes('Close'));
    buttonOffer?.toggleAttribute('disabled', !actions.includes('Offer'));
}
function hidePages() {
    const pages = document.querySelectorAll('[data-page]');
    pages.forEach(page => page.toggleAttribute('data-active', false));
}
function showPage(pageName) {
    const page = document.querySelector(`[data-page="${pageName}"]`);
    page?.toggleAttribute('data-active', true);
}
function showGameListing() {
    hidePages();
    showPage('listing');
}
function showGameBoard() {
    hidePages();
    showPage('board');
}
function _onContentLoad(client) {
    //
    const newGameElem = document.getElementById('newGameButton');
    newGameElem?.addEventListener('click', _event => {
        newGameElem.toggleAttribute('disabled', true);
        client.clientPort.postMessage({ user: client.user, type: 'game?' });
        newGameElem.toggleAttribute('disabled', false);
    });
    //
    const gameListingNav = document.getElementById('gameListingLink');
    gameListingNav?.addEventListener('click', _event => {
        showGameListing();
    });
    //
    const cells = document.querySelectorAll('ttt-cell[position]');
    cells.forEach(cell => {
        const moveButton = cell.querySelector('button');
        moveButton?.addEventListener('click', (_event) => {
            const board = document.getElementById('gameBoard');
            if (board === null) {
                console.warn('gameBoard not found');
                return;
            }
            const gameId = board.getAttribute('game-id');
            const move = cell.getAttribute('position');
            client.clientPort.postMessage({ user: client.user, type: 'move', gameId, move });
        });
    });
}
function patchGames(_games) {
    // const gamesTable = document.getElementById('gamesTable')
    // const adds = games
    // const updates = games
    // const removes = games
    // adds.forEach(add => {
    // 	const templates = gamesTable.getElementsByTagName('template')
    // 	const content = templates[0].content
    // 	const tr = content.cloneNode(true)
    // 	console.log('add', add)
    // })
    // updates.forEach(update => {
    // })
    // removes.forEach(r => {
    // 		r.remove()
    // })
}
function patchGame(game, client) {
    const { gameId } = game;
    // listing
    const gamesTable = document.getElementById('gamesTable');
    if (gamesTable !== null) {
        const gameRow = gamesTable.querySelector(`tr[data-game-id="${gameId}"]`);
        if (gameRow !== null) {
            // update row
            updateGameRow(gameRow, game);
        }
        else {
            const table = gamesTable;
            const tr = buildGameRow(gamesTable, game, client);
            table.tBodies[0].appendChild(tr);
        }
    }
    // game board
    const currentBoard = document.getElementById('gameBoard');
    if (currentBoard !== null) {
        const currentGameId = currentBoard.getAttribute('game-id');
        if (currentGameId === gameId) {
            // console.log('update current game board', game.board, game.state)
            currentBoard.setAttribute('state', game.state);
            game.board.forEach((value, index) => {
                const cell = currentBoard.querySelector(`ttt-cell[position="${index}"]`);
                if (cell === null) {
                    return;
                }
                if (value === 0) {
                    cell.removeAttribute('player');
                }
                else {
                    cell.setAttribute('player', value === client.user ? 'me' : 'opponent');
                }
            });
        }
    }
    // activity
    // update activity feed with user move and game offers?
}
function initPort(port, client) {
    port.onmessage = message => {
        // console.log({ message })
        const { data } = message;
        const { type } = data;
        const IGNORE_TYPES = ['move', 'accept', 'list-games', 'offer-game', 'close', 'game?', '_service_ping'];
        if (IGNORE_TYPES.includes(type)) {
            return;
        }
        // if(targetFor !== client.user) {
        // 	console.log('not for my user client', data)
        // 	return
        // }
        //
        if (type === 'game-listing') {
            const { games } = data;
            patchGames(games);
            return;
        }
        if (type === 'game-update') {
            //patchGameById()
            return;
        }
        if (type === 'game!') {
            patchGame(data, client);
            return;
        }
        console.warn('unknown client message', type);
    };
}
export class UI {
    #client;
    static from(port, options) {
        return new UI(port, options);
    }
    constructor(port, options) {
        this.#client = { user: options.user, clientPort: port };
        initPort(port, this.#client);
    }
    onContentLoad() {
        _onContentLoad(this.#client);
    }
}
//# sourceMappingURL=ui.js.map
function isOwner(game, user) { return game.owner === user; }
function isPlayer(game, user) { return game.players?.includes(user); }
function isChallenger(game, user) { return game.offers?.includes(user); }
function isActive(game, user) { return game.active?.includes(user); }
function isViewable(game, user) {
    return isOwner(game, user) ||
        isChallenger(game, user) ||
        isPlayer(game, user) ||
        isActive(game, user);
}
export const EMPTY = 0;
const STATES = {
    NEW: 'new',
    PENDING: 'pending',
    ACTIVE: 'active',
    RESOLVED: 'resolved'
};
const ACTIONS = {
    ACCEPT: 'Accept',
    DECLINE: 'Decline',
    FORFEIT: 'Forfeit',
    CLOSE: 'Close',
    MOVE: 'Move',
    OFFER: 'Offer',
};
const MACHINA = {
    owner: {
        [STATES.NEW]: [ACTIONS.CLOSE, ACTIONS.OFFER],
        [STATES.PENDING]: [ACTIONS.CLOSE],
        [STATES.ACTIVE]: [ACTIONS.CLOSE]
    },
    challenger: {
        [STATES.PENDING]: [ACTIONS.ACCEPT, ACTIONS.DECLINE],
        [STATES.ACTIVE]: [] // accept/decline - late to the game?
    },
    player: {
        [STATES.ACTIVE]: [ACTIONS.MOVE, ACTIONS.FORFEIT],
    }
};
function firstPlayer(game) {
    return [game.players[0]];
}
function nextPlayerAfterUser_RR(game, user) {
    const { players } = game;
    const idx = players.indexOf(user);
    if (idx < 0) {
        return [];
    }
    const nextVirtualIdx = idx + 1;
    if (nextVirtualIdx >= players.length) {
        return [players[0]];
    }
    return [players[nextVirtualIdx]];
}
export class Board {
    static defaultBoard() {
        const e = EMPTY;
        return [
            e, e, e, e, e, e, e, e, e
        ];
    }
    static isFull(board) {
        return !board.includes(EMPTY);
    }
    static winningUser(board) {
        function matchUser(...args) {
            const firstUser = board[args[0]];
            if (firstUser === EMPTY) {
                return false;
            }
            return args
                .map(boardIdx => board[boardIdx])
                .every(user => user === firstUser);
        }
        // hardcoded rules
        if (matchUser(0, 1, 2)) {
            return board[0];
        }
        if (matchUser(3, 4, 5)) {
            return board[3];
        }
        if (matchUser(6, 7, 8)) {
            return board[6];
        }
        if (matchUser(0, 3, 6)) {
            return board[0];
        }
        if (matchUser(1, 4, 7)) {
            return board[1];
        }
        if (matchUser(2, 5, 8)) {
            return board[2];
        }
        if (matchUser(0, 4, 8)) {
            return board[4];
        }
        if (matchUser(2, 4, 6)) {
            return board[4];
        }
        return EMPTY;
    }
    static isWin(board) {
        const winner = Board.winningUser(board);
        return winner !== EMPTY;
    }
    static isDraw(board) {
        if (!Board.isFull(board)) {
            return false;
        }
        return !Board.isWin(board);
    }
    static isResolved(board) {
        return Board.isFull(board) || Board.isWin(board);
    }
}
export class Action {
    static actionsFor(game, user) {
        const { state } = game;
        if (state === undefined) {
            return [];
        }
        const o = isOwner(game, user) ? MACHINA.owner[state] ?? [] : [];
        const p = isPlayer(game, user) ? MACHINA.player[state] ?? [] : [];
        const c = isChallenger(game, user) ? MACHINA.challenger[state] ?? [] : [];
        return [...new Set([...o, ...p, ...c])];
    }
}
class TTT {
    static games = new Map();
    // static gameCleanerTimer: number
    static actionableGame(game, user, note) {
        const actions = Action.actionsFor(game, user);
        return {
            ...game,
            actions,
            note
        };
    }
    static uniqueId() {
        while (true) {
            const id = `${Math.floor(Math.random() * 1000)}`;
            if (!TTT.games.has(id)) {
                return id;
            }
        }
    }
    static handleListGames(user) {
        return [...TTT.games.values()]
            .filter(game => isViewable(game, user))
            .map(game => ({
            gameId: game.gameId,
            state: game.state
        }));
    }
    static handleNewGame(user) {
        const newGame = {
            gameId: TTT.uniqueId(),
            state: STATES.NEW,
            owner: user,
            players: [],
            offers: [],
            active: [],
            board: Board.defaultBoard(),
            createdAt: Date.now(),
            // resolvedAt: undefined
            // winners: []
        };
        TTT.games.set(newGame.gameId, newGame);
        return TTT.actionableGame(newGame, user);
    }
}
export { TTT };
export class TTTOwner {
    static handleOfferGame(game, user, offer) {
        const { target, autoAccept } = offer;
        if (!isOwner(game, user)) {
            return TTT.actionableGame(game, user, 'not the owner');
        }
        if (game.state !== STATES.NEW) {
            return TTT.actionableGame(game, user, 'can only offer new games');
        }
        const offers = game.offers !== undefined ?
            [...game.offers, target] : [target];
        const players = autoAccept ? [...game.players, user] : game.players;
        const newGame = {
            ...game,
            players,
            offers,
            state: STATES.PENDING
        };
        TTT.games.set(game.gameId, newGame);
        return TTT.actionableGame(newGame, user);
    }
    static handleCloseGame(game, user) {
        if (!isOwner(game, user)) {
            return TTT.actionableGame(game, user, 'not the owner');
        }
        if (game.state === STATES.RESOLVED) {
            return TTT.actionableGame(game, user, 'game already closed');
        }
        const newGame = {
            ...game,
            active: [],
            state: STATES.RESOLVED
        };
        TTT.games.set(game.gameId, newGame);
        return TTT.actionableGame(newGame, user);
    }
}
export class TTTPlayer {
    static handleMove(game, user, move) {
        const { gameId, state } = game;
        if (state !== STATES.ACTIVE) {
            return TTT.actionableGame(game, user, 'can not move on a non-active game');
        }
        if (!isPlayer(game, user)) {
            return TTT.actionableGame(game, user, 'only players can make moves');
        }
        if (!isActive(game, user)) {
            return TTT.actionableGame(game, user, 'only active players can make moves');
        }
        if (game.board[move] !== EMPTY) {
            return TTT.actionableGame(game, user, 'invalid move, cell taken');
        }
        const nextActive = nextPlayerAfterUser_RR(game, user);
        //
        const nextBoard = game.board;
        nextBoard[move] = user;
        const nextState = Board.isResolved(nextBoard) ? STATES.RESOLVED : game.state;
        // const winner = Board.winningUser(nextBoard)
        const newGame = {
            ...game,
            board: nextBoard,
            active: nextActive,
            state: nextState
        };
        TTT.games.set(gameId, newGame);
        return TTT.actionableGame(newGame, user);
    }
    static handleForfeit(game, user) {
        const { state } = game;
        if (state !== STATES.ACTIVE) {
            return TTT.actionableGame(game, user, 'can not forfeit a non-active game');
        }
        if (!isPlayer(game, user)) {
            return TTT.actionableGame(game, user, 'only players can forfeit');
        }
        if (!isActive(game, user)) {
            return TTT.actionableGame(game, user, 'only active players can forfeit');
        }
        const newGame = {
            ...game,
            active: [],
            state: STATES.RESOLVED
        };
        TTT.games.set(game.gameId, newGame);
        return TTT.actionableGame(newGame, user);
    }
}
export class TTTChallenger {
    static handleAcceptOffer(game, user) {
        if (game.state !== STATES.PENDING) {
            return TTT.actionableGame(game, user, 'can only accept pending games');
        }
        if (!isChallenger(game, user)) {
            return TTT.actionableGame(game, user, 'only challenger can accept a game');
        }
        const offers = game.offers.filter(offer => offer !== user);
        const players = [...game.players, user];
        const state = STATES.ACTIVE;
        const active = firstPlayer(game);
        const newGame = {
            ...game,
            state,
            active,
            offers,
            players
        };
        TTT.games.set(game.gameId, newGame);
        return TTT.actionableGame(newGame, user);
    }
    static handleDeclineOffer(game, user) {
        if (!isChallenger(game, user)) {
            return TTT.actionableGame(game, user, 'only challenger can decline');
        }
        const offers = game.offers?.filter(offer => offer !== user) ?? [];
        const state = STATES.RESOLVED;
        const newGame = {
            ...game,
            state,
            offers
        };
        TTT.games.set(game.gameId, newGame);
        return TTT.actionableGame(newGame, user);
    }
}
//# sourceMappingURL=ttt.js.map
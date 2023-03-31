import { Game, User, Offer, GenericGameBoard, ActionableGame } from './ttt.types';
export declare const EMPTY = 0;
export declare class Board {
    static defaultBoard<T>(): GenericGameBoard<T>;
    static isFull<T>(board: GenericGameBoard<T>): boolean;
    static winningUser<T>(board: GenericGameBoard<T>): 0 | T;
    static isWin<T>(board: GenericGameBoard<T>): boolean;
    static isDraw<T>(board: GenericGameBoard<T>): boolean;
    static isResolved<T>(board: GenericGameBoard<T>): boolean;
}
export declare class Action {
    static actionsFor(game: Game, user: User): string[];
}
export declare class TTT {
    static games: Map<any, any>;
    static actionableGame(game: Game, user: User, note?: string): ActionableGame;
    static uniqueId(): string;
    static handleListGames(user: User): {
        gameId: any;
        state: any;
    }[];
    static handleNewGame(user: User): ActionableGame;
}
export declare class TTTOwner {
    static handleOfferGame(game: Game, user: User, offer: Offer): ActionableGame;
    static handleCloseGame(game: Game, user: User): ActionableGame;
}
export declare class TTTPlayer {
    static handleMove(game: Game, user: User, move: number): ActionableGame;
    static handleForfeit(game: Game, user: User): ActionableGame;
}
export declare class TTTChallenger {
    static handleAcceptOffer(game: Game, user: User): ActionableGame;
    static handleDeclineOffer(game: Game, user: User): ActionableGame;
}
//# sourceMappingURL=ttt.d.ts.map
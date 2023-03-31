import { User, GameID, GameBoardIndex, Game, State, WithActions } from './ttt.types.js';
export type SystemMessageType = '_service_ping' | '';
export type ClientMessageType = SystemMessageType | 'list-games' | 'game?' | 'offer-game' | 'close' | 'accept' | 'decline' | 'move' | 'forfeit';
export type ServiceMessageType = SystemMessageType | 'game-listing' | 'game-update' | 'game!';
export type TypedMessage<T> = {
    type: T;
};
export type WithUser = {
    user: User;
};
export type WithId = {
    gameId: GameID;
};
export type ClientUserMessage = TypedMessage<ClientMessageType> & WithUser;
export type ClientGameMessage = ClientUserMessage & WithId;
export type ListGamesMessage = ClientUserMessage & {
    type: 'list-games';
};
export type GameMessage = ClientUserMessage & {
    type: 'game?';
    gameId?: GameID;
};
export type OfferMessage = ClientGameMessage & {
    type: 'offer-game';
    target: string;
};
export type CloseMessage = ClientGameMessage & {
    type: 'close';
};
export type AcceptMessage = ClientGameMessage & {
    type: 'accept';
};
export type DeclineMessage = ClientGameMessage & {
    type: 'decline';
};
export type MoveMessage = ClientGameMessage & {
    type: 'move';
    move: GameBoardIndex;
};
export type ForfeitMessage = ClientGameMessage & {
    type: 'forfeit';
};
export type ServiceMessage = TypedMessage<ServiceMessageType> & WithUser & {
    for: string;
};
export type GameListingMessage = ServiceMessage & {
    type: 'game-listing';
    games: Array<Game>;
};
export type GameUpdate = ServiceMessage & WithId & WithActions & {
    type: 'game-update';
    state: State;
};
export type GameInfo = ServiceMessage & Game & {
    type: 'game!';
};
//# sourceMappingURL=service.msg-types.d.ts.map
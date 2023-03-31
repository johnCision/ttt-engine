export declare const MSG_TYPES: {
    LISTING: string;
    UPDATE: string;
    GAME: string;
};
export declare const CLIENT_MSG_TYPES: {
    LIST: string;
    GAME: string;
    OFFER: string;
    CLOSE: string;
    ACCEPT: string;
    DECLINE: string;
    MOVE: string;
    FORFEIT: string;
};
export declare class Service {
    #private;
    static from(port: MessagePort | BroadcastChannel): Service;
    constructor(port: MessagePort | BroadcastChannel);
    close(): void;
}
//# sourceMappingURL=service.d.ts.map
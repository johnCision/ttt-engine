import { User } from './ttt.types.js';
export type Strategy = 'threat' | 'random' | 'minmax' | 'alphabeta';
type Strategies = {
    THREAT: Strategy;
    RANDOM: Strategy;
    MINMAX: Strategy;
    ALPHABETA: Strategy;
};
export declare const STRATEGIES: Strategies;
export type AIOptions = {
    strategy: Strategy;
    user: User;
};
export declare const DEFAULT_STRATEGY: Strategy;
export declare class AI {
    #private;
    static from(port: MessagePort | BroadcastChannel, options: AIOptions): AI;
    constructor(port: MessagePort | BroadcastChannel, options: AIOptions);
    close(): void;
}
export {};
//# sourceMappingURL=ai.d.ts.map
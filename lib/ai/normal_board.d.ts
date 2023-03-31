import { User, GameBoard, NormalGameBoard, NormalCell } from '../ttt.types.js';
export declare const NORMAL_SELF = 1;
export declare const NORMAL_OPPONENT = -1;
export declare class NormalBoard {
    static normalize(board: GameBoard, user: User): (0 | 1 | -1)[];
    static heuristic(board: NormalGameBoard): number;
    static potentialBoards(startBoard: NormalGameBoard, normalPlayer: NormalCell): {
        move: number;
        board: NormalCell[];
    }[];
}
//# sourceMappingURL=normal_board.d.ts.map
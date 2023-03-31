import { EMPTY } from '../ttt.js';
import { NormalBoard, NORMAL_SELF, NORMAL_OPPONENT } from '../ai/normal_board.js';
export function evaluateMove(originalBoard, user) {
    function calcThreatMatrix(board) {
        const threatMatrix = [...board].map(() => 0);
        const winningCombinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];
        function comboFirstEmptyIdx(board, combo) {
            return combo
                .map(idx => ({ idx, value: board[idx] }))
                .filter(({ value }) => value === EMPTY)[0]?.idx;
        }
        function comboUserCount(board, normalUser, combo) {
            return combo.reduce((acc, idx) => {
                if (board[idx] === EMPTY) {
                    return acc;
                }
                if (board[idx] !== normalUser) {
                    return acc;
                }
                return acc + 1;
            }, 0);
        }
        function comboSelfCount(board, combo) {
            return comboUserCount(board, NORMAL_SELF, combo);
        }
        function comboOpponentCount(board, combo) {
            return comboUserCount(board, NORMAL_OPPONENT, combo);
        }
        winningCombinations.forEach(combo => {
            const emptyIdx = comboFirstEmptyIdx(board, combo);
            // console.log('chk context', combo, emptyIdx, board[emptyIdx])
            if (emptyIdx === undefined || board[emptyIdx] !== EMPTY) {
                return;
            }
            const selfCount = comboSelfCount(board, combo);
            const opponentCount = comboOpponentCount(board, combo);
            // console.log('check combo', combo, emptyIdx, selfCount, opponentCount)
            if (selfCount === 0 && opponentCount > 1) {
                threatMatrix[emptyIdx] += 1;
            }
            else if (opponentCount === 0 && selfCount > 1) {
                threatMatrix[emptyIdx] += 1;
            }
        });
        return threatMatrix;
    }
    const normalBoard = NormalBoard.normalize(originalBoard, user);
    const tm = calcThreatMatrix(normalBoard);
    // console.log(normalBoard, tm)
    const move = [...new Array(normalBoard.length)]
        .reduce((acc, _, index) => {
        const value = normalBoard[index];
        if (value !== EMPTY) {
            return acc;
        }
        const threat = tm[index];
        // console.log('reduce', value, index, threat, acc.threat)
        if (threat <= acc.threat) {
            return acc;
        }
        return {
            idx: index,
            threat
        };
    }, { idx: undefined, threat: -Infinity });
    // console.log(move)
    return { move: move.idx };
}
//# sourceMappingURL=threat_matrix.js.map

const BOARD_SIZE = 9

export function evaluateMove(board, user) {
	return { move: Math.floor(Math.random() * BOARD_SIZE) }
}
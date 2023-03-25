import { Board } from '../ttt.js'
import {
	NormalBoard,
	NORMAL_SELF, NORMAL_OPPONENT
} from './normal_board.js'

function pick(from) {
	// console.log('pick from', from)
	return from.sort((a, b) => b.value - a.value)[0]
}

function ab(board, depth, A, B, maximizing) {
	if(depth === 0) { return NormalBoard.heuristic(board) }
	if(Board.isResolved(board)) { return NormalBoard.heuristic(board) }

	if(maximizing) {
		return NormalBoard.potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
			const value = Math.max(acc, ab(proposedMove.board, depth - 1, A, B, !maximizing))
			A = Math.max(A, value)
			if(value >= B) { return acc }
			return value
		}, -Infinity)
	}

	return NormalBoard.potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
		const value = Math.min(acc, ab(proposedMove.board, depth - 1, A, B, !maximizing))
		B = Math.min(B, value)
		if(value <= A) { return acc }
		return value
	}, Infinity)
}

export function evaluateMove(board, user) {
	const depth = 8

	return pick(NormalBoard.potentialBoards(NormalBoard.normalize(board, user), NORMAL_SELF).map(proposedMove => {
		return {
			move: proposedMove.move,
			value: ab(proposedMove.board, depth, -Infinity, Infinity, true)
		}
	}))
}

import { Board } from '../ttt.js'
import { Proposal, User, GameBoard, NormalGameBoard } from '../ttt.types.js'
import {
	NormalBoard,
	NORMAL_SELF, NORMAL_OPPONENT
} from './normal_board.js'

function pick(from: Array<Proposal>) {
	// console.log('pick from', from)
	return from.sort((a, b) => b.value - a.value)[0]
}

function mm(board: NormalGameBoard, depth: number, maximizing: boolean): number {
	if(depth === 0) { return NormalBoard.heuristic(board) }
	if(Board.isResolved(board)) { return NormalBoard.heuristic(board) }

	if(maximizing) {
		return NormalBoard.potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
			return Math.max(acc, mm(proposedMove.board, depth - 1, !maximizing))
		}, -Infinity)
	}

	return NormalBoard.potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
		return Math.min(acc, mm(proposedMove.board, depth - 1, !maximizing))
	}, Infinity)
}

export function evaluateMove(board: GameBoard, user: User) {
	const depth = 8

	return pick(NormalBoard.potentialBoards(NormalBoard.normalize(board, user), NORMAL_SELF).map(proposedMove => {
		return {
			move: proposedMove.move,
			value: mm(proposedMove.board, depth, false)
		}
	}))
}

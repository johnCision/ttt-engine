import { User, GameBoard, NormalGameBoard, NormalCell } from '../ttt.types.js'
import { Board, EMPTY } from '../ttt.js'

export const NORMAL_SELF = 1
export const NORMAL_OPPONENT = -1

export class NormalBoard {
	static normalize(board: GameBoard, user: User) {
		return board.map(cell => {
			if(cell === EMPTY) { return EMPTY }
			return cell === user ? NORMAL_SELF : NORMAL_OPPONENT
		})
	}

	static heuristic(board: NormalGameBoard) {
		const factor = 1

		const winner = Board.winningUser(board)
		// console.log('board winer', board, winner)

		if(winner === EMPTY) { return factor * -0.25 }
		if(winner === NORMAL_SELF) { return factor * 1 }
		return factor * -1
	}

	static potentialBoards(startBoard: NormalGameBoard, normalPlayer: NormalCell) {
		return startBoard
			.map((cell, idx) => ({ idx, cell }))
			.filter(({ cell }) => cell === EMPTY)
			.map(({ idx }) => idx)
			.map(idx => {
				const potentialBoard = [ ...startBoard ]
				potentialBoard[idx] = normalPlayer
				return { move: idx, board: potentialBoard }
			})
	}
}

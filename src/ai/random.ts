import { User } from '../ttt.types'
import { NormalBoard } from './normal_board.js'

const BOARD_SIZE = 9

export function evaluateMove(_board: NormalBoard, _user: User) {
	return { move: Math.floor(Math.random() * BOARD_SIZE) }
}
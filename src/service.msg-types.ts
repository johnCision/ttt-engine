import { User } from './ttt.types.js'


export type ClientMessage = {
	gameId: number

	user: User,
	move: number,
	target: string
}

export type ServiceMessage = {
	gameId: number
}
export type User = string
export type State = string

export type Cell<T> = T
export type GenericGameBoard<T> = Array<Cell<T>>
export type GameBoardIndex = number

export type GameCell = 0 | User
export type NormalCell = 0 | 1 | -1

export type GameBoard = GenericGameBoard<GameCell>
export type NormalGameBoard = GenericGameBoard<NormalCell>

export type GameID = string

export type Game = {
	gameId: GameID,
	owner: User,
	players: Array<User>,
	offers: Array<User>,
	active: Array<User>,

	state: State,
	board: GameBoard,

	createdAt?: number
}

export type WithActions = {
	actions: Array<string>,
}

export type ActionableGame = Game & WithActions & {
	note?: string
}

export type Offer = {
	target: User,
	autoAccept: boolean
}

export type Combination = [ GameBoardIndex, GameBoardIndex, GameBoardIndex]

export type Proposal = { move: GameBoardIndex, value: number }

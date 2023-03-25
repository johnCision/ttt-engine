import { Board, EMPTY } from './ttt.js'

const AI_USER = 'AI'



function evaluateMove_rand(board, user) {
	return Math.floor(Math.random() * 9)
}


const NORMAL_SELF = 1
const NORMAL_OPPONENT = -1
function normalizeBoard(board, user) {
	return board.map(cell => {
		if(cell === EMPTY) { return EMPTY }
		return cell === user ? NORMAL_SELF : NORMAL_OPPONENT
	})
}

function potentialBoards(startBoard, normalPlayer) {
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

function heuristic(board) {
	const factor = 1

	const winner = Board.winningUser(board)
	// console.log('board winer', board, winner)

	if(winner === EMPTY) { return factor * -0.25 }
	if(winner === NORMAL_SELF) { return factor * 1 }
	return factor * -1
}

function pick(from) {
	console.log('pick from', from)
	return from.sort((a, b) => b.value - a.value)[0]
}

function evaluateMove_fake(originalBoard, user) {
	function fake(board, depth, forMe, history) {
		// console.log('fake', depth, board, history)
		return potentialBoards(board, forMe ? NORMAL_SELF : NORMAL_OPPONENT).map((proposedMove) => {
			const { move, board } = proposedMove
			// console.log(depth, proposedMove)

			const factor = 1 // Math.pow(100, MAX_DEPTH - depth)

			if(depth >= MAX_DEPTH) { return { move, value: factor * 0.01, depth, history: [ ...history, move ] } }

			if(Board.isResolved(board)) {
				return { move, value: heuristic(board), depth, history: [ ...history, move ] }
			}

			return {
				move,
				value: fake(board, depth + 1, !forMe, [ ...history, move ])
					.reduce((acc, pm) => forMe ? Math.max(acc, pm.value) : Math.min(acc, pm.value), 0),
				depth,
				history: [ ...history, move ]
			}
		})
	}

	const MAX_DEPTH = 8
	return pick(minmax(normalizeBoard(originalBoard, user), 0, true, []))
}

function mm(board, depth, maximizing) {
	if(depth === 0) { return heuristic(board) }
	if(Board.isResolved(board)) { return heuristic(board) }

	if(maximizing) {
		return potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
			return Math.max(acc, mm(proposedMove.board, depth - 1, !maximizing))
		}, -Infinity)
	}

	return potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
		return Math.min(acc, mm(proposedMove.board, depth - 1, !maximizing))
	}, Infinity)
}

function ab(board, depth, A, B, maximizing) {
	if(depth === 0) { return heuristic(board) }
	if(Board.isResolved(board)) { return heuristic(board) }

	if(maximizing) {
		return potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
			const value = Math.max(acc, ab(proposedMove.board, depth - 1, A, B, !maximizing))
			A = Math.max(A, value)
			if(value >= B) { return acc }
			return value
		}, -Infinity)
	}

	return potentialBoards(board, maximizing ? NORMAL_SELF : NORMAL_OPPONENT).reduce((acc, proposedMove) => {
		const value = Math.min(acc, ab(proposedMove.board, depth - 1, A, B, !maximizing))
		B = Math.min(B, value)
		if(value <= A) { return acc }
		return value
	}, Infinity)
}

function evaluateMove_ab(board, user) {
	const depth = 0

	return potentialBoards(normalizeBoard(board, user), NORMAL_SELF).map(proposedMove => {
		return {
			move: proposedMove.move,
			value: ab(proposedMove.board, depth, -Infinity, Infinity, false)
		}
	})
}

function evaluateMove_mm(board, user) {
	const depth = 7

	return pick(potentialBoards(normalizeBoard(board, user), NORMAL_SELF).map(proposedMove => {
		return {
			move: proposedMove.move,
			value: mm(proposedMove.board, depth, false)
		}
	}))
}

function evaluateMove_threatMatrix(originalBoard, user) {
	function calcThreatMatrix(board) {
		const threatMatrix = [ ...board ].map(() => 0)

		const winningCombinations = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],

			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],

			[0, 4, 8],
			[2, 4, 6]
		]

		function comboFirstEmptyIdx(board, combo) {
			return combo
				.map(idx =>({ idx, value: board[idx] }))
				.filter(({ value }) => value === EMPTY)
				[0]?.idx
		}

		function comboUserCount(board, normalUser, combo) {
			return combo.reduce((acc, idx) => {
				if(board[idx] === EMPTY) { return acc }
				if(board[idx] !== normalUser) { return acc }

				return acc + 1
			}, 0)
		}

		function comboSelfCount(board, combo) {
			return comboUserCount(board, NORMAL_SELF, combo)
		}

		function comboOpponentCount(board, combo) {
			return comboUserCount(board, NORMAL_OPPONENT, combo)
		}

		winningCombinations.forEach(combo => {
			const emptyIdx = comboFirstEmptyIdx(board, combo)
			// console.log('chk context', combo, emptyIdx, board[emptyIdx])
			if(emptyIdx === undefined || board[emptyIdx] !== EMPTY) { return }

			const selfCount = comboSelfCount(board, combo)
			const opponentCount = comboOpponentCount(board, combo)

			console.log('check combo', combo, emptyIdx, selfCount, opponentCount)

			if(selfCount === 0 && opponentCount > 1) {
				threatMatrix[emptyIdx] += 1
			}
			else if(opponentCount === 0 && selfCount > 1) {
				threatMatrix[emptyIdx] += 1
			}
		})

		return threatMatrix
	}

	const normalBoard = normalizeBoard(originalBoard, user)
	const tm = calcThreatMatrix(normalBoard)
	console.log(normalBoard, tm)

	const move = [ ...new Array(normalBoard.length) ]
		.reduce((acc, _, index) => {
			const value = normalBoard[index]
			if(value !== EMPTY) { return acc }

			const threat = tm[index]

			console.log('reduce', value, index, threat, acc.threat)

			if(threat <= acc.threat) { return acc }

			return {
				idx: index,
				threat
			}
		}, { idx: undefined, threat: -Infinity })

		console.log(move)

		return { move: move.idx }
}

function evaluateMove(board, user) {
	// return evaluateMove_rand(board, user)
	// return evaluateMove_fake(board, user)
	// return evaluateMove_mm(board, user)
	// return evaluateMove_ab(board, user)
	return evaluateMove_threatMatrix(board, user)
}

function initPort(port) {
	port.onmessage = message => {
		const { data } = message
		const { type } = data

		const CLIENT_TYPES = ['list-games', 'offer-game', 'move']
		if(CLIENT_TYPES.includes(type)) {
			return
		}

		if (type === 'game-listing') {
			console.log('AI:Listing', data)
			return
		}

		if (type === 'game') {
			// console.log('AI:Game Info', data)
			const { active, offers, state, gameId, board } = data

			// accept offers
			if(state === 'pending') {
				if(offers.includes(AI_USER)) {
					console.log('AI:Game - accept')
					port.postMessage({ user: AI_USER, type: 'accept', gameId })
				}

				return
			}

			if(state === 'active') {
				if(active.includes(AI_USER)) {
					console.log('AI:Game - my move')

					setTimeout(() => {
						// make move
						const { move } = evaluateMove(board, AI_USER)

						port.postMessage({
							user: AI_USER,
							type: 'move',
							gameId,
							move
						})
					}, 1000 * Math.random() * 4 + 1)

				}

				return
			}

			return
		}

		if (type === 'game-update') {
			// console.log('AI:Update', data)
			// const { gameId } = data
			return
		}

		if (type === 'game-offer') {
			console.log('AI:Game Offer', from)
			return
		}

		console.warn('unhandled message', type)
	}

	return port
}

export class AI {
	#port

	static from(port) {
		return new AI(port)
	}

	constructor(port) { this.#port = initPort(port) }
}



const move = evaluateMove([
	'X',  0,  0,
	 0,  0,   0,
	 0,  '.',   '.',
], 'X')

console.log('move', move)
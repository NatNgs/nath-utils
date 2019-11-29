const ASTRO = 'astro' // should be the same as css class (without the orientation digit at end)
const WALL = 'wall' // should be the same as css class
const COIN = 'coin' // should be the same as css class
const mapActionToCode = {
	'wait': -1, 'mv_u': 1, 'mv_l': 2, 'mv_d': 3, 'mv_r': 4, 'rt_l': 5, 'rt_r': 6,
}


function idOf(x, y) {
	return `${x}_${y}`
}

/**
 * Usage:
 * 1- new Board()
 *
 * 2- Setup params (if need others than default values)
 *     - board.size (int strictly positive)
 *     - board.wallChance (float between 0 and 1 excluded)
 *     - board.astroCollide (boolean)
 *     - board.startsAtSameLocation (boolean, useless if astoCollide true)
 *     - board.maxTurns (int strictly positive, or 0 to set infinity)
 *     - board.onEnd (callback function)
 *     - board.coinsNumber (int positive or 0)
 *     - board.seed (int, for random numbers)
 *
 * 3- call board.reset() to initiate the board
 *
 * 4- call how many time needed:
 *     - board.addPlayer(player)
 *     - board.addObserver(observer)
 *
 * 5- call board.launch() !
 *
 * 6- redo from point 2 (setup params) as you want
 */
function Board() {
	const THIS = this

	this.size = 15 // map size = Value×2+1 (-this.size to this.size)
	this.wallChance = 0.25
	this.astroCollide = true
	this.maxTurns = 0 // lower than 1 means infinity
	this.coinsNumber = 20
	this.onEnd = null // function
	this.startsAtSameLocation = false // need astroCollide = true
	this.seed = 0

	const allPlayers = []
	const allAstros = []
	const observers = []
	const score = new Map()
	const walls = new Set()
	const coins = new Set()

	let currTurn
	let rnd

	// // // Public functions
	this.launch = function() {
		if(THIS.maxTurns > 0 && currTurn >= THIS.maxTurns) {
			currTurn = 0
			if(THIS.onEnd)
				THIS.onEnd()
		} else {
			currTurn++
			turnA()
		}
	}

	this.getScores = function() {
		const scores = []
		for(let s of score.keys())
			scores.push({name: s.name, pts: score.get(s)})
		return scores
	}
	this.softReset = function() {
		const oldPlayers = []
		const oldObservers = []
		while(allPlayers.length)
			oldPlayers.push(allPlayers.shift())
		while(observers.length)
			oldObservers.push(observers.shift())

		this.reset()

		while(oldPlayers.length)
			this.addPlayer(oldPlayers.shift())
		while(oldObservers.length)
			this.addObserver(oldObservers.shift())

	}
	this.reset = function() {
		rnd = new Random(this.seed)

		/// Clear all
		currTurn = 0

		coins.clear()
		walls.clear()
		score.clear()

		while(allPlayers.shift());
		while(allAstros.shift());
		while(observers.shift());

		/// Regenerate map
		// Random walls
		for(let i = -this.size; i < this.size; i++)
			for(let j = -this.size; j < this.size; j++)
				if(rnd.next() < this.wallChance)
					walls.add(idOf(i, j))

		// world border
		for(let i = -this.size; i < this.size; i++) {
			walls.add(idOf(i, -this.size-1))
			walls.add(idOf(i, this.size+1))
			walls.add(idOf(-this.size-1, i))
			walls.add(idOf(this.size+1, i))
		}

		// coins
		for(let i = this.coinsNumber; i > 0; --i)
			addNewCoin()
	}

	/**
	 * @param x, y, flags
	 * flags&1 = Walls >> returns constant WALL
	 * flags&2 = Players >> returns constant ASTRO + [0-3] (orientation)
	 * flags&4 = Coins >> returns constant COIN
	 * else return false
	 */
	this.getCell = function(x, y, flags) {
		const id = idOf(x, y)
		if(flags & 1 && walls.has(id))
			return WALL

		if(flags & 4 && coins.has(id))
			return COIN

		if(flags & 2 && this.astroCollide)
			for(let astro of allAstros)
				if(astro.x === x && astro.y === y)
					return ASTRO + astro.rot

		return false
	}
	this.isSomethingAround = function(x, y, flags, distAround = 1) {
		for(let dx=-distAround; dx<=distAround; dx++)
			for(let dy=-distAround; dy<=distAround; dy++)
				if(this.getCell(x+dx, y+dy, flags))
					return false
		return true
	}

	this.addPlayer = function(player) {
		const astro = new Astro(this)
		player.setAstro(this, astro)

		if(allAstros.length && this.startsAtSameLocation && this.astroCollide) {
			astro.x = allAstros[0].x
			astro.y = allAstros[0].y
			astro.rot = allAstros[0].rot
		} else {
			let tries = 1000;
			do {
				if(--tries < 0) {
					console.error('FAIL', walls, coins)
					return;
				}
				astro.x = rnd.next(this.size - 1, -(this.size - 1)) | 0
				astro.y = rnd.next(this.size - 1, -(this.size - 1)) | 0
			} while(this.getCell(astro.x, astro.y, 0b111));

			astro.rot = rnd.next(4) | 0
			while(astro.fly()) ;  // move till next wall
		}

		allPlayers.push(player)
		allAstros.push(astro)
		score.set(astro, 0)
	}

	this.addObserver = function(newObserver) {
		observers.push(newObserver)
	}
	this.remObserver = function(newObserver) {
		let i = observers.indexOf(newObserver)
		if(i === observers.length)
			observers.pop()
		else if(i)
			observers[i] = observers.pop()
	}

	// // // Private Functions
	/**
	 * Ask next player to choose an action
	 * will call Astro.askForAction function, giving a callback.
	 *
	 * This callback have one parameter, integer from -1 to 5
	 *  -1: WAIT (skip action and let others play)
	 *   0: MOVE UP / JUMP UP
	 *   1: MOVE LEFT / JUMP LEFT
	 *   2: MOVE DOWN / JUMP DOWN
	 *   3: MOVE RIGHT / JUMP RIGHT
	 *   4: ROTATE LEFT
	 *   5: ROTATE RIGHT
	 *
	 * If cannot do the action or any other value as callback parameter,
	 * callback will return false and wait for another choice.
	 * If was possible, callback will return true, and then will not accept any more call to it (will return true indefinitelly)
	 */
	const turnA = function(whoNext = 0) {
		if(whoNext > allAstros.length) {
			setTimeout(THIS.launch, 0)
			return
		}

		const curr = allAstros[whoNext]

		// Prepare callback
		const next = () => {
			if(THIS.getCell(curr.x, curr.y, 0b100)) {
				coins.delete(idOf(curr.x, curr.y))
				score.put(curr, score.get(curr)+1)
				addNewCoin(this)
			}
			setTimeout(() => turnA(whoNext+1), 0)
		}

		// Update displays
		for(let display of observers)
			display.notifyUpdates()

		if(curr.fly()) { // try to fly (true if done, false if not flying)
			next()
		} else {
			curr.askForAction((actionName) => {
				const action = mapActionToCode[actionName]

				if(!action // command out of bounds
					|| (action >= 1 && action <= 4 && !curr.move(action - 1)) // MOVE command
					|| (action >= 5 && action <= 6 && !curr.diag(action - 5))) // DIAG command
					return false // cannot do this move

				next()
				return true
			})
		}
	}
	const addNewCoin = function() {
		let newX
		let newY
		let tries = 1000
		do {
			newX = rnd.next(THIS.size -1, -(THIS.size -1)) | 0
			newY = rnd.next(THIS.size -1, -(THIS.size -1)) | 0
		} while(THIS.getCell(newX, newY, 0b111)
			&& (tries < 0
				|| THIS.isSomethingAround(newX, newY, 0b110)));
		coins.add(idOf(newX, newY))
	}
}

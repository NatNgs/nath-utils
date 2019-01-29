const ASTRO = 'astro' // should be the same as css class (without the orientation digit at end)
const WALL = 'wall' // should be the same as css class
const COIN = 'coin' // should be the same as css class
const mapActionToCode = {
	'wait':-1,
	'mv_u': 1,
	'mv_l': 2,
	'mv_d': 3,
	'mv_r': 4,
	'rt_l': 5,
	'rt_r': 6
}


function idOf(x,y) {
	return 'c'+x+'_'+y
}

function Board() {
	const THIS = this

	this.size = 10 // map size = Value×2+1 (-this.size to this.size)
	this.wallChance = 0.25 // between 0 and 1
	this.astroCollide = true
	this.maxTurns = 0
	this.onEnd = null // function
	this.turnDuration = 200
	this.coinsNumber = 20

	const allAstros = []
	const observers = []
	const walls = new Set()
	const coins = new Set()
	const score = new Map()
	let currTurn = 0

	// // // Public functions
	this.launch = function() {
		if(THIS.maxTurns > 0 && currTurn >= THIS.maxTurns) {
			if(THIS.onEnd)
				THIS.onEnd()
		} else {
			currTurn++
			turnA([...allAstros])
		}
	}

	this.getScores = function() {
		const ret = []
		for(let e of score.entries())
			ret.push({name:e[0].name, pts:e[1]})
		return ret
	}
	this.reset = function() {
		score.clear()
		coins.clear()
		currTurn = 0;
		
		const copyAstro = [...allAstros]
		while(allAstros.shift());
		let astro
		while(astro = copyAstro.pop())
			this.addAstro(astro)
		for(let i=this.coinsNumber; i>0; --i)
			addNewCoin(this)
	}
	this.resetHARD = function() {
		/// Clear all
		while(allAstros.shift());
		while(observers.shift());
		walls.clear()
		this.onEnd = null

		/// Regenerate walls
		// Random walls
		for(let i=-this.size; i<this.size; i++)
			for(let j=-this.size; j<this.size; j++)
				if(Math.random() < this.wallChance)
					walls.add(idOf(i,j))

		// world border
		for(let i=-this.size+1; i<this.size; i++) {
			walls.add(idOf(i, -this.size))
			walls.add(idOf(i, this.size))
			walls.add(idOf(-this.size, i))
			walls.add(idOf(this.size, i))
		}
		this.reset()
	}

	/**
	 * @param x, y, flags
	 * flags&1 = Walls >> returns constant WALL
	 * flags&2 = Players >> returns constant ASTRO + [0-3] (orientation)
	 * flags&4 = Coins >> returns constant COIN
	 * else return false
	 */
	this.getCell = function(x,y,flags) {
		const id = idOf(x,y)
		if(flags&1 && walls.has(id))
			return WALL

		if(flags&2 && this.astroCollide)
			for(astro of allAstros)
				if(astro.x === x && astro.y === y)
					return ASTRO+astro.rot

		if(flags&4 && coins.has(idOf(x,y)))
			return COIN

		return false;
	}

	this.addAstro = function(astro) {
		allAstros.push(astro)
		score.set(astro, 0)
	}

	this.addObserver = function(newObserver) {
		observers.push(newObserver)
	}
	this.remObserver = function(newObserver) {
		let i=observers.indexOf(newObserver)
		if(i===observers.length)
			observers.pop()
		else if(i)
			observers[i] = observers.pop();
	}

	this.allPlayersToSamePosition = function() {
		const choice = allAstros[(Math.random()*allAstros.length)|0]
		for(let i=allAstros.length-1; i>=0; --i) {
			allAstros[i].x = choice.x;
			allAstros[i].y = choice.y;
		}
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
	const turnA = function(whoNext) {
		if(whoNext.length <=0) {
			setTimeout(THIS.launch, THIS.turnDuration)
			return
		}

		const curr = whoNext.shift()

		// Prepare callback
		const next = () => {
			if(THIS.getCell(curr.x, curr.y, 0b100)) {
				coins.delete(idOf(curr.x, curr.y))
				score.set(curr, score.get(curr)+1)
				addNewCoin(this)
			}
			setTimeout(()=>turnA(whoNext), 0)
		}

		// Update displays
		for(let display of observers)
			display.notifyUpdates()

		if(curr.fly()) { // try to fly (true if done, false if not flying)
			next()
		} else {
			curr.askForAction((actionName)=>{
				const action = mapActionToCode[actionName]

				if(!action // command out of bounds
				   || (action >= 1 && action <= 4 && !curr.move(action-1)) // MOVE command
				   || (action >= 5 && action <= 6 && !curr.diag(action-5))) // DIAG command
					return false // cannot do this move

				// console.log(curr.name, 'did', actionName)
				next()
				return true
			})
		}
	}
	const addNewCoin = function() {
		let newX
		let newY
		do {
			newX = ((Math.random()*THIS.size*2-1)-THIS.size+1)|0
			newY = ((Math.random()*THIS.size*2-1)-THIS.size+1)|0
		} while(THIS.getCell(newX,newY,0b111));
		coins.add(idOf(newX, newY))
	}

	// // // Init
	this.resetHARD()
}
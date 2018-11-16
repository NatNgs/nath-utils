const MAP_SIZE = 15; // map size = Value×2+1 (-MAP_SIZE to MAP_SIZE)
const WALL_CHANCE = 0.25; // between 0 and 1
const WALL = 'wall'; // css class
const TIMEOUT = 1;

function idOf(x,y) {
	return 'c'+x+'_'+y;
}

function Grid() {
	this.astroCollide = true;
	this.maxTurns = 0;
	this.onEnd = null; // function
	
	const THIS = this;
	const allAstros = [];
	const allDisplays = [];
	const walls = new Set();
	const coins = new Set();
	const score = new Map();
	let currTurn = 0;

	// // // Public functions
	this.launch = function() {
		if(THIS.maxTurns > 0 && currTurn >= THIS.maxTurns) {
			currTurn = 0
			if(THIS.onEnd)
				THIS.onEnd()
		} else {
			currTurn++
			turnA([...allAstros])
		}
	}

	this.isCoinOn = function(x,y) {
		return coins.has(idOf(x,y))
	}
	this.getScores = function() {
		const ret = []
		for(let e of score.entries())
			ret.push({astro:e[0], pts:e[1]})
		return ret
	}
	this.reset = function() {
		while(allAstros.shift());
		score.clear()
		coins.clear()
		currTurn = 0;
		// keep the walls
		// keep display
		// keep onEnd method
		// keep maxTurns
		// keep astroCollide
	}
	
	this.getCell = function(x,y,seeAll) {
		const id = idOf(x,y)
		if(walls.has(id))
			return WALL;
		if(seeAll || this.astroCollide)
			for(astro of allAstros)
				if(astro.x === x && astro.y === y)
					return 'astro'+astro.rot;
		return false;
	}

	this.addAstro = function(astro) {
		allAstros.push(astro)
		score.set(astro, 0)
		for(let i=0; i<5; i++)
			addNewCoin()
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
	function turnA(whoNext) {
		if(whoNext.length <=0) {
			setTimeout(THIS.launch, 0)
			return
		}

		const curr = whoNext.shift()
		
		// Prepare callback
		const next = () => {
			if(THIS.isCoinOn(curr.x, curr.y)) {
				coins.delete(idOf(curr.x, curr.y))
				score.set(curr, score.get(curr)+1)
				addNewCoin()
			}
			setTimeout(()=>turnA(whoNext),TIMEOUT)
		}

		// Update displays
		for(let display of allDisplays)
			display.notifyUpdates()

		if(curr.fly()) { // try to fly (true if done, false if not flying)
			next()
		} else {
			let secur = false // to avoid to play multiple times in the turn
			curr.askForAction((action)=>{
				if(secur)
					return true // turn was already done
				secur = true
				//console.log(curr.name, 'played', action)

				if(action !== -1 // WAIT cmd
				  && (action < 0 || action > 5 // command out of bounds
				   || (action < 4 && !curr.move(action)) // MOVE command
				   || (action >= 4 && !curr.diag(action-4)))) // DIAG command
						return (secur = false) // cannot do this move

				next()
				return true
			})
		}
	}

	function addNewCoin() {
		let newX, newY;
		do { 
			newX = ((Math.random()*MAP_SIZE*2-1)-MAP_SIZE+1)|0
			newY = ((Math.random()*MAP_SIZE*2-1)-MAP_SIZE+1)|0
		} while(THIS.getCell(newX,newY) || THIS.isCoinOn(newX, newY));
		coins.add(idOf(newX, newY))
	}
	
	// // // Init
	// Random walls
	for(let i=-MAP_SIZE; i<MAP_SIZE; i++)
		for(let j=-MAP_SIZE; j<MAP_SIZE; j++)
			if(Math.random() < WALL_CHANCE)
				walls.add(idOf(i,j))

	// world border
	for(let i=-MAP_SIZE+1; i<MAP_SIZE; i++) {
		walls.add(idOf(i, -MAP_SIZE))
		walls.add(idOf(i, MAP_SIZE))
		walls.add(idOf(-MAP_SIZE, i))
		walls.add(idOf(MAP_SIZE, i))
	}
		
	this.reset()
}
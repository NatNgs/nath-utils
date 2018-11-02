const MAP_SIZE = 15; // map size = Value×2+1 (-MAP_SIZE to MAP_SIZE)
const DISPLAY_SIZE = 5; // grid view size = Value×2+1 (-gridSize to gridSize)
const WALL_CHANCE = 0.25; // between 0 and 1
const WALL = 'wall'; // css class

function idOf(x,y) {
	return 'c'+x+'_'+y;
}

function Grid() {
	const THIS = this;
	const allAstros = [];
	const walls = new Set();
	const score = new Map();
	const colors = new Map();

	// // // Public functions
	this.launch = function() {
		turnA([...allAstros])
	}

	this.getColorOf = function(x,y) {
		return colors.get(idOf(x,y))
	}
	this.getScores = function() {
		const ret = []
		for(let e of score.entries())
			ret.push({astro:e[0], pts:e[1]})
		return ret
	}

	this.getCell = function(x,y) {
		const id = idOf(x,y)
		if(walls.has(id))
			return WALL;
		for(astro of allAstros) {
			if(astro.x === x && astro.y === y)
				return 'astro'+astro.rot;
		}
		return false;
	}

	this.addAstro = function(astro) {
		allAstros.push(astro)
		score.set(astro.name, 0)
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
		const next = () => {
			const lastColor = colors.get(idOf(curr.x, curr.y))
			if(lastColor)
				score.set(lastColor, score.get(lastColor)-1)
			score.set(curr.name, score.get(curr.name)+1)
			colors.set(idOf(curr.x, curr.y), curr.name)
			curr.refreshView()
			setTimeout(()=>turnA(whoNext),33)
		}

		if(curr.fly()) { // try to fly (true if done, false if not flying)
			next()
		} else {
			curr.refreshView()
			let secur = false // to avoid to play multiple times in the turn
			curr.askForAction((action)=>{
				if(secur)
					return true // turn was already done
				secur = true

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
}

function init() {
	// generate grid
	const display = document.getElementById('grid');

	let html = '';
	for(let y=DISPLAY_SIZE; y>=-DISPLAY_SIZE; --y) {
		html += '<tr>'
		for(let x=-DISPLAY_SIZE; x<=DISPLAY_SIZE; x++)
			html += '<td id="'+idOf(x,y)+'" class="cell"></td>'
		html += '</tr>'
	}
	display.innerHTML = html;


	// launch
	const grid = new Grid();

	// Generate players
	grid.addAstro(generateManPlayer(grid))
	for(let i=5; i>=0; --i)
		grid.addAstro(generateBotPlayer(grid))

	grid.launch()
}
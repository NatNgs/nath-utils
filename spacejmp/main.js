const DISPLAY_SIZE = 5; // grid view size = Value×2+1 (-gridSize to gridSize)
const MAP_SIZE = 15; // map size = Value×2+1 (-MAP_SIZE to MAP_SIZE)
const WALL_CHANCE = 0.25; // between 0 and 1
const WALL = 'wall'; // css class

// Rotation priority list according to the last move orientation
const ROTS = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}] // 0=up,1=left,2=down,3=right

function idOf(x,y) {
	return 'c'+x+'_'+y;
}

function Grid() {
	const THIS = this;
	const allAstros = [];
	const walls = new Set();

	// // // Public functions
	this.launch = function() {
		turnA([...allAstros])
	}

	this.getCell = function(x,y) {
		if(walls.has(idOf(x,y)))
			return WALL;
		for(astro of allAstros) {
			if(astro.x === x && astro.y === y)
				return 'astro'+astro.rot;
		}
		return false;
	}

	this.addAstro = function(astro) {
		allAstros.push(astro)
	}

	// // // Private Functions
	function turnA(whoNext) {
		if(whoNext.length <=0) {
			setTimeout(THIS.launch, 200)
			return
		}

		const curr = whoNext.shift()

		if(curr.fly()) { // try to fly (true if done, false if not flying)
			curr.refreshView()
			turnA(whoNext)
		} else {
			curr.refreshView()
			let secur = false
			curr.askForAction((action)=>{
				if(secur)
					return true // turn is already finished

				if(action < -1 || action > 5
				 || (action < 4 && !curr.move(action))
				 || (action >= 4 && !curr.diag(action-4)))
					return false // cannot do this move

				curr.refreshView()
				turnA(whoNext)
				return (secur = true)
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

let id=0
function Astro(grid) {
	this.name = 'Astro'+(++id)
	this.x;
	this.y;
	this.rot = 0; // rot (0=head up,1=head left,2=head down,3=head right)

	// // // Functions
	/**
	 * Return true if is flying and was moved one tile more on flight
	 * false otherwise
	 */
	this.fly = function() {
		if(this.isRotating
		  && !grid.getCell(this.isRotating.x, this.isRotating.y)) {
			this.x = this.isRotating.x
			this.y = this.isRotating.y
			this.rot = this.isRotating.r
			this.isRotating = undefined
			return true
		}

		// check if flying
		if(this.tryLand())
			return false

		// continue to fly
		this.x += ROTS[this.rot].x
		this.y += ROTS[this.rot].y

		this.tryLand()
		return true
	}

	/**
	 * Return true if has landed
	 * false otherwise
	 */
	this.tryLand = function() {
		const landingPrio = [2, 0, 3, 1].map(a=>(a+this.rot)%4)

		for(let r of landingPrio) {
			if(grid.getCell(this.x+ROTS[r].x, this.y+ROTS[r].y)) {
				// make it land
				this.rot = (r+2)%4
				this.rotating = undefined
				return true
			}
		}
		return false
	}

	/**
	 * Return true if can move and was moved
	 * false otherwise
	 */
	this.move = function(mv) {
		// cannot move
		if(mv < 0 || mv > 3)
			return false

		// rotate only
		if(grid.getCell(this.x+ROTS[mv].x, this.y+ROTS[mv].y)) {
			this.rot = (mv+2)%4
			return true
		}

		// apply move
		this.x += ROTS[mv].x
		this.y += ROTS[mv].y

		// if start flying, rotate to the direction of flight
		if(!this.tryLand()) {
			this.rot = mv
		}

		return true
	}

	/**
	 * Return true if can move and was moved diagonally
	 * false otherwise
	 */
	this.diag = function(lr) {
		// lr=0: turn counterclockwise; lr=1: turn clockwise
		const mv = lr*2+1 // mv=1: counterclockwise, 3: clockwise

		const newRot = (this.rot+mv)%4
		const side = {
			x: this.x+ROTS[newRot].x,
			y: this.y+ROTS[newRot].y
		}
		if(grid.getCell(side.x, side.y))
			return false

		const diag = {
			x: side.x+ROTS[(this.rot+2)%4].x,
			y: side.y+ROTS[(this.rot+2)%4].y,
			r: newRot
		}
		if(grid.getCell(diag.x, diag.y))
			return false

		this.x = side.x
		this.y = side.y
		this.rot = newRot
		this.isRotating = diag

		return true
	}

	// // // Init
	do {
		this.x = ((Math.random()*MAP_SIZE*2+1)-MAP_SIZE)|0
		this.y = ((Math.random()*MAP_SIZE*2+1)-MAP_SIZE)|0
	} while(grid.getCell(this.x,this.y));

	const themove = (Math.random()*4)|0
	while(this.fly(themove)); // move till next wall
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

function generateManPlayer(grid) {
	const astro = new Astro(grid);
	astro.refreshView = ()=>{
		for(let i=-DISPLAY_SIZE; i<=DISPLAY_SIZE; i++) {
			for(let j=-DISPLAY_SIZE; j<=DISPLAY_SIZE; j++) {
				const cell = document.getElementById(idOf(i,j)).classList
				cell.remove(WALL)
				cell.remove('astro0')
				cell.remove('astro1')
				cell.remove('astro2')
				cell.remove('astro3')

				const somethingOnCell = grid.getCell(astro.x+i,astro.y+j)
				if(somethingOnCell)
					cell.add(somethingOnCell)
			}
		}
	}

	let shift = false;
	let call;
	document.onkeydown = (e=window.event)=>{
		if(e.keyCode === 16) {
			shift = true
		}
		else if(call)
			call(e.keyCode, shift)
	}
	document.onkeyup = (e=window.event)=>{
		if(e.keyCode === 16)
			shift = false
	}
	astro.askForAction = (cb)=>{
		call = (key, shift)=>{
			//console.log((shift?'shift+':'')+key)
			if(
			  (shift &&
			    (  (key === 37 && cb(4)) // shift left
			    || (key === 39 && cb(5)) // shift right
			    || (key === 40 && cb(-1)))) // shift down
			  || (!shift &&
			    (  (key === 37 && cb(1)) // left
			    || (key === 38 && cb(0)) // up
			    || (key === 39 && cb(3)) // right
			    || (key === 40 && cb(2)))) // down
			)
				call = undefined
		}
	};
	return astro
}

function generateBotPlayer(grid) {
	const astro = new Astro(grid);
	astro.refreshView = ()=>{}
	astro.askForAction = cb=>{
		while(!cb((Math.random()*6-1)|0));
	}
	return astro
}

const showGrid = 5; // ! Value x2+1 (-gridSize to gridSize)
const mapSize = 15; // ! Value x2+1 (-mapSize to mapSize)
const wallsProba = 0.25;
const map = new Grid();

// Rotation priority list according to the last move orientation
const rots = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}] // 0=up,1=left,2=down,3=right

function idOf(x,y) {
	return 'c'+x+'_'+y;
}

function Turn(nbPlayers) {
	const allAstros = [];
	
	// // // Functions
	function launch() {
		turnA([...allAstros])
	}
	function turnA(whoNext) {
		if(whoNext.length <=0) {
			setTimeout(launch, 100)
			return
		}
		
		const curr = whoNext.shift()
		
		if(curr.fly()) { // try to fly (true if done, false if not flying)
			turnA(whoNext)
		} else {
			refreshView(curr)
			document.onkeydown = (e=window.event)=>{
				//console.log('CLICK: '+e.keyCode)
				switch(e.keyCode) {
				case 37: // left arrow
					if(!curr.move(1)) return
					break
				case 38: // up arrow
					if(!curr.move(0)) return
					break
				case 39: // right arrow
					if(!curr.move(3)) return
					break
				case 40: // down arrow
					if(!curr.move(2)) return
					break
				default: return
				}
				
				document.onkeydown = undefined
				turnA(whoNext)
			}
		}
	}
	
	function refreshView(astro) {
		for(let i=-showGrid; i<=showGrid; i++) {
			for(let j=-showGrid; j<=showGrid; j++) {
				const cell = document.getElementById(idOf(i,j))
				if(map.isWall(astro.x+i,astro.y+j))
					cell.classList.add('wall')
				else
					cell.classList.remove('wall')
				
				cell.classList.remove('astro0')
				cell.classList.remove('astro1')
				cell.classList.remove('astro2')
				cell.classList.remove('astro3')
			}
		}

		for(let a of allAstros) { 
			const astroCell = document.getElementById(idOf(a.x-astro.x, a.y-astro.y))
			if(astroCell)
				astroCell.classList.add('astro'+a.rot)
		}
	}
	
	this.hasSmthgOn = function(x,y) {
		if(map.isWall(x,y))
			return 'wall';
		for(astro of allAstros) {
			if(astro.x === x && astro.y === y)
				return astro;
		}
		return false;
	}
	
	// // // Init
	while(nbPlayers--)
		allAstros.push(new Astro(this))
	
	launch();
}

let id=0
function Astro(turn) {
	this.name = 'Astro'+(++id)
	this.x;
	this.y;
	this.rot = 0; // rot (0=head up,1=head left,2=head down,3=head right)
	this.lastMove;

	// // // Functions
	this.isFlying = function() {
		return !turn.hasSmthgOn(this.x-rots[this.rot].x, this.y-rots[this.rot].y)
	}
	
	/**
	 * Return true if is flying and was moved one tile more on flight
	 * false otherwise
	 */
	this.fly = function() {
		// check if flying (nothing below him)
		if(!this.isFlying())
			return false
		
		// check if stop flying (nothing around him)
		const landingPrio = [this.rot, (this.rot+4-1)%4, (this.rot+1)%4]
		for(let r of landingPrio) {
			if(turn.hasSmthgOn(this.x+rots[r].x, this.y+rots[r].y)) {
				// make it land
				this.rot = (r+2)%4
				return false // this is not a move, so return false
			}
		}
		
		// continue to fly
		this.x += rots[this.rot].x
		this.y += rots[this.rot].y
		return true
	}
	
	/**
	 * Return true if can move and was moved
	 * false otherwise
	 */
	this.move = function(mv = this.lastMove) {
		// cannot move
		if(turn.hasSmthgOn(this.x+rots[mv].x, this.y+rots[mv].y)) {
			this.rot = mv // currently not seen because no refresh view while selecting a move
			return false
		}
		
		// apply move
		this.x += rots[mv].x
		this.y += rots[mv].y
		this.lastMove = mv
		
		// if start flying, rotate to the direction of flight
		if(this.isFlying())
			this.rot = mv

		return true
	}

	// // // Init
	do {
		this.x = ((Math.random()*mapSize*2+1)-mapSize)|0
		this.y = ((Math.random()*mapSize*2+1)-mapSize)|0
	} while(turn.hasSmthgOn(this.x,this.y));
	
	this.lastMove = (Math.random()*4)|0
	while(this.move()); // move till next wall
}

function Grid() {
	let walls = new Set();

	// Random walls
	for(let i=-mapSize; i<mapSize; i++)
		for(let j=-mapSize; j<mapSize; j++)
			if(Math.random() < wallsProba)
				walls.add(idOf(i,j))

	// world border
	for(let i=-mapSize+1; i<mapSize; i++) {
		walls.add(idOf(i, -mapSize))
		walls.add(idOf(i, mapSize))
		walls.add(idOf(-mapSize, i))
		walls.add(idOf(mapSize, i))
	}

	this.isWall = function(x,y) {
		return walls.has(idOf(x,y))
	}
}

function init() {
	// generate grid
	const grid = document.getElementById('grid');

	let gridText = '';
	for(let y=-showGrid; y<=showGrid; y++) {
		gridText += '<tr>'
		for(let x=-showGrid; x<=showGrid; x++)
			gridText += '<td id="'+idOf(x,-y)+'" class="cell"></td>'
		gridText += '</tr>'
	}
	grid.innerHTML = gridText;

	// launch
	new Turn(2);
}

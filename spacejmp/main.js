const showGrid = 4; // ! Value x2+1 (-gridSize to gridSize)
const mapSize = 9; // ! Value x2+1 (-mapSize to mapSize)
const map = new Grid();
const astro = new Astro();

function idOf(x,y) {
	return 'c'+x+'_'+y;
}

function Astro() {
	this.x = 0;
	this.y = 0;
	this.rot = 0; // rot (0=head up,1=head left,2=head down,3=head right)

	this.left = function(cb) {
		if(map.isWall(this.x-1, this.y)) {
			this.rot = 3
		} else {
			this.x --
			if(map.isWall(this.x-1, this.y)) {
				this.rot = 3
			} else if(map.isWall(this.x, this.y-1)) {
				this.rot = 0
			} else if(map.isWall(this.x, this.y+1)) {
				this.rot = 2
			} else {
				this.rot = 1
				setTimeout(()=>this.left(cb), 100)
				refreshView()
				return;
			}
		}

		refreshView()
		cb()
	}
	this.right = function(cb) {
		if(map.isWall(this.x+1, this.y)) {
			this.rot = 1
		} else {
			this.x ++
			if(map.isWall(this.x+1, this.y)) {
				this.rot = 1
			} else if(map.isWall(this.x, this.y-1)) {
				this.rot = 0
			} else if(map.isWall(this.x, this.y+1)) {
				this.rot = 2
			} else {
				this.rot = 3
				setTimeout(()=>this.right(cb), 100)
				refreshView()
				return;
			}
		}

		refreshView()
		cb()
	}
	this.up = function(cb) {
		if(map.isWall(this.x, this.y+1)) {
			this.rot = 2
		} else {
			this.y ++
			if(map.isWall(this.x, this.y+1)) {
				this.rot = 2
			} else if(map.isWall(this.x-1, this.y)) {
				this.rot = 3
			} else if(map.isWall(this.x+1, this.y)) {
				this.rot = 1
			} else {
				this.rot = 0
				setTimeout(()=>this.up(cb), 100)
				refreshView()
				return;
			}
		}

		refreshView()
		cb()
	}
	this.down = function(cb) {
		if(map.isWall(this.x, this.y-1)) {
			this.rot = 0
		} else {
			this.y --
			if(map.isWall(this.x, this.y-1)) {
				this.rot = 0
			} else if(map.isWall(this.x+1, this.y)) {
				this.rot = 1
			} else if(map.isWall(this.x-1, this.y)) {
				this.rot = 3
			} else {
				this.rot = 2
				setTimeout(()=>this.down(cb), 100)
				refreshView()
				return;
			}
		}

		refreshView()
		cb()
	}
}

function Grid() {
	let walls = new Set();

	// Random walls
	for(let i=-mapSize; i<mapSize; i++)
		for(let j=-mapSize; j<mapSize; j++)
			if(Math.random() < 0.25)
				walls.add(idOf(i,j))

	// world border
	for(let i=-mapSize+1; i<mapSize; i++) {
		walls.add(idOf(i, -mapSize))
		walls.add(idOf(i, mapSize))
		walls.add(idOf(-mapSize, i))
		walls.add(idOf(mapSize, i))
	}

	// Spawn
	walls.delete(idOf(0, 0))
	walls.add(idOf(0, -1))

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

	// refresh view
	refreshView();

	bindButtons()
}

function bindButtons() {
	document.onkeydown = buttonPressed;
}

function buttonPressed(e = window.event) {
	document.onkeydown = undefined;

	switch(e.keyCode) {
	case 37: // left arrow
		astro.left(bindButtons)
		break;
	case 38: // up arrow
		astro.up(bindButtons)
		break;
	case 39: // right arrow
		astro.right(bindButtons)
		break;
	case 40: // down arrow
		astro.down(bindButtons)
		break;
	}
}

function refreshView() {
	for(let i=-showGrid; i<=showGrid; i++) {
		for(let j=-showGrid; j<=showGrid; j++) {
			if(i===0 && j===0)
				continue;
			const cell = document.getElementById(idOf(i,j))
			if(map.isWall(astro.x+i,astro.y+j))
				cell.classList.add('wall')
			else
				cell.classList.remove('wall')
		}
	}

	const astroCell = document.getElementById(idOf(0, 0))
	for(let rot=0; rot<4; rot++) {
		if(astro.rot === rot)
			astroCell.classList.add('astro'+rot)
		else
			astroCell.classList.remove('astro'+rot)
	}
}
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

	this.left = function() {
		this.rot = 3
		if(!map.isWall(this.x-1, this.y))
			this.x --
	}
	this.right = function() {
		this.rot = 1
		if(!map.isWall(this.x+1, this.y))
			this.x ++
	}
	this.up = function() {
		this.rot = 2
		if(!map.isWall(this.x, this.y+1))
			this.y ++
	}
	this.down = function() {
		this.rot = 0
		if(!map.isWall(this.x, this.y-1))
			this.y --
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
		astro.left()
		break;
	case 38: // up arrow
		astro.up()
		break;
	case 39: // right arrow
		astro.right()
		break;
	case 40: // down arrow
		astro.down()
		break;
	}
	refreshView()
	document.onkeydown = buttonPressed;
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
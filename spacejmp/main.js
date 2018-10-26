const gridSize = 9;
const mapSize = 9;
const map = new Grid();

function idOf(x,y) {
	return 'c'+x+'_'+y;
}

function Grid() {
	let walls = new Set();
	this.pLoc = [0, 0, 0]; // x, y, rot (0=head up,1=head left,2=head down,3=head right)
	
	// Generate walls
	for(let i=0; i<mapSize; i++)
		for(let j=0; j<mapSize; j++)
			if(Math.random() < 0.25)
				walls.add(idOf(i,j))
	
	this.getWallsAround = function() {
		const grid = [];
		
		for(let i=0; i<gridSize; i++) {
			grid[i] = [];
			for(let j=0; j<mapSize; j++) {
				const id = idOf(
					i+this.pLoc[0],
					j+this.pLoc[1]
				)
				grid[i][j] = walls.has(id)
			}
		}
		
		return grid;
	}
}

function init() {
	// generate grid
	const grid = document.getElementById('grid');
	
	let gridText = '';
	for(let i=0; i<gridSize; i++) {
		gridText += '<tr>'
		for(let j=0; j<gridSize; j++)
			gridText += '<td id="'+idOf(i,j)+'" class="cell"></td>'
		gridText += '</tr>'
	}
	grid.innerHTML = gridText;
	
	// refresh view
	refreshView();

	// Bind buttons
	document.onkeydown = buttonPressed;
}

function buttonPressed(e = window.event) {
	switch(e.keyCode) {
	case 37:
		// left arrow
		map.pLoc[1]--
		break;
	case 38:
		// up arrow
		map.pLoc[0]--
		break;
	case 39:
		// right arrow
		map.pLoc[1]++
		break;
	case 40:
		// down arrow
		map.pLoc[0]++
		break;
	}
	refreshView()
}

function refreshView() {
	const currGrid = map.getWallsAround()
	for(let i=0; i<gridSize; i++) {
		for(let j=0; j<gridSize; j++) {
			const cell = document.getElementById(idOf(i,j))
			if(currGrid[i][j])
				cell.classList.add('wall')
			else
				cell.classList.remove('wall')
		}
	}
}
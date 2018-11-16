var DISPLAY_SIZE = 5; // grid view size = Value×2+1 (-gridSize to gridSize)
var FREQUENCY = 1000/50; // 1000/(fq per second)

const display = {
	x: 0, // location of display centered on this location
	y: 0, 
	notifyUpdates:()=>{updated = true}
}

let stop = false // if true, will no more update display

function setDisplayRunning(value) {
	stop = value;
}

let bindedPlayer = null;
function bindDisplayToPlayer(astro) {
	bindedPlayer = astro;
	updated = true;
	document.onkeydown = undefined
}
function bindDisplayToKeyboard() {
	bindedPlayer = null
	document.onkeydown = (e=window.event)=>{
		switch(e.keyCode) {
			case 37: display.x--; break; // left
			case 38: display.y++; break; // up
			case 39: display.x++; break; // right
			case 40: display.y--; break; // down
		}
		updated = true;
	};
}

const refreshView = function() {
	if(updated) {
		updated = false;
		
		if(bindedPlayer) {
			display.x = bindedPlayer.x
			display.y = bindedPlayer.y
		}
		
		// Grid
		for(let i=-DISPLAY_SIZE; i<=DISPLAY_SIZE; i++) {
			for(let j=-DISPLAY_SIZE; j<=DISPLAY_SIZE; j++) {
				const cell = document.getElementById(idOf(i,j)).classList
				cell.remove(WALL)
				cell.remove('astro0')
				cell.remove('astro1')
				cell.remove('astro2')
				cell.remove('astro3')
				cell.remove('coin')

				const somethingOnCell = grid.getCell(display.x+i,display.y+j, true)
				if(somethingOnCell)
					cell.add(somethingOnCell)
				if(grid.isCoinOn(display.x+i, display.y+j))
					cell.add('coin')
			}
		}

		// Score
		let html = '<tr><th>Astro</th><th>Score</th>'
		for(let i of grid.getScores().sort((a,b)=>b.pts-a.pts)) {
			html += '<tr><td>'+i.astro.name+':</td><td>'+i.pts+'</td></tr>'
		}
		document.getElementById('scores').innerHTML = html
	}
	setTimeout(refreshView, FREQUENCY)
}
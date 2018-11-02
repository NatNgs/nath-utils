// Rotation priority list according to the last move orientation
const ROTS = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}] // 0=up,1=left,2=down,3=right

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
		// cannot move neither rotate
		if(mv < 0 || mv > 3 || mv === (this.rot+2)%4)
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
		this.x = ((Math.random()*MAP_SIZE*2-1)-MAP_SIZE+1)|0
		this.y = ((Math.random()*MAP_SIZE*2-1)-MAP_SIZE+1)|0
	} while(grid.getCell(this.x,this.y));

	const themove = (Math.random()*4)|0
	while(this.fly(themove)); // move till next wall
}

function generateManPlayer(grid) {
	const astro = new Astro(grid);
	astro.refreshView = ()=>{
		// Grid
		for(let i=-DISPLAY_SIZE; i<=DISPLAY_SIZE; i++) {
			for(let j=-DISPLAY_SIZE; j<=DISPLAY_SIZE; j++) {
				const cell = document.getElementById(idOf(i,j)).classList
				cell.remove(WALL)
				cell.remove('astro0')
				cell.remove('astro1')
				cell.remove('astro2')
				cell.remove('astro3')
				cell.remove('ownAlly')
				cell.remove('ownEnemy')

				const somethingOnCell = grid.getCell(astro.x+i,astro.y+j)
				if(somethingOnCell)
					cell.add(somethingOnCell)
				const color = grid.getColorOf(astro.x+i, astro.y+j)
				if(color)
					cell.add(color === astro.name ? 'ownAlly' : 'ownEnemy')
			}
		}

		// Score
		let html = '<tr><th>Astro</th><th>Score</th>'
		for(let i of grid.getScores().sort((a,b)=>b.pts-a.pts)) {
			html += '<tr><td>'+i.astro+':</td><td>'+i.pts+'</td></tr>'
		}
		document.getElementById('scores').innerHTML = html
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
			if(shift
			  ? (  (key === 37 && cb(4)) // shift left
			    || (key === 39 && cb(5)) // shift right
			    || (key === 40 && cb(-1))) // shift down
			  : (  (key === 37 && cb(1)) // left
			    || (key === 38 && cb(0)) // up
			    || (key === 39 && cb(3)) // right
			    || (key === 40 && cb(2))) // down
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

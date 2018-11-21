// Rotation priority list according to the last move orientation
const ROTS = [{x:0,y:1},{x:-1,y:0},{x:0,y:-1},{x:1,y:0}] // 0=up,1=left,2=down,3=right

let id=0
function Astro(board) {
	const THIS = this;

	this.name = 'Astro'+(++id)
	this.x;
	this.y;
	this.rot = 0; // rot (0=head up,1=head left,2=head down,3=head right)

	let isRotating; // {x:.., y:.., rot:..}

	// // // Functions
	/**
	 * Return true if is flying and was moved one tile more on flight
	 * false otherwise
	 */
	this.fly = function() {
		if(isRotating
		  && !board.getCell(isRotating.x, isRotating.y, 0b11)) {
			this.x = isRotating.x
			this.y = isRotating.y
			this.rot = isRotating.r
			isRotating = undefined
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
			if(board.getCell(this.x+ROTS[r].x, this.y+ROTS[r].y,0b11)) {
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
		if(board.getCell(this.x+ROTS[mv].x, this.y+ROTS[mv].y,0b11)) {
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
		if(board.getCell(side.x, side.y,0b11))
			return false

		const diag = {
			x: side.x+ROTS[(this.rot+2)%4].x,
			y: side.y+ROTS[(this.rot+2)%4].y,
			r: newRot
		}
		if(board.getCell(diag.x, diag.y,0b11))
			return false

		this.x = side.x
		this.y = side.y
		this.rot = newRot
		isRotating = diag

		return true
	}

	// // // Init
	do {
		this.x = ((Math.random()*board.size*2-1)-board.size+1)|0
		this.y = ((Math.random()*board.size*2-1)-board.size+1)|0
	} while(board.getCell(this.x,this.y,0b111));

	this.rot = (Math.random()*4)|0
	while(this.fly()); // move till next wall
}

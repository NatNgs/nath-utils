const MAX_DIST = 32

function Player(grid) {
	const THIS = this
	const observers = []
	let action = undefined

	// Define Astro
	const astro = new Astro(grid)
	astro.askForAction = (cb)=>{
		// prepare to get player response
		action = cb

		// Update displays
		for(let o of observers)
			o.notifyUpdates()

		// call player to play
		THIS.onAskForAction()
	}

	// Register astro to grid
	grid.addAstro(astro)

	// Public functions
	this.getSurroundings = function() {
		return {
			//  distance to next [wall, player, playerRotation, coin, beginHidden]
			u : findNext( 0, 1),
			d : findNext( 0,-1),
			l : findNext(-1, 0),
			r : findNext( 1, 0),
			ul: findNext(-1, 1),
			ur: findNext( 1, 1),
			dl: findNext(-1,-1),
			dr: findNext( 1,-1)
		}
	}
	this.getRotation = function() {
		return astro.rot
	}

	// return true if successful, false if should try again
	this.doAction = function(actionCode) {
		if(action(actionCode)) {
			action = (x)=>true; // avoid multiple call
			return true
		}
		return false
	}

	/** Set your own !
	 * Default implementation is Random play
	 */
	this.onAskForAction = ()=>{
		const moves = ['wait','mv_u','mv_d','mv_l','mv_r','rt_l','rt_r']
		while(!this.doAction(moves[(Math.random()*moves.length)|0]));
	}

	this.addObserver = function(newObserver) {
		observers.push(newObserver)
	}
	this.remObserver = function(newObserver) {
		let i=observers.indexOf(newObserver)
		if(i===observers.length)
			observers.pop()
		else if(i)
			observers[i] = observers.pop();
	}

	const findNext = function(mvx,mvy) {
		let x = astro.x
		let y = astro.y
		let wall = 0
		let player = 0
		let prot = 0
		let coin = 0
		let hidden = 0
		let count = 0

		// can see walls and players behind coins
		// can see coin behind players
		// cant see coins behind walls > 0
		while(count < MAX_DIST) {
			x += mvx
			y += mvy
			count ++

			if(mvx && mvy) {// only for diagonals
				if(grid.getCell(x-mvx,y,0b001) && grid.getCell(x,y-mvy,0b001)) {
					hidden = count
					break
				}
			}

			if(!coin && grid.getCell(x,y,0b100)) {
				coin = count
			} else if(!player) {
				const astro = grid.getCell(x,y,0b010)
				if(astro) {
					player = count
					prot = astro
				} else if(grid.getCell(x,y,0b001)) {
					wall = count
					hidden = count+1
					break
				}
			}
		}
		return [wall, player, prot, coin, hidden];
	}
}
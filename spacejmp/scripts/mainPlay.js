function init() {
	// 1- new Board()
	const board = new Board()

	/* 2- Setup params (if need others than default values)
	* 	board.size (int strictly positive)
	* 	board.wallChance (float between 0 and 1 excluded)
	* 	board.astroCollide (boolean)
	* 	board.maxTurns (int strictly positive, or 0 to set infinity)
	* 	board.onEnd (callback function)
	* 	board.coinsCount (int positive or 0)
	*/

	// 3- call board.reset([seed]) to initiate the board
	board.reset()

	/* 4- call how many time needed:
	* 	board.addPlayer(astro)
	* 	board.addObserver(observer)
	*/

	// create human player and link display
	const p = generateManPlayer()
	board.addPlayer(p)

	const display = new PlayerDisplay(board, p)
	document.getElementById('board').innerHTML = display.getHtml()

	// Generate random bot players
	for(let i = 5; i >= 0; --i) board.addPlayer(new Player())

	// 5- call board.launch() !
	board.launch()
}


const keyMap = {
	'37': 'mv_l', // move left
	'37s': 'rt_l', // rotate left
	'38': 'mv_u', // move up
	'39': 'mv_r', // move right
	'39s': 'rt_r', // rotate right
	'40': 'mv_d', // move down
	'40s': 'wait',  // wait
}

function generateManPlayer() {
	const p = new Player()

	// Set keyboard actions
	let shift = false
	let call = false

	document.onkeydown = (e = window.event) => {
		if(e.keyCode === 16) {
			shift = true
		}
		else if(call && p.doAction(keyMap[e.keyCode + (shift ? 's' : '')])) {
			call = false
		}
	}
	document.onkeyup = (e = window.event) => {
		if(e.keyCode === 16) shift = false
	}

	p.onAskForAction = () => {
		console.log('Asking for player action')
		call = true
	}
	return p
}

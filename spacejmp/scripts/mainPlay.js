function init() {
	const board = new Board()

	// create human player and link display
	const htmlDisplay = document.getElementById('board')

	const p = generateManPlayer(board)
	const display = new PlayerDisplay(board, p)
	htmlDisplay.innerHTML = display.getHtml()

	// Generate random bot players
	for(let i=5; i>=0; --i)
		new Player(board)

	board.launch()
}



const keyMap = {
	'37' :'mv_l', // move left
	'37s':'rt_l', // rotate left
	'38' :'mv_u', // move up
	'39' :'mv_r', // move right
	'39s':'rt_r', // rotate right
	'40' :'mv_d', // move down
	'40s':'wait'  // wait
}
function generateManPlayer(grid) {
	const p = new Player(grid)

	// Set keyboard actions
	let shift = false
	let call = false

	document.onkeydown = (e=window.event)=>{
		if(e.keyCode === 16) {
			shift = true
		} else if(call && p.doAction(keyMap[e.keyCode+(shift?'s':'')])) {
			call = false
		}
	}
	document.onkeyup = (e=window.event)=>{
		if(e.keyCode === 16)
			shift = false
	}

	p.onAskForAction = ()=>{
		console.log('Asking for player action')
		call = true
	};
	return p
}

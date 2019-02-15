const playersByName = []

// 1- new Board()
const board = new Board()

let display = null

const defaultParams = {
	wallChance: 0.2,
	size: 7,
	coinsNumber: 20,
	seed: 42,
	astroCollide: false,
	maxTurns: 50,
	onEnd: null,
	startsAtSameLocation: true,
}

function relaunch() {
	board.softReset()

	board.launch()
}

function onValidateSettings(params) {
	if(!params || !params.players || params.players.length < 1) {
		console.error('Init without parameters or without players => FAILURE')
		return
	}

	/* 2- Setup params (if need others than default values)
	 * 	board.size (int strictly positive)
	 * 	board.wallChance (float between 0 and 1 excluded)
	 * 	board.astroCollide (boolean)
	 * 	board.maxTurns (int strictly positive, or 0 to set infinity)
	 * 	board.onEnd (callback function)
	 * 	board.coinsNumber (int positive or 0)
	*/
	for(let param in defaultParams)
		board[param] = params[param] || defaultParams[param]

	// 3- call board.reset() to initiate the board
	board.reset()

	/* 4- call how many time needed:
	 * 	board.addPlayer(astro)
	 * 	board.addObserver(observer)
	*/
	for(let p of params.players) {
		board.addPlayer(p)
		playersByName[p.name] = p
	}

	board.addObserver(params.display)

	// 5- call board.launch() !
	board.launch()
}

function getByName(name) {
	return playersByName[name]
}

function download(filename, data) {
	const file = new Blob([data])
	if(window.navigator.msSaveOrOpenBlob)
		window.navigator.msSaveOrOpenBlob(file, filename)
	else {
		const a = document.createElement('a')
		const url = URL.createObjectURL(file)
		a.href = url
		a.download = filename
		document.body.appendChild(a)
		a.click()
		setTimeout(() => {
			document.body.removeChild(a)
			window.URL.revokeObjectURL(url)
		}, 0)
	}
}

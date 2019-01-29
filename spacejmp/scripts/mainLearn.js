const pNumbers = 32
const players = []
const board = new Board()
board.wallChance = 0.2
board.size = 7
board.coinsNumber = 50
board.resetHARD()

let when = 0
let astroName = 1
let display = null

function init() {}

function getByName(name) {
	return players.filter(a=>a.getAstroName()===name)[0]
}
function launch() {
	const save = document.getElementById('save')
	
	// Generate players
	for(let i=players.length; i<pNumbers; i++) {
		players[i] = generateAIPlayer(board)
		players[i].name = 'AI'+astroName+'()'
		players[i].when = when
		astroName++
	}
	
	if(!display) {
		display = new PlayerDisplay(board, players[0])
		document.getElementById('board').innerHTML = display.getHtml()
	}

	if(save.value.length > 100) {
		try {
			players[0].gen.import(save.value)
		} catch(e){
			save.value = e
			return;
		}
	}

	board.maxTurns = 50
	board.turnDuration = 0
	board.astroCollide = false
	board.allPlayersToSamePosition()
	board.onEnd = () => {
		// Sort astro by points (coins)
		const scores = board.getScores().map(a=>{
			let p = {}
			p.player = getByName(a.name)
			p.name = a.name
			p.pts = a.pts
			p.wm = p.player.wrongMoves
			p.when = p.player.when
			p.player.wrongMoves = 0
			return p;
		}).sort((a,b)=>a.pts!==b.pts
			?b.pts-a.pts
			:(a.when!==b.when
				?b.when-a.when
				:a.wm-b.wm
			)
		)

		display.changePlayer(scores[0].player)

		// print best score
		document.getElementById('save').value = scores[0].player.gen.export()
		
		// Replace worst AI by new Genetic from first(s)
		while(scores.length >= 2) {
			// Take first (or firsts if same amount of points)
			const bests = []
			const limPts = scores[0].pts
			let newName = 'AI'+astroName
			while(scores.length>0 && scores[0].pts >= limPts) {
				const p = scores.shift()
				newName += (bests.length===0?'(':',')+p.name.match(/[0-9]+/g)[0]
				bests.push(p.player.gen.genes)
			}

			if(scores.length > 0) {
				const player = scores.pop().player
				player.gen = new Genetic(bests)
				player.setAstroName(newName+')')
				player.when = when
				astroName++
			}
		}
		
		board.reset()
		if(document.getElementById('continue').checked) {
			setTimeout(launch,10)
		}
	}

	// Launch
	setTimeout(board.launch,1)
}

// to export string as a text file
function download(filename, data) { 
	const file = new Blob([data]);
	if (window.navigator.msSaveOrOpenBlob) 
		window.navigator.msSaveOrOpenBlob(file, filename); 
	else { 
		const a = document.createElement("a")
		const url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		setTimeout(()=>{ 
			document.body.removeChild(a); 
			window.URL.revokeObjectURL(url);
		}, 0);
	}
};
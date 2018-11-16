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
	
const astrosNumber = 8;
const astros = []
const grid = new Grid();
function init() {
	// generate grid
	const display = document.getElementById('grid');

	let html = '';
	for(let y=DISPLAY_SIZE; y>=-DISPLAY_SIZE; --y) {
		html += '<tr>'
		for(let x=-DISPLAY_SIZE; x<=DISPLAY_SIZE; x++)
			html += '<td id="'+idOf(x,y)+'" class="cell"></td>'
		html += '</tr>'
	}
	display.innerHTML = html;
	
	grid.display = generateDisplay(grid)
	console.log('initialized.')
}

let when = 0
let astroName = 1
function launch() {
	const save = document.getElementById('save');
	
	// Generate players
	for(let i=astros.length; i<astrosNumber; i++) {
		astros[i] = generateAIPlayer(grid)
		astros[i].name = 'AI'+astroName+'()'
		astros[i].when = when
		astroName++
	}

	if(save.value.length > 100) {
		try {
			astros[0].gen.import(save.value)
		} catch(e){
			save.value = e
			return;
		}
	}

	// Reset grid
	grid.reset()
	grid.astroCollide = false;
	grid.maxTurns = 50;

	grid.addAstro(astros[0])
	for(let i=1; i<astrosNumber; i++) {
		astros[i].x = astros[0].x
		astros[i].y = astros[0].y
		astros[i].rot = astros[0].rot
		grid.addAstro(astros[i])
	}
	grid.display.x = astros[0].x
	grid.display.y = astros[0].y
	grid.display.refreshView()

	let maxRuns = 50;
	grid.onEnd = () => {
		// Sort astro by points (coins)
		const scores = grid.getScores().sort((a,b)=>a.pts!==b.pts?b.pts-a.pts:b.when-a.when)
		
		// print best score
		document.getElementById('save').value = scores[0].astro.gen.export()
		
		if(--maxRuns<0)
			return;
		
		// Replace worst AI by new Genetic from first(s)
		while(scores.length >= 2) {
			// Take first (or firsts if same amount of points)
			const bests = []
			const limPts = scores[0].pts
			let newName = 'AI'+astroName
			while(scores.length>0 && scores[0].pts >= limPts) {
				const astro = scores.shift().astro
				newName += (bests.length===0?'(':',')+astro.name.match(/[0-9]+/g)[0]
				bests.push(astro.gen.genes)
			}

			if(scores.length > 0) {
				const astro = scores.pop().astro
				astro.gen = new Genetic(bests)
				astro.name = newName+')'
				astro.when = when
				astroName++
			}
		}
		
		if(document.getElementById('continue').checked) {
			setTimeout(launch,10)
		}
	}

	// Launch
	setTimeout(grid.launch,1)
}
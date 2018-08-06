function Setup(run, templates) {
	this.players = []
	let d,p,i,b,h;

	this.setParams = function(params) {
		[d,p,i,b,h] = params
		buildPlayers(p, i)
		addRandomCards(d)
	}

	this.load = function(params) {
		document.body.innerHTML = templates.page
		document.getElementById("returnToMenu").onclick = () => { run.menu.load() }
		document.getElementById("launch").onclick = launch

		document.getElementById("playersNumber").innerHTML = p+i
		document.getElementById("humansNumber").innerHTML = p
		document.getElementById("computersNumber").innerHTML = i
		document.getElementById("deckNumber").innerHTML = d
		document.getElementById("boardNumber").innerHTML = b
		document.getElementById("handNumber").innerHTML = h

		buildPlayersDiv(document.getElementById("players"), templates.player)
		console.log("LOADED SETUP")
	}

	const buildPlayers = function(human, pc) {
		this.players = [] // Reset

		while(--human >= 0)
			this.players[this.players.length] = new Team("phuman"+human, "Human")

		while(--pc >= 0)
			this.players[this.players.length] = new Team("pauto"+pc, "Bot")
	}

	const buildPlayersDiv = function(div, template) {
		for(let p of this.players) {
			let html = document.createElement("span")
			html.innerHTML = template.replace(/\$p/gi, p.id)
			div.appendChild(html)

			let divName = document.getElementById(p.id+"-name")
			divName.value = p.name
			divName.onchange = () => { p.name = divName.value }
			document.getElementById(p.id+"-load").onclick = () => { alert("Not yet available") }
			document.getElementById(p.id+"-save").onclick = () => { alert("Not yet available") }
			document.getElementById(p.id+"-edit").onclick = () => { alert("Not yet available") }
		}
	}

	const addRandomCards = function(number) {
		while(--number >= 0)
			for(let p of this.players)
				p.addCard(new Card())
	}

	const launch = function() {
		const param = validateBeforeLaunch()

		if(!param)
			return
		else
			run.game.load(param)
	}

	const validateBeforeLaunch = function() {
		// TODO check for errors, returning false if errors found
		return this.players
	}
}
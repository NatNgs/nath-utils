function Setup(run, templates) {
	this.players = [];
	
	this.load = function(params) {
		document.body.innerHTML = templates.page
		let [d,p,i,b] = params
		
		const playersDiv = document.getElementById("players")
		buildPlayers(playersDiv, p, i)
	}
	
	const buildPlayers = function(div, human, pc) {
		this.players = []; // RESET
		while(--human >= 0) {
			this.players[this.players.length] = new Player(div, "phuman"+human, templates.player, false)
		}
		while(--pc >= 0) {
			this.players[this.players.length] = new Player(div, "pauto"+pc, templates.player, true)
		}
	}
}

function Player(div, id, template, isAuto) {
	this.html = document.createElement("span")
	this.html.innerHTML = template.replace(/\$p/gi, id)
	div.appendChild(this.html)

	this.name = (document.getElementById(id+"-name").value = isAuto?"Bot":"Human")
	
	const onNameChange = function() {
		this.name = document.getElementById(id+"-name").value
	}

	document.getElementById(id+"-name").onchange = onNameChange
	document.getElementById(id+"-load").onclick = () => { alert("Not yet available") };
	document.getElementById(id+"-save").onclick = () => { alert("Not yet available") };
	document.getElementById(id+"-edit").onclick = () => { alert("Not yet available") };
}


function Menu(run, template) {
	this.load = function() {
		document.body.innerHTML = template
		
		document.getElementById("newGame").onclick = this.newGame
		document.getElementById("load").onclick = () => { alert("Not yet available") };
	}

	const validateNewGameParams = function() {
		const ed = document.getElementById("deckSize")
		const ep = document.getElementById("playersNumber")
		const ei = document.getElementById("iaNumber")
		const eb = document.getElementById("boardSize")
		const eh = document.getElementById("handSize")
		
		const d = - -ed.value
		const p = - -ep.value
		const i = - -ei.value
		const b = - -eb.value
		const h = - -eh.value
		
		// remove class "error" from ed, ep, ei and eb
		
		let err = false;
		if(d < b) {
			// set class "error" on ed
			err = true;
		}
		if(p+i < 2) {
			// set class "error" on ep and ei
			err = true;
		}
		if(b < 1) {
			// set class "error" on eb
			err = true;
		}
		if(h < b) {
			// set class "error" on eh
			err = true;
		}
		
		return !err && [d,p,i,b,h]
	}

	this.newGame = function() {
		const param = validateNewGameParams()
	
		if(!param)
			return
		else
			run.setup.load(param)
	}
}
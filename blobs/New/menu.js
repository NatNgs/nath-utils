function Menu(run, template) {
	this.load = function() {
		document.body.innerHTML = template

		document.getElementById("newGame").onclick = this.newGame
		document.getElementById("load").onclick = () => { alert("Not yet available") }
		console.log("LOADED MENU", this)
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
		ed.classList.remove('paramerr')
		ep.classList.remove('paramerr')
		ei.classList.remove('paramerr')
		eb.classList.remove('paramerr')
		eh.classList.remove('paramerr')

		let err = false;
		if(d < b) {
			// set class "error" on ed
			ed.classList.add('paramerr')
			alert("d<b")
			err = true;
		}
		if(p+i < 2) {
			// set class "error" on ep and ei
			ep.classList.add('paramerr')
			ei.classList.add('paramerr')
			alert("p+i<2")
			err = true;
		}
		if(b < 1) {
			// set class "error" on eb
			eb.classList.add('paramerr')
			alert("b<1")
			err = true;
		}
		if(h < b) {
			// set class "error" on eh
			eh.classList.add('paramerr')
			alert("h<b")
			err = true;
		}

		return !err && [d,p,i,b,h]
	}

	this.newGame = function() {
		console.log("1")
		const param = validateNewGameParams()
		console.log("2")

		if(!param)
			return console.log("3")
		else {
			console.log("4")
			run.setup.setParams(param)
			run.setup.load()
		}
	}
}
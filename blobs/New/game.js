function Game(run, templates) {

	this.load = function(teams) {
		document.body.innerHTML = templates.page
		
		document.getElementById("returnToSetup").onclick = () => { 
			if(confirm("Click YES to Abort the game and return to setup menu. Click NO to continue to play."))
				run.setup.load()
		}
		console.log("LOADED GAME")
	}
	
}
function Run() {
	const templates = {
		menu: document.getElementById("template-menu").innerHTML,
		setup: {
			page: document.getElementById("template-setup").innerHTML,
			player: document.getElementById("template-playersetup").innerHTML
		},
		game: document.getElementById("template-game").innerHTML
	};
	this.menu = new Menu(this, templates.menu)
	this.setup = new Setup(this, templates.setup)
	//this.game = new Game(templates.game)
}

let initiated = false;
function init() {
	if(initiated)
		return;

	initiated = true;
	run = new Run();
	run.menu.load()
}

function clickBackToMenu() {
	run.loadMenu()
}
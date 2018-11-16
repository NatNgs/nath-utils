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

	// launch
	const grid = new Grid();

	// Generate players
	grid.addAstro(generateManPlayer(grid))
	for(let i=5; i>=0; --i)
		grid.addAstro(generateBotPlayer(grid))

	grid.launch()
}
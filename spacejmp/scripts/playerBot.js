function generateBotPlayer(grid) {
	const astro = new Astro(grid);

	astro.askForAction = cb=>{
		while(!cb((Math.random()*6-1)|0));
	}
	return astro
}

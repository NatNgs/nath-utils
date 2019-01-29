const orientations = {
	'u' :[ 0, 1],
	'd' :[ 0,-1],
	'l' :[-1, 0],
	'r' :[ 1, 0],
	'ul':[-1, 1],
	'ur':[ 1, 1],
	'dl':[-1,-1],
	'dr':[ 1,-1]
}
function m(dist,xy,val) {
	if(dist<=0)
		return
	const cell = document.getElementById(idOf(dist*xy[0],dist*xy[1]))
	if(!cell)
		return

	cell.classList.add(val)
}

function PlayerDisplay(board, player) {
	this.halfWidth = 7 // Value×2+1
	this.halfHeight = 5 // Value×2+1

	player.addObserver(this)
	board.addObserver(this)

	this.notifyUpdates = function() {
		// Grid
		const max = this.halfWidth>this.halfHeight?this.halfWidth:this.halfHeight
		for(let w=max; w>0; --w) {
			const cells = [
				document.getElementById(idOf(w,w)),
				document.getElementById(idOf(-w,-w)),
				document.getElementById(idOf(-w,w)),
				document.getElementById(idOf(w,-w)),
				document.getElementById(idOf(w,0)),
				document.getElementById(idOf(0,w)),
				document.getElementById(idOf(-w,0)),
				document.getElementById(idOf(0,-w))
			]
			while(cells.length > 0) {
				const cell = cells.shift()
				if(cell) {
					const classes = cell.classList
					classes.remove(WALL)
					classes.remove(COIN)
					classes.remove('c_off')
					for(let i=3;i>=0;--i)
						classes.remove(ASTRO+i)
				}
			}
		}

		const s = player.getSurroundings()
		for(let o in orientations) {
			const or = orientations[o]
			m(s[o][0], or, WALL)
			m(s[o][1], or, s[o][2])
			m(s[o][3], or, COIN)
			if(s[o][4] > 0)
				for(let i=s[o][4]; i<=max; i++)
					m(i, or, 'c_off')
		}

		const centerCell = document.getElementById(idOf(0,0))
		centerCell.innerHTML = player.getAstroName()
		for(let i=3;i>=0;--i)
			centerCell.classList.remove(ASTRO+i)
		centerCell.classList.add(ASTRO+player.getRotation())

		// Score
		let html = '<tr><th>Astro</th><th>Score</th>'
		for(let i of board.getScores().sort((a,b)=>b.pts-a.pts))
			html += '<tr><td>'+i.name+':</td><td>'+i.pts+'</td></tr>'

		document.getElementById('scores').innerHTML = html
	}

	this.getHtml = function() {
		let html = '';
		for(let y=this.halfHeight; y>=-this.halfHeight; --y) {
			html += '<tr>'
			for(let x=-this.halfWidth; x<=this.halfWidth; x++)
				html += '<td id="'+idOf(x,y)+'" class="' + ((x===0||y===0||y===x||x===-y)?'cell' : 'c_off') + '"></td>'
			html += '</tr>'
		}
		return html;
	}

	this.changePlayer = function(newPlayer) {
		if(player === newPlayer)
			return;
		player.remObserver(this)
		player = newPlayer
		player.addObserver(this)
		console.log('Displaying', player.getAstroName())
	}
}
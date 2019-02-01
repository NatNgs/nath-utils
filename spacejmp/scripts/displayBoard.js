function BoardDisplay(grid) {
	const THIS = this
	this.halfWidth = 5 // Value×2+1
	this.halfHeight = 5 // Value×2+1

	// location of display centered on this location
	let x = 0
	let y = 0
	let updated = true
	let stop = false // if true, will no more update display

	grid.addObserver(this)

	this.notifyUpdates = function () {
		console.log('Notified Board')
		// Grid
		for (let i = -THIS.halfWidth; i <= THIS.halfWidth; i++) {
			for (let j = -THIS.halfHeight; j <= THIS.halfHeight; j++) {
				const cell = document.getElementById(idOf(i, j))
				if (!cell) continue

				const classes = cell.classList
				classes.remove(WALL)
				classes.remove(COIN)
				classes.remove(ASTRO + 0)
				classes.remove(ASTRO + 1)
				classes.remove(ASTRO + 2)
				classes.remove(ASTRO + 3)

				const somethingOnCell = grid.getCell(display.x + i, display.y + j, 0b111)
				if (somethingOnCell) classes.add(somethingOnCell)
			}
		}

		// Score
		let html = '<tr><th>Astro</th><th>Score</th>'
		for (let i of grid.getScores().sort((a, b) => b.pts - a.pts)) html += '<tr><td>' + i.astro.name + ':</td><td>' + i.pts + '</td></tr>'

		document.getElementById('scores').innerHTML = html
	}

	this.bindToKeyboard = function () {
		document.onkeydown = function (e = window.event) {
			switch (e.keyCode) {
				case 37:
					x--
					break // left
				case 38:
					y++
					break // up
				case 39:
					x++
					break // right
				case 40:
					y--
					break // down
				default:
					return
			}
			notifyUpdates()
		}
	}

	this.getHtml = function () {
		let html = ''
		for (let x = -this.halfWidth; x <= this.halfWidth; x++) {
			html += '<tr>'
			for (let y = this.halfHeight; y >= -this.halfHeight; --y) html += '<td id="' + idOf(x, y) + '" class="cell"></td>'
			html += '</tr>'
		}
		return html
	}
}

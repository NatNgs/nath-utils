function Game(run, templates) {
	this.load = function(params) {
		// setup page
		document.body.innerHTML = templates.page

		document.getElementById("returnToSetup").onclick = () => {
			if(confirm("Click YES to Abort the game and return to setup menu. Click NO to continue to play."))
				run.setup.load()
		}

		// set empty boards for each player
		let board = ""
		for(let p of params.teams)
			board += templates.board.replace(/\$b/g, p.id)

		document.getElementById("boards").innerHTML = board

		// setup tournament
		new Battle(params, templates).start()

		console.log("LOADED GAME")
	}
}

function shuffle(array) {
	let j, t
	for (let i = array.length - 1; i > 0; i--) {
		j = (Math.random() * (i+1))|0;
		t = array[i];
		array[i] = array[j];
		array[j] = t;
	}
}

var bat;
function Battle(rules, templates) {
	bat = this;
	const players = []

	// build players
	for(let t of rules.teams) {
		const pnb = players.length
		const newP = {isAlive:true, team: t, deck: [...t.cards], hand: [], board: [], dead:[], willPlay:[], pts: 0}

		shuffle(newP.deck)

		players[pnb] = newP
	}

	this.start = function() {
		console.log("Battle starting...")
		updateBoardView()
		fillCards()
	}

	function fillCards() {
		console.log("Filling cards..")
		let playersAlive = 0
		for(let p of players) {
			if(p.isAlive) {
				for(let cid=0; cid<rules.h; cid++) {
					if(!p.hand[cid]) {
						if(p.deck.length <= 0) {
							p.isAlive = false
							break
						} else {
							p.hand[cid] = p.deck.pop()
							playersAlive++
						}
					}
				}
				playersAlive++
			}
		}

		// Less than 2 players alive => end of game
		if(playersAlive <= 1) {
			endOfGame()
			return
		}

		updateBoardPoints()

		// THEN
		setTimeout(getChoice,1)
	}

	function buildGetChoice() {
		console.log("Building GetChoice method...")
		// THEN
		let callback = applyChoices

		for(let p of players) {
			if(p.board.length >= rules.b)
				continue

			const f = callback

			callback = (p.team.isAi)
				? () => {
					console.log("Computer playing...")
					while(p.board.filter(lambdaFilterFalsey).length + p.willPlay.length < rules.b) // AI
						p.willPlay.push((Math.random() > 0.5) ? p.hand.pop() : p.hand.shift()) // removing cards to be sure none is selected multiple time

					// readding cards to hand; will be removed after applying choices
					p.willPlay.forEach(c=>p.hand.push(c))

					// THEN
					f()
				}
				: () => {
					console.log("Human playing...")
					updateShowStatistics()
					if(p.board.filter(a=>a).length + p.willPlay.length < rules.b)
						updateHandView(p, /*THEN*/ f)
					else
						f()
				}
		}

		return callback
	}
	const getChoice = buildGetChoice()

	function applyChoices() {
		// Moving willPlay cards from hand to board
		let news = [];
		for(let p of players) {
			while(p.willPlay.length) {
				let rnk = p.board.indexOf(null)
				if(rnk < 0)
					rnk = p.board.length

				const card = p.willPlay.pop()
				p.board[rnk] = card
				news.push(card)

				p.hand.splice(p.hand.indexOf(card), 1)
			}
		}

		updateBoardPoints()
		updateBoardView()
		updateShowStatistics()

		// Set new cards style
		for(let c of news) {
			document.getElementById(c.id).classList.add("new")
			let hand = document.getElementById(c.id+"-hnd")
			if(hand)
				hand.classList.add("dead")
		}

		// THEN
		setTimeout(resolveBattle,5000)
	}
	function resolveBattle() {
		const bt = new BattleTurn()
		for(let p of players) {
			bt.addCardSet(p.board)
		}

		const pts = bt.getPts(); // tab[cardSetIndex][cardIndex] = points

		let sortedCards = [] // [{pts:pts, pid:playerId, cid:cardId}, ...]
		for(let pid=players.length-1; pid>=0; --pid) {
			for(let cid=pts[pid].length-1; cid>=0; --cid) {
				sortedCards.push({pts:pts[pid][cid], pid:pid, cid:cid})
			}
		}

		// Remove dead cards
		sortedCards.sort((a,b)=>(a.pts-b.pts)) // min first, max last
		let deadLimit = sortedCards[players.length-1].pts
		const deadCards = sortedCards.filter(a=>(a.pts<=deadLimit))
		for(let d of deadCards) {
			let p = players[d.pid]
			let card = p.board[d.cid]
			p.dead[players[d.pid].dead.length] = card
			document.getElementById(card.id).classList.add("dead")
			p.board[d.cid] = null // live a blank to be replaced by newcards
			
			p.pts -= d.pts // do not earn points for his own dead cards
			for(p of players)
				p.pts += d.pts // earn points for all enemies cards dead
		}

		updateBoardPoints()

		// THEN
		setTimeout(fillCards, 5000)
	}

	function getCardAsHtml(card, template, id /* opt */) {
		id = id || card.id
		let cts = "-->"

		let max = (ctsNames.length/2)|0
		for(let i=0; i<max; i++) {
			cts = `${cts}
<tr class="cts">
	<td><span>${ctsNames[i*2]}: ${card.cts[i*2]|0}</span> <span id="${id}-stt-cts${i*2}" class="stat"></span></td>
	<td><span>${ctsNames[i*2+1]}: ${card.cts[i*2+1]|0}</span> <span id="${id}-stt-cts${i*2+1}" class="stat"></span></td>
</tr>`;
		}

		if(ctsNames.length%2 > 0) {
			cts = `${cts}
<tr class="cts">
	<td><span>${ctsNames[ctsNames.length]}: ${card.cts[card.cts.length]|0}</span> <span id="${id}-stt-cts${ctsNames.length-1}" class="stat"></span></td>
	<td>-</td>
</tr>`;
		}

		cts += "<!--"

		return template.replace(/\$bas/g, card.base | 0)
					.replace(/\$cid/g, id)
					.replace(/\$clr/g, "rgba("+card.ctsShow.join(",")+")")
					.replace(/\$cts/g, cts)
					.replace(/\$eff/g, card.effect.toString())
					.replace(/\$gms/g, card.parties)
					.replace(/\$nam/g, card.name)
	}

	function updateBoardPoints() {
		let lastPts = -1
		let rank = 0
		for(let p of players.sort((a,b)=>b.pts-a.pts)) {
			document.getElementById(p.team.id + "-nam").innerHTML = p.team.name
			document.getElementById(p.team.id + "-rnk").innerHTML = ((lastPts<0 || lastPts !== p.pts) ? ++rank : rank)
			document.getElementById(p.team.id + "-pts").innerHTML = (lastPts = (p.pts | 0))
			document.getElementById(p.team.id + "-rmn").innerHTML = p.deck.length
			document.getElementById(p.team.id + "-ttl").innerHTML = p.team.cards.length
		}
	}
	function updateBoardView() {
		console.log("Board Updating..")
		for(let p of players) {
			const crdDiv = document.getElementById(p.team.id + "-crd")
			let inhtml = ""

			for(let c of p.board) {
				if(c)
					inhtml += getCardAsHtml(c, templates.card)
			}
			crdDiv.innerHTML = inhtml
		}
	}

	function updateHandView(p, callBack) {
		console.log("Hand Updating..")
		document.getElementById("pname").innerHTML = p.team.name
		document.getElementById("pdeck").innerHTML = p.deck.length
		document.getElementById("pdead").innerHTML = p.dead.length

		const crdDiv = document.getElementById("phand")
		const bpok = document.getElementById("pok")
		bpok.disabled = "disabled"
		bpok.onclick = () => {
			bpok.disabled = "disabled"
			bpok.onclick = undefined
			callBack()
		}

		let newHtml = ""
		for(let c of p.hand) {
			if(c)
				newHtml += getCardAsHtml(c, templates.card, c.id+"-hnd")
		}

		crdDiv.innerHTML = newHtml

		for(let c of p.hand) {
			const a = document.getElementById(c.id+"-hnd")
			a.onclick = () => {
				let rnk = p.willPlay.indexOf(c)
				if (rnk >= 0) {
					a.classList.remove("selected")
					p.willPlay.splice(rnk,1)
				} else {
					a.classList.add("selected")
					p.willPlay.push(c)
				}
				checkCanClickOk(p)
				updateShowStatistics(p)
			}
		}
	}

	function updateShowStatistics(whoisplaying /* opt */) {
		const b = new BattleTurn()

		for(let pid = 0; pid < players.length; pid++) {
			b.addCardSet(players[pid].board.filter(lambdaFilterFalsey))
		}

		// Take willPlay of p in consideration if defined
		const inHand = []
		if(whoisplaying) {
			const pid = players.indexOf(whoisplaying)
			const cardSet = b.cardSets[pid]
			for(let c of whoisplaying.willPlay) {
				inHand.push(c)
				cardSet.cards.push(c)
			}
			
			// Erase stats of all cards in hand
			for(let c of whoisplaying.hand) {
				document.getElementById(c.id + "-hnd-stt-ttl").innerHTML = "-"
				document.getElementById(c.id + "-hnd-stt-pwr").innerHTML = "-"
				for(let ctsi = ctsNames.length-1; ctsi >=0; --ctsi)
					document.getElementById(c.id + "-hnd-stt-cts"+ctsi).innerHTML = ""
			}
		}
		
		const stats = b.getStats() // launch debug battle, list<{c:Card, cts:list<int>, ttl:int, pwr:int}>
		for(let s of stats) {
			const isInHand = inHand.indexOf(s.c) >= 0
			const id = s.c.id + (isInHand ? "-hnd" : "")
			document.getElementById(id + "-stt-ttl").innerHTML = "&gt; " + (s.ttl | 0)
			document.getElementById(id + "-stt-pwr").innerHTML = (s.pwr > 0 ? "(+" : "(") + (s.pwr | 0) + ")"

			for(let ctsi = ctsNames.length-1; ctsi >=0; --ctsi)
				document.getElementById(id + "-stt-cts"+ctsi).innerHTML = 
					s.cts[ctsi] ? ((s.cts[ctsi] > 0 ? "[+" : "[") + (s.cts[ctsi] | 0) + "]") : ""
		}
	}

	function checkCanClickOk(p) {
		pok.disabled = (p.board.filter(a=>a).length + p.willPlay.length === rules.b) ? undefined : "disabled"
	}

	function endOfGame() { // TODO finish
		alert("End of game")
	}
}

function lambdaFilterFalsey(a) { return !!a }
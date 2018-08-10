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
		updateBoardPoints()
		updateBoardView()
		fillCards()
	}

	function fillCards() { // Fill cards in players hands // TODO inside
		console.log("Filling cards..")
		let again = 0
		for(let p of players) {
			if(p.isAlive) {
				for(let cid=0; cid<rules.h; cid++) {
					if(!p.hand[cid]) {
						if(p.deck.size <= 0) {
							p.isAlive = false
							break
						} else {
							p.hand[cid] = p.deck.pop()
							again++
						}
					}
				}
				again++
			}
		}
		
		if(again < 2) {
			endOfGame()
			return
		}
		
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

			callback = (!p.team.isAi)
				? () => {
					if(p.board.filter(a=>a).length + p.willPlay.length < rules.b) {
						console.log("Human player getChoice starting...")
						updateHandView(p, /*THEN*/ f)
					} else f()
				}
				: () => {
					console.log("Computer playing...")
					while(p.board.filter(a=>a).length + p.willPlay.length < rules.b) // AI
						p.willPlay[p.willPlay.length] = (Math.random() > 0.5) ? p.hand.pop() : p.hand.shift()

					// THEN
					f()
				}
		}

		return callback
	}
	const getChoice = buildGetChoice()

	function applyChoices() {
		let news = [];
		for(let p of players) {
			while(p.willPlay.length) {
				let rnk = p.board.indexOf(null)
				if(rnk < 0)
					rnk = p.board.length
				
				const card = p.willPlay.pop()
				p.board[rnk] = card
				news[news.length] = card
				p.hand.splice(p.hand.indexOf(card), 1)
			}
		}
			
		updateBoardView()

		for(let c of news) {
			document.getElementById(c.id).classList.add("new")
			let hand = document.getElementById(c.id+"-hand")
			if(hand)
				hand.classList.add("dead")
		}
			
		// THEN
		setTimeout(resolveBattle,5000)
	}
	function resolveBattle() { // TODO finish
		const bt = new BattleTurn()
		for(let p of players) {
			bt.addCardSet(p.board)
		}

		const pts = bt.getPts(); // tab[cardSetIndex][cardIndex] = points

		let sortedCards = [] // [{pts:pts, pid:playerId, cid:cardId}, ...]
		for(let pid=players.length-1; pid>=0; --pid) {
			for(let cid=pts[pid].length-1; cid>=0; --cid) {
				players[pid].pts += pts[pid][cid]
				sortedCards[sortedCards.length] = {pts:pts[pid][cid], pid:pid, cid:cid}
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
		}
		
		updateBoardPoints()

		// THEN
		setTimeout(fillCards, 5000)
	}

	const getCardAsHtml = function(card, template, id) {
		let cts = "-->"
		for(let i=((ctsNames.length/2)|0) -1; i>=0; i--) {
			cts = `${cts}
<tr class="cts">
	<td>${ctsNames[i*2]}: ${card.cts[i*2]}</td>
	<td>${ctsNames[i*2+1]}: ${card.cts[i*2+1]}</td>
</tr>`;
		}

		if(ctsNames.length%2 > 0) {
			cts = `${cts}
<tr class="cts">
	<td>${ctsNames[ctsNames.length]}: ${card.cts[card.cts.length]}</td>
	<td>-</td>
</tr>`;
		}

		cts += "<!--"

		return template.replace(/\$bas/g, card.base)
					.replace(/\$cid/g, id || card.id)
					.replace(/\$cts/g, cts)
					.replace(/\$eff/g, card.effect.toString())
					.replace(/\$gms/g, card.parties)
					.replace(/\$nam/g, card.name)
	}

	function updateBoardPoints() {
		for(let p of players) {
			document.getElementById(p.team.id + "-nam").innerHTML = p.team.name
			document.getElementById(p.team.id + "-rnk").innerHTML = "?" // rank TODO
			document.getElementById(p.team.id + "-pts").innerHTML = p.pts
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
			newHtml += getCardAsHtml(c, templates.card, c.id+"-hand")
		}

		crdDiv.innerHTML = newHtml

		for(let c of p.hand) {
			const a = document.getElementById(c.id+"-hand")
			a.onclick = () => {
				let rnk = p.willPlay.indexOf(c)
				if (rnk >= 0) {
					a.classList.remove("selected")
					p.willPlay.splice(rnk,1)
				} else {
					a.classList.add("selected")
					p.willPlay[p.willPlay.length] = c
				}
				checkCanClickOk(p)
			}
		}
	}

	function checkCanClickOk(p) {
		pok.disabled = (p.board.filter(a=>a).length + p.willPlay.length === rules.b) ? undefined : "disabled"
	}
	
	function endOfGame() {
		alert("End of game")
	}
}


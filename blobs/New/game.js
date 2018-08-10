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
		const newP = {team: t, deck: [...t.cards], hand: [], board: [], dead:[], willPlay:[], pts: 0}

		shuffle(newP.deck)

		players[pnb] = newP
	}

	this.start = function() {
		console.log("Battle starting...")
		updateBoardView()
		fillCards()
	}

	function fillCards() { // Fill cards in players hands // TODO inside
		console.log("Filling cards..")
		for(let p of players) {
			for(let cid=0; cid<rules.h; cid++) {
				if(!p.hand[cid]) {
					if(p.deck.size <= 0) {
						// TODO player is dead
						break;
					} else {
						p.hand[cid] = p.deck.pop()
					}
				}
			}
		}

		// THEN
		setTimeout(getChoice,1)
	}

	function buildGetChoice() {
		console.log("Building GetChoice method...")
		let callback = () => {/* THEN */ setTimeout(applyChoices,1)}

		for(let p of players) {
			if(p.board.length >= rules.b)
				continue

			const f = callback

			const iaPlay = () => {
				console.log("GetChoice finishing...")
				while(p.board.length + p.willPlay.length < rules.b) // AI
					p.willPlay[p.willPlay.length] = (Math.random() > 0.5) ? p.hand.pop() : p.hand.shift()

				// THEN
				setTimeout(f,500)
			}

			const playerPlay = (!p.team.isAi)
				? () => {
					console.log("Human player getChoice starting...")
					updateHandView(p, iaPlay)
				}
				: iaPlay

			callback = playerPlay
		}

		return callback
	}
	const getChoice = buildGetChoice()

	function applyChoices() {
		for(let p of players)
			while(p.willPlay.length)
				p.board[p.board.length] = p.willPlay.pop()

		// THEN
		setTimeout(resolveBattle,1)
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
		const deadCards = sortedCards.filter(a=>(a<=deadLimit))
		for(let d of deadCards) {
			players[d.pid].dead[players[d.pid].dead.length] = players[d.pid].board[cid]
			players[d.pid].board[cid] = null
		}

		updateBoardView()

		// THEN
		setTimeout(fillCards,5000)
	}

	const getCardAsHtml = function(card, template) {
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
					.replace(/\$cid/g, card.id)
					.replace(/\$cts/g, cts)
					.replace(/\$eff/g, card.effect.toString())
					.replace(/\$gms/g, card.parties)
					.replace(/\$nam/g, card.name)
					.replace(/\$lvl/g, card.getLvl())
	}

	function updateBoardView() {
		console.log("Board Updating..")
		// Refresh board
		for(let p of players) {
			const t = p.team
			document.getElementById(t.id + "-nam").innerHTML = t.name
			//document.getElementById(t.id + "-rnk").innerHTML = 0 // rank
			document.getElementById(t.id + "-pts").innerHTML = p.pts
			document.getElementById(t.id + "-rmn").innerHTML = p.deck.length
			document.getElementById(t.id + "-ttl").innerHTML = p.team.cards.length

			const crdDiv = document.getElementById(t.id + "-crd")
			crdDiv.innerHTML = ""

			for(let c of p.board) {
				crdDiv.innerHTML += getCardAsHtml(c, templates.card)
			}
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
		bpok.onclick = callBack

		let newHtml = ""
		for(let c of p.hand) {
			newHtml += getCardAsHtml(c, templates.card)
		}

		crdDiv.innerHTML = newHtml

		for(let c of p.hand) {
			const a = document.getElementById(c.id)
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
		console.log("Checking ok..", p.willPlay.length, rules.b-p.board.length, rules)
		pok.disabled = (p.board.length + p.willPlay.length === rules.b) ? undefined : "disabled"
	}
}


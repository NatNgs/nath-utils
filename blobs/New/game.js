function Game(run, templates) {

	this.load = function(teams) {
		document.body.innerHTML = templates.page

		document.getElementById("returnToSetup").onclick = () => {
			if(confirm("Click YES to Abort the game and return to setup menu. Click NO to continue to play."))
				run.setup.load()
		}

		let printAllCards = ""
		for(let t of teams) {
			for(let c of t.cards) {
				let a = getCardDiv(c, templates.card)

				console.log(a);
				printAllCards += a
			}

			printAllCards += "<hr/>"
		}

		document.getElementById("tmp-allcards").innerHTML = printAllCards;
		
		for(let t of teams) {
			for(let c of t.cards) {
				const a = document.getElementById(c.id)
				console.log(a.classList)
				a.onclick = () => { 
					if (a.classList.contains("selected")) 
						a.classList.remove("selected");
					else
						a.classList.add("selected");
				}
			}

			printAllCards += "<hr/>"
		}


		console.log("LOADED GAME")
	}


	const getCardDiv = function(card, template) {
		//let div = document.getElementById(card.id) || document.createElement('div')

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

		/*div.innerHTML =*/
		return template.replace(/\$bas/g, card.base)
					.replace(/\$cid/g, card.id)
					.replace(/\$cts/g, cts)
					.replace(/\$eff/g, card.effect.toString())
					.replace(/\$gms/g, card.parties)
					.replace(/\$nam/g, card.name)
					.replace(/\$lvl/g, card.getLvl())
		
		//return div;
	}

}
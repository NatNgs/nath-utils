const cardListSortFct = (a, b)=>(a.pts-b.pts);
const outListSortFct = (a, b)=>(a.totalPts/(a.btls || 1)-b.totalPts/(b.btls||1));
	
function Tournament(nbCards) {
	let CARDNB = nbCards || 6;
	const MINTEAMSIZE = 1;
	const MAXTEAMSIZE = 3;
	const MINTEAMS = 2;
	const MAXTEAMS = 6;

	this.cardList = [];
	this.outCardList = [];

	let btlNb = 0;
	this.teamListPtr; // DEBUG
	let divCardList;
	let divStatus;

	const mFinally = function(){console.log('doXBattle done.');}
	this.doXBattle = function(x) {
		if(x<=1)
			this.letsGo(mFinally);
		else {
			this.letsGo(()=>{this.keepMid(); this.doXBattle(x-1);});
		}
	}
	
	this.addCard = function() {
		const card = new Card();
		this.cardList[this.cardList.length] = card;
		divCardList.appendChild(card.getDiv());
	}

	this.keepMid = function() {
		this.cardList.sort(cardListSortFct);
		
		// remove best & worst
		this.outCardList[this.outCardList.length] = this.cardList.shift();
		this.outCardList[this.outCardList.length] = this.cardList.pop();
		
		// reset cards scores
		for(let i=this.cardList.length-1; i>=0; i--)
			this.cardList[i].pts = 0;
		
		// Add 2 new cards
		this.addCard();
		this.addCard();
		
		// refresh removedCardsList
		this.outCardList.sort(outListSortFct);
		for(let i=this.outCardList.length-1; i>=0; i--) {
			document.getElementById(this.outCardList[i].getDivId()).remove();
			divOutCardList.appendChild(this.outCardList[i].getDiv());
		}
	}


	var running = true;
	this.letsGo = function(cb) {
		if(running) {
			console.log("Already running !");
			return;
		}
		
		running = true;
		btlNb = 0;
		divStatus.innerHTML = 0;
		var intervalQ = setInterval(() => {
			if(!running) {
				clearInterval(intervalQ);
				if(cb) cb();
			}
			
			this.updateScreen();
		},
		200);

		doNextBattle(this.getNextBattle());
	}

	this.updateScreen = function() {
		divStatus.innerHTML = btlNb;

		this.cardList.sort(cardListSortFct);
		for(let i=this.cardList.length-1; i>=0; i--) {
			document.getElementById(this.cardList[i].getDivId()).remove();
			divCardList.appendChild(this.cardList[i].getDiv());
		}
	}

	let doNextBattle = function(get) {
		const value = get.next();
		if(value.done) {
			running = false;
			//console.log("Finish !");
			return;
		}
		const battle = value.value;
		const teamPts = battle.fight();
		
		let min = teamPts[0];
		let max = teamPts[0];
		for(let i=teamPts.length-1; i>0; i--) {
			if(teamPts[i]<min) min = teamPts[i];
			if(teamPts[i]>max) max = teamPts[i];
		}
		
		max -= min;
		if(max>0) {
			let team;
			while(team=battle.teams.pop()) {
				const pts = ((teamPts.pop()-min)*100/max) |0;
				for(let j=team.cards.length-1; j>=0; j--) {
					team.cards[j].pts += pts;
					team.cards[j].totalPts += pts;
				}
			}
		}

		setTimeout(doNextBattle, 100, get);
	}

	this.getNextBattle = function*() {
		for(let i=this.cardList.length-1; i>=0; i--)
			this.cardList[i].parties++;

		for(let teamSize=MINTEAMSIZE; teamSize<=MAXTEAMSIZE; teamSize++) {
			let maxTms = this.cardList.length / teamSize | 0;
			if(MAXTEAMS < maxTms)
				maxTms = MAXTEAMS;
			for(let nbTeams=MINTEAMS; nbTeams<=maxTms; nbTeams++) {
				let btlNbTmp = 0;
				for(let pool of getCbnts2(this.cardList,nbTeams,teamSize)) {
					// pool = [[0,1],[2,3],[4,5]]
					const battle = new BattleTurn();
					for(let i=pool.length-1; i>=0; i--) {
						const team = new Team();
						const members = pool[i];
						for(let j=members.length-1; j>=0; j--)
							team.addCard(members[j]);

						battle.addTeam(team);
					}
					if(!battle.isOk()) {
						console.log('BATTLE IS NOT OK: '+battle);
						console.log(JSON.stringify(pool));
						return;
					}
					yield battle;
					++btlNb;
					++btlNbTmp;
				}
				console.log("TeamSize:",teamSize,"nbTeams:",nbTeams,"btl:"+btlNbTmp);
			}
		}
	}
	
	// Loading
	divCardList = document.getElementById('List');
	divOutCardList = document.getElementById('outList');
	divStatus = document.getElementById('Status');
	for(let i=0;i<CARDNB;i++) this.addCard();
	
	running = false; // ready to run
}



function* getCbnts2(inSet, outSize, elemsSize, minFrst) {
	if(outSize<=0)
		return;
	console.time('cbnts2('+inSet.length+','+outSize+','+elemsSize+','+minFrst)

	--outSize;
	for(let c of genCbnts(inSet,elemsSize)) {
		if(minFrst && c[0] < minFrst)
			continue;
		else if(outSize === 0)
			yield [c];
		else {
			const subset = []; // inSet \ elems of c
			for(let i=0; i<inSet.length; i++)
				if(c.indexOf(inSet[i])<0)
					subset[subset.length] = inSet[i];

			for(let rep of getCbnts2(subset, outSize, elemsSize, c[0]+1)) {
				rep[rep.length] = c;
				yield rep;
			}
		}
	}
	console.timeEnd('cbnts2('+inSet.length+','+outSize+','+elemsSize+','+minFrst)
}


/** getCbnts([0,1,2,3,4], 4); 
 * will yield: [0,1,2,3]; [0,1,2,4]; [0,1,3,4]; [0,2,3,4]; [1,2,3,4]
**/
function* genCbnts(inSet, outSize) {
	if(inSet.length < outSize)
		return;
	
	const out = [];
	for(let i=0; i<outSize; i++)
		out[i] = i;
	// init [0,1,2,3,..,outSize-1]
	
	const maxLast = inSet.length-outSize;
	while(true) {
		{	const yld = [];
			for(let i=0; i<outSize; i++)
				yld[i] = inSet[out[i]];
			yield yld;
		}

		out[outSize-1]++;

		//                    i=       v  >   i=   v
		// (of 0,1,2,3,4,5) out=[0,1,4,6] > out=[0,2,5,6]
		let i;
		for(i=outSize-1; i>0; i--) {
			if(out[i] <= maxLast+i)
				break;
			out[i-1]++;
		}
		if(i===0 && out[i] > maxLast)
			return;
		
		//                    i=     v    >   i=         v
		// (of 0,1,2,3,4,5) out=[0,2,5,6] > out=[0,2,3,4]
		for(i++;i<outSize;i++)
			out[i] = out[i-1]+1;
	}
}
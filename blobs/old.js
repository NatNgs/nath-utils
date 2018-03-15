// GetNextBattle Part1
for(let teamSize=MINTEAMSIZE; teamSize<=MAXTEAMSIZE; teamSize++) {
	const teamList = [];
	this.teamListPtr = teamList; // DEBUG
	const getCards = getCombinations(teamSize, this.cardList);

	let card;
	while(card = getCards.next().value) {
		const team = new Team();
		team.addCard(card);
		while(card = getCards.next().value)
			team.addCard(card);

		teamList[teamList.length] = team;
	}
	
	for(let nbTeams=MINTEAMS; nbTeams<=MAXTEAMS/teamSize; nbTeams++) {
		const getTeams = getCombinations(nbTeams, teamList);

		let team;
		while(team = getTeams.next().value) {
			const battle = new BattleTurn();
			battle.addTeam(team);
			while(team = getTeams.next().value)
				battle.addTeam(team);
			
			if(battle.isOk())
				yield battle;
		}
	}
	console.log("TeamSize:"+teamSize+" > "+teamList.length+", btl:"+btlNb);
}

///////////////

function* getCombinations(outNumber, elems) {
	const count = [];
	for(let i=0; i<outNumber; i++)
		count[i] = i;
	
	const maxCount0Value = elems.length-outNumber;
	while(count[0] <= maxCount0Value) {
		for(let i=outNumber-1; i>=0; i--)
			yield elems[count[i]]; 
		//console.log(count.toString()); // for Testing
		yield null;

		count[outNumber-1]++;
		for(let i=outNumber-1; i>=0; i--) { // should descend
			if(count[i]>maxCount0Value+i) {
				if(i===0) break;
				count[i-1]++;
				count[i]=0;
			} else {
				for(let j=i+1; j<outNumber; j++) {
					if(count[j] > count[j-1]) break;
					else count[j] = count[j-1]+1;
				}
				break;
			}
		}
	}
	
	return null;
}


/// Return the cmbNb'th combination of outSize of elmNb elements
function getSpecificCombination(elmNb, outSize, cmbNb) {
	// CHECK INPUTS DEBUG (can be commented)
	if(outSize > elmNb) {
		console.log("There is no combination of "+outSize+" over "+elmNb);
		return;
	}

	let nCk = 1;
	const res = [];

	for(let i=0;i<outSize;i++)
		nCk = Math.floor(nCk*(elmNb-i)/(i+1));

	// CHECK INPUTS DEBUG (can be commented)
	if(cmbNb < 0 || cmbNb >= nCk) {
		console.log("Cannot get "+(cmbNb+1)+"th combination of "+outSize+" over "+elmNb+": not in [1,"+nCk+"]");
		return;
	}
	
	let curIndex = nCk;
	do {
		nCk = Math.floor(nCk*outSize/elmNb);
		while(curIndex - nCk > cmbNb) {
			if(nCk===0)	{
				console.log("Mathematic problem: too large number");
				return;
			}

			curIndex -= nCk;
			nCk *= elmNb-outSize;
			elmNb--;
			nCk = Math.floor((nCk-(nCk%outSize))/elmNb);
		}
		elmNb--;
		res[res.length] = elmNb;
	} while(--outSize);
	
	return res;
}


function* getCbnts(inSet, outSize, max) {
	max++;
	if(outSize<=0)
		return;
	else if(--outSize === 0)
		for(let i=0; i<(max || inSet.length); i++)
			yield [inSet[i]];

	else {
		for(let i=outSize; i<(max || inSet.length); i++) {
			for(let rep of getCbnts(inSet, outSize, i-1)) {
				rep[rep.length] = inSet[i];
				yield rep;
			}
		}
	}
}
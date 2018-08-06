const ctsNames = ['A','B','C','D']
const effectsPowers = [-1, -0.5, 0.5, 1, 1.5, 2]

const TARG_SELF = "Self"
const TARG_ALIE = "Allies"
const TARG_TEAM = "Team"
const TARG_FOES = "Enemies"
const TARG_OTHR = "Others"
const TARG_ALL  = "All"

const effectsTarget = [TARG_SELF, TARG_ALIE, TARG_TEAM, TARG_FOES, TARG_OTHR, TARG_ALL]
const targetIndex = {} // {Self:0, Team:1, Enemies:2, All:3}
for(let i=effectsTarget.length-1; i>=0; i--)
	targetIndex[effectsTarget[i]] = i

// TODO: tab[targetIndex] = flags; flags=Self, Allies, Foes  and use these flags instead of using TARG_XX constants

const allCards = []
let cardNumber = 0

function Card(template) {
	this.nb = ++cardNumber // 1 to +inf
	this.id = "card"+cardNumber
	this.name = "Card#"+cardNumber
	allCards[allCards.length] = this
	
	this.pts = 0
	this.totalPts = 0
	this.parties = 0
	
	this.cts = new Array(ctsNames.length)
	for(let i=0; i<ctsNames.length; i++)
		this.cts[i] = (Math.random()*10-4) |0 // -4 to 6
	
	this.base = (Math.random()*89+10) |0 // 10 to 99
	this.effect = new Effect()
	
	// return int
	this.getPoints = function(teamEffects /* tab[ctsIndex] = coef*/) {
		switch(this.effect.target) {
			case targetIndex[TARG_SELF]: // add self effects
				teamEffects[this.effect.cts] += this.effect.power
				break
			case targetIndex[TARG_OTHR]: // cancel self effect if effect on others
			case targetIndex[TARG_ALIE]: // cancel self effect if effect on others
				teamEffects[this.effect.cts] -= this.effect.power
		}
		
		// apply effects and sum points
		let points = this.base
		for(let i=teamEffects.length-1; i>=0; i--)
			points += teamEffects[i] * this.cts[i]
		
		return points
	};

	this.toString = function() {
		return "{"+this.name+"}"
	}

	this.getDiv = function() {
		let div = document.getElementById(this.id) || document.createElement('div')
		
		let cts = ""
		for(let i=((ctsNames.length/2)|0) -1; i>=0; i--) {
			cts = `${cts}
<tr class="cts">
	<td>${ctsNames[i*2]}: ${this.cts[i*2]}</td>
	<td>${ctsNames[i*2+1]}: ${this.cts[i*2+1]}</td>
</tr>`;
		}
		
		if(ctsNames.length%2 > 0) {
			cts = `${cts}
<tr class="cts">
	<td>${ctsNames[ctsNames.length]}: ${this.cts[this.cts.length]}</td>
	<td><hr /></td>
</tr>`;
		}
		
		div.innerHTML = template
							.replace(/\$c/gi, this.id)
							.replace(/\$name/gi, this.name)
							.replace(/\$base/gi, this.base)
							.replace(/\$pts/gi, (this.totalPts/(100*this.parties||1))|0)
							.replace(/\$gms/gi, this.parties)
							.replace(/\$curr/gi, (this.pts/100)|0)
							.replace(/\$effect/gi, this.effect.toString())
							.replace(/\$cts/gi, cts)
		return div;
	}
}

function Effect() {
	this.target = (Math.random()*effectsTarget.length)|0
	this.power = effectsPowers[(Math.random()*effectsPowers.length)|0]
	this.cts = (Math.random()*ctsNames.length)|0
	
	this.toString = function() {
		return this.power===0
			?"+0"
			:(this.power>0
				?("+"+this.power)
				:this.power) 
			+" on "+effectsTarget[this.target]+"'s "+ctsNames[this.cts]
	}
}


function Team(id, name) {
	this.id = id || null
	this.name = name || null
	this.cards = []
	
	this.addCard = function(card) {this.cards[this.cards.length] = card}
	
	// return tab[ctsIndex][targetIndex] = int
	this.getCoefs = function() {
		// init coefs>0
		const coefs = []; // coefs[cts][target] = int
		for(let i=0; i<ctsNames.length; i++) {
			const ctgt = [0];
			for(let j=1; j<effectsTarget.length; j++)
				ctgt[j] = 0;

			coefs[i] = ctgt;
		}
		
		// fill coefs
		for(let cn=this.cards.length-1; cn>=0; cn--) {
			const effect = this.cards[cn].effect;
			coefs[effect.cts][effect.target] += effect.power;
		}
		return coefs; 
	};

	// return tab[cardIndex] = points
	this.getPoints = function(teamEffects /* tab[ctsIndex] = coef*/) {
		const points = [];
		for(let i=0; i<this.cards.length; i++)
			points[i] = this.cards[i].getPoints(teamEffects);

		return points;
	};
	
	this.getScore = function(teamEffects /* tab[ctsIndex] = coef*/) {
		let points = 0;
		for(let i=this.cards.length-1; i>=0; i--)
			points += this.cards[i].getPoints(teamEffects);

		return points;
	}

	this.toString = function(){
		var str = "\t[";
		for(let i=0; i<this.cards.length; i++)
			str+=this.cards[i].toString()+", ";
		
		return str + "]";
	}	

	// return boolean
	this.hasSameCard = function(team2) {
		for(var i=this.cards.length-1; i>=0; i--)
			if(team2.cards.indexOf(this.cards[i]) >= 0)
				return true;

		return false;
	}
}

function BattleTurn() {
	this.teams = [];
	
	this.addTeam = function(team){this.teams[this.teams.length] = team;}
	
	// return tab[teamIndex][ctsIndex] = coef
	this.getTeamCoefs = function() {
		// init coefs>0
		const coefs = []; // tab[team][cts] = int
		for(let tn=0; tn<this.teams.length; tn++) {
			const teamCoefs = [];
			for(let ctsi=0; ctsi<ctsNames.length; ctsi++)
				teamCoefs[ctsi] = 0;

			coefs[tn] = teamCoefs;
		}
		
		// compute teams coefs
		for(let tn=0; tn<this.teams.length; tn++) {
			const cTeam = this.teams[tn].getCoefs(); // return tab[ctsIndex][targetIndex] = int

			for(let ctsi=ctsNames.length-1; ctsi>=0; ctsi--) {
				const cTeami = cTeam.pop(); // cTeam[ctsi]

				const allValue = cTeami[targetIndex[TARG_ALL]] 
					           + cTeami[targetIndex[TARG_OTHR]];

				// compute & apply team tn coefs
				coefs[tn][ctsi] += allValue
					+ cTeami[targetIndex[TARG_TEAM]] 
					+ cTeami[targetIndex[TARG_ALIE]];
				
				// compute others teams coefs
				const foeValue = allValue
					+ cTeami[targetIndex[TARG_FOES]];

				// apply others teams coefs
				for(let fn=this.teams.length-1;fn>=0; fn--)
					if(fn!==tn) coefs[fn][ctsi] += foeValue;
			}
		}
		return coefs;
	};

	// return tab[teamIndex][cardIndex] = points
	this.fight = function() {
		const teamCoefs = this.getTeamCoefs(); // tab[teamIndex][ctsIndex] = coef
		
		// compute points for each card
		const points = [];
		for(let i=0; i<this.teams.length; i++)
			points[i] = this.teams[i].getScore(teamCoefs[i]);
		
		return points; // tab[teamIndex] = points
	};
	
	// return boolean
	this.isOk = function() {
		for(let t1=0; t1<this.teams.length-1; t1++)
			for(let t2=t1+1; t2<this.teams.length; t2++)
				if(this.teams[t1].hasSameCard(this.teams[t2]))
					return false;

		return true;
	}
	
	this.toString = function(){
		var str = "[\n";
		for(let i=0; i<this.teams.length; i++)
			str+=this.teams[i].toString()+"\n";
		
		return str + "]";
	}
}


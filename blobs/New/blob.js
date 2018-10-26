const ctsNames = ['R','G','B','T']
const baseValue = {min:11, max:49}
const ctsValues = [
	/*R*/{min:0, max:10, minShow:0, maxShow:255, unitShow:1},
	/*G*/{min:0, max:10, minShow:0, maxShow:255, unitShow:1},
	/*B*/{min:0, max:10, minShow:0, maxShow:255, unitShow:1},
	/*T*/{min:0, max:10, minShow:1, maxShow:0,   unitShow:0.1}
]

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

function Card() {
	this.nb = ++cardNumber // 1 to +inf
	this.id = "card"+cardNumber
	this.name = nameGen(cardNumber)
	allCards.push(this)

	this.cts = []
	this.ctsShow = []
	for(let i=0; i<ctsNames.length; i++) {
		const val = ctsValues[i]
		const rnd = Math.random()
		this.cts[i] = (0.5 + rnd*(val.max-val.min)+val.min)|0
		this.ctsShow[i] = ((0.5 + (rnd*(val.maxShow-val.minShow)+val.minShow)/val.unitShow)|0)*val.unitShow
	}
		console.log(this.ctsShow)

	this.base = (Math.random()*(baseValue.max-baseValue.min)+baseValue.min)|0
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
}

function Effect() {
	this.target = (Math.random()*effectsTarget.length)|0
	this.cts = (Math.random()*ctsNames.length)|0
	this.power = effectsPowers[(Math.random()*effectsPowers.length)|0]

	this.isApplyingTo = function(isSameCard, isSameTeam) {
		if(this.target === targetIndex[TARG_ALL]) {
			return true
		} else if(isSameCard) switch(this.target) {
			case targetIndex[TARG_SELF]:
			case targetIndex[TARG_TEAM]:
				return true
		} else if(isSameTeam) switch(this.target) {
			case targetIndex[TARG_ALIE]:
			case targetIndex[TARG_TEAM]:
			case targetIndex[TARG_OTHR]:
				return true
		} else switch(this.target) {
			case targetIndex[TARG_FOES]:
			case targetIndex[TARG_OTHR]:
				return true
		}
		return false
	}
	this.toString = function() {
		let str = this.power > 0 ? "+" : "-"
		let pwr = Math.abs(this.power)
		
		if(pwr < 1) {
			str += "1/"
			pwr = 1/pwr
		} 
		
		return str + (((10*pwr)|0)/10) +" on "+effectsTarget[this.target]+"'s "+ctsNames[this.cts]
	}
}


function Team(id, name) {
	this.id = id || null
	this.name = name || null
	this.cards = []
}


function CardSet(cardList /* opt */) {
	this.cards = cardList || []
	
	this.getCoefs = function() {
		// init coefs>0
		const coefs = []; // tab[cts][target] = int
		for(let i=0; i<ctsNames.length; i++) {
			const ctgt = [0]
			for(let j=1; j<effectsTarget.length; j++)
				ctgt[j] = 0

			coefs[i] = ctgt
		}

		// fill coefs
		for(let cn=this.cards.length-1; cn>=0; cn--) {
			const effect = this.cards[cn].effect
			coefs[effect.cts][effect.target] += effect.power
		}
		return coefs // tab[ctsIndex][targetIndex] = int
	};

	this.getPoints = function(teamEffects /* tab[ctsIndex] = coef*/) {
		const points = []
		for(let i=0; i<this.cards.length; i++)
			points[i] = this.cards[i].getPoints(teamEffects)

		return points // tab[cardIndex] = points
	};
}


function BattleTurn() {
	this.cardSets = []
	this.addCardSet = function(cardArray) {
		this.cardSets.push(new CardSet(cardArray))
	}
	
	// list<{c:Card, t:teamIndex, cts:list<int>, ttl:int, pwr:int}>
	//  (pwr = total pts added to team - total pts added to others teams)
	this.getStats = function() {
		const stats = []
		
		for(let csi = this.cardSets.length-1; csi >=0; --csi) {
			cs1 = this.cardSets[csi]
			for(let c1 of cs1.cards) {
				// init
				const stat = {c:c1, t:csi, ttl:c1.base, pwr:0, cts:[]}
				for(let ctsi = 0; ctsi < ctsNames.length; ctsi++) {
					stat.cts[ctsi] = 0
				}
				
				for(let cs2 of this.cardSets) {
					for(let c2 of cs2.cards) {
						// compute c1.ttl && c1.cts (apply c2.effect on c1.cts)
						if(c2.effect.isApplyingTo(c1===c2, cs1===cs2)) {
							let pwr = c2.effect.power * c1.cts[c2.effect.cts]
							stat.cts[c2.effect.cts] += pwr
							stat.ttl += pwr
						}
						
						// compute c1.pwr
						if(c1.effect.isApplyingTo(c1===c2, cs1===cs2)) {
							stat.pwr += (cs1!==cs2 ? -1 : 1) * c1.effect.power * c2.cts[c1.effect.cts]
						}
					}
				}
				stats.push(stat)
			}
		}
		
		return stats
	}
	
	// tab[cardSetIndex][ctsIndex] = coef
	this.getPts = function() {
		const stats = this.getStats()

		// compute points for each card
		const points = []
		for(let i=0; i<this.cardSets.length; i++) {
			points[i] = []
			for(let j=0; j<this.cardSets[i].cards.length; j++) 
				points[i][j] = 0
		}
		
		for(let s of stats) {
			points[s.t][this.cardSets[s.t].cards.indexOf(s.c)] = s.ttl
		}

		return points // tab[cardSetIndex][cardIndex] = points
	};
}

function nameGen(number) {
	const v = ['a', 'i', 'ü', 'é', 'o', 'ou', 'oxo', 'on', 'oho' , 'y']
	const c = ['b', 'l', 'k', 'p', 'r', 't',  'd', 'f', 'ch', 'kr']

	number = Math.abs(Math.sin(number-0.1)*10**5) |0

	let str = (''+number).split('').reverse().map((x,y)=> (y%2?c:v)[x])
	return "Blob" + str.join('');
}


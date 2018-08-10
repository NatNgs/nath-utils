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

function Card() {
	this.nb = ++cardNumber // 1 to +inf
	this.id = "card"+cardNumber
	this.name = nameGen(cardNumber)
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
	
	this.getLvl = function() {
		return (Math.random()*10)|0
	}

	this.toString = function() {
		return "{"+this.name+"}"
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
}


function CardSet(cardList) {
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
		this.cardSets[this.cardSets.length] = new CardSet(cardArray)
	}

	// return tab[cardSetIndex][ctsIndex] = coef
	this.getPts = function() {
		// init coefs
		const coefs = [] // tab[cardSet][cts] = int
		for(let tn=0; tn<this.cardSets.length; tn++) {
			const cardSetCoefs = []
			for(let ctsi=0; ctsi<ctsNames.length; ctsi++)
				cardSetCoefs[ctsi] = 0

			coefs[tn] = cardSetCoefs
		}

		// compute cardSets coefs
		for(let tn=0; tn<this.cardSets.length; tn++) {
			const ccardSet = this.cardSets[tn].getCoefs() // return tab[ctsIndex][targetIndex] = int

			for(let ctsi=ctsNames.length-1; ctsi>=0; ctsi--) {
				const ccardSeti = ccardSet.pop(); // ccardSet[ctsi]
				const allValue = ccardSeti[targetIndex[TARG_ALL]] + ccardSeti[targetIndex[TARG_OTHR]]

				// compute & apply cardSet tn coefs
				coefs[tn][ctsi] += allValue + ccardSeti[targetIndex[TARG_TEAM]] + ccardSeti[targetIndex[TARG_ALIE]]

				// compute others cardSets coefs
				const foeValue = allValue + ccardSeti[targetIndex[TARG_FOES]]

				// apply others cardSets coefs
				for(let fn=this.cardSets.length-1;fn>=0; fn--)
					if(fn!==tn) coefs[fn][ctsi] += foeValue
			}
		}

		// compute points for each card
		const points = []
		for(let i=0; i<this.cardSets.length; i++)
			points[i] = this.cardSets[i].getPoints(coefs[i])

		return points // tab[cardSetIndex][cardIndex] = points
	};
}

function nameGen(number) {
	const v = ['a', 'i', 'ü', 'é', 'o', 'ou', 'oxo', 'on', 'oho' , 'y']
	const c = ['b', 'l', 'k', 'p', 'r', 't',  'd', 'f', 'ch', 'kr']
	
	Math.random()
	
	number *= number * 31
	if(number == 0)
		return "Blob"

	let str = (''+number).split('').reverse().map((x,y)=> (y%2?c:v)[x])
	return "Blob" + str.join('');
}


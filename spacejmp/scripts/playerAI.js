const memSize = 8 // Resent to itself at each computation

/*
 =7 : Last validated move (wait, mv_u, mv_d, mv_l, mv_r, rt_l, rt_r)
 +1 : current rotation (u, d, l, r)
 +8 : Next Wall (u, d, l, r, ul, ur, dl, dr)
 +8 : Next Player (u, d, l, r, ul, ur, dl, dr)
 +8 : Next Coin (u, d, l, r, ul, ur, dl, dr)
 +8 : Next Hidden (u, d, l, r, ul, ur, dl, dr)
*/
const inputs = 40 + memSize

/*
 1. Wait
 4. Jump/Move (up, down, left, right)
 2. Rotate (down-left, down-right)
*/
const outputs = 7 + memSize

const hiddenLayers = [16] // input>[first, ..., last]>output

const evolRatio = 1 / 256 // ]0-1[ (More = faster changes, Less = precise changes)

function Genetic(inheritance) {
	/*
		[0]: Links between input and hidden 0
			[0]: Links from input to neuron 0 of hidden 0
				[0]: Link from neuron 0 of input to neuron 0 of hidden 0
				[1]: Link from neuron 0 of input to neuron 1 of hidden 0
				...
				[m]: Link from neuron 0 of input to neuron m of hidden 0
			[1]: Links from input to neuron 1 of hidden 0
			...
			[x]: Links from input to neuron x of hidden 0
		[1]: Links between hidden 0 and hidden 1
		...
		[n+1]: Links between hidden n and output
	*/
	this.genes = []

	/*
	 input =
		last: str  (wait, mv_u, mv_d, mv_l, mv_r, rt_l, rt_r)
		rot: [0-4] (u,l,d,r)
		next:
			u: [wall, player, playerRot, coin, hidden]
			d    ^       ^                 ^     ^
			l     int >=0 (0=none, 1..+ = distance)
			r
			ul           ! playerRot is string
			ur            ('astro0', ... 'astro3')
			dl
			dr

	 memory = -1 to 1 array (size = memSize)
	*/
	this.buildOutput = function(input, memory) {
		// Building input
		const inpt = []
		for(let a of ['wait', 'mv_u', 'mv_l', 'mv_d', 'mv_r', 'rt_l', 'rt_r']) inpt.push(input.last === a ? 1 : -1)

		for(let r = 0; r <= 3; r++) inpt.push(input.rot === r ? 1 : -1)

		for(let o of ['u', 'l', 'd', 'r', 'ul', 'ur', 'dl', 'dr']) {
			inpt.push(!input.next[o][0] ? -1 : 2 / input.next[o][0] - 1)
			inpt.push(!input.next[o][1] ? -1 : 2 / input.next[o][1] - 1)
			inpt.push(!input.next[o][3] ? -1 : 2 / input.next[o][3] - 1)
			inpt.push(!input.next[o][4] ? -1 : 2 / input.next[o][4] - 1)
		}

		for(let i = 0; i < memory.length; i++) inpt.push(memory[i])

		// compute througth network
		const otpt = this.arrOutput(inpt)

		return {
			wait: (otpt.shift() + 1) / 2,
			mv_u: (otpt.shift() + 1) / 2,
			mv_l: (otpt.shift() + 1) / 2,
			mv_d: (otpt.shift() + 1) / 2,
			mv_r: (otpt.shift() + 1) / 2,
			rt_l: (otpt.shift() + 1) / 2,
			rt_r: (otpt.shift() + 1) / 2,
			mem: otpt,
		}
	}

	this.arrOutput = function(input) {
		let otpt = input
		for(let sl = 0; sl < this.genes.length; sl++) {
			//console.log(otpt)
			let inpt = [1, ...otpt]
			otpt = []
			for(let sg = 0; sg < this.genes[sl].length; sg++) {
				otpt[sg] = 0

				//console.log(inpt.length, this.genes[sl][sg].length)

				for(let s = 0; s < this.genes[sl][sg].length; s++) otpt[sg] += inpt[s] * this.genes[sl][sg][s]

				// FONCTION D'ACTIVATION
				// otpt[sg] = sigmoid(otpt[sg])
				otpt[sg] = Math.tanh(otpt[sg])
			}
		}

		return otpt
	}

	this.export = function() {
		let str = JSON.stringify(this.genes)
		str = str.replace(/[1-9]+\.[0-9]+/g, '0.99999')
		str = str.replace(/0\.([0-9]{0,5})[0-9]*/g, '$1')
		str = str.replace(/([0-9])0+([^0-9])/g, '$1$2')
		str = str.replace(/,-/g, '-')
		str = str.replace(/],\[/g, '][')
		return str
	}
	this.import = function(string) {
		let str = string.replace(/]\[/g, '],[')
		str = str.replace(/([^[])-/g, '$1,-')
		str = str.replace(/([0-9]+)/g, '0.$1')
		this.genes = JSON.parse(str)
	}

	// // // INIT // // //

	if(inheritance && inheritance.length > 0) {
		// Average of all inherited + random value
		const nb = inheritance.length

		// sl: synapse layer
		for(let sl = 0; sl < inheritance[0].length; sl++) {
			this.genes[sl] = []
			// sg: synapse group
			for(let sg = 0; sg < inheritance[0][sl].length; sg++) {
				this.genes[sl][sg] = []
				// s: synapse
				for(let s = 0; s < inheritance[0][sl][sg].length; s++) {
					let total = 0
					let chance = Math.random() * 2 - 1 // -1 to 1

					for(let i = 0; i < inheritance.length; i++) total += inheritance[i][sl][sg][s]

					this.genes[sl][sg][s] = (total / nb) * (1 - evolRatio) + chance * evolRatio
				}
			}
		}
	}
	else {
		// random generation
		this.genes.push([inputs, hiddenLayers[0]])
		for(let l = 1; l < hiddenLayers.length; l++) this.genes.push([hiddenLayers[l - 1], hiddenLayers[l]])
		this.genes.push([hiddenLayers[hiddenLayers.length - 1], outputs])

		// sl: synapse layer
		for(let sl = 0; sl < this.genes.length; sl++) {
			const size0 = this.genes[sl][0] + 1 // +1 for Bayes
			const size1 = this.genes[sl][1]
			// sg: synapse group
			for(let sg = 0; sg < size1; sg++) {
				this.genes[sl][sg] = []
				// s: synapse
				for(let s = 0; s < size0; s++) this.genes[sl][sg][s] = Math.random() * 2 - 1
			}
		}
	}

}

function min0(a, b) {
	return a <= 0 ? b : (b <= 0 ? a : (a < b ? a : b))
}

function generateAIPlayer(grid) {
	const p = new Player(grid)

	// init ANN
	p.gen = new Genetic() // in player so that it can be modified dynamically without need to rebuild onAskForAction
	p.wrongMoves = 0
	let memory = []
	for(let i = 0; i < memSize; i++) memory.push(0)
	let lastAction = 'wait'

	p.onAskForAction = () => {
		const input = {
			last: lastAction, rot: p.getRotation(), next: p.getSurroundings(),
		}

		const out = p.gen.buildOutput(input, memory)
		memory = out.mem

		const acts = ['wait', 'mv_u', 'mv_l', 'mv_d', 'mv_r', 'rt_l', 'rt_r']
		acts.sort((a, b) => out[b] - out[a])
		let act
		while(!p.doAction(act = acts.shift())) p.wrongMoves++
		lastAction = act
	}
	return p
}

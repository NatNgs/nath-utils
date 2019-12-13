
function RNN(initLayers = [0,0]) {
	const THIS = this;
	THIS.layers = initLayers;
	let nrn = []; // nrn[layer index][neuron index] = Neuron
	let syn = []; // syn[layer0 index][neuron0 index][neuron1 index] = float

	function init() {
		// init neurons
		for(let li=0; li<THIS.layers.length; li++) {
			const l = [];
			for(let ni = 0; ni < THIS.layers[li]; ni++) {
				l.push(new Neuron());
			}
			l.push(neuronOne); // retrurns One, whatever the inputs layers
			nrn.push(l);
		}

		// init synapses
		for(let li=0; li<THIS.layers.length-1; li++) {
			syn[li] = [];
			for(let n0i=0; n0i<nrn[li].length; n0i++) {
				syn[li][n0i] = [];
				for(let n1i=0; n1i<nrn[li+1].length -1; n1i++) { // -1: Last one is NeuronOne: Does not takes any inputs
					syn[li][n0i][n1i] = Math.random()*2-1;
				}
			}
		}
	}

	THIS.test = function(inputs) {
		// Check inputs length
		if(inputs.length !== THIS.layers[0]) {
			throw 'Wrong inputs length: '+ inputs.length +', expected: '+ THIS.layers[0];
		}

		// Set inputs
		for(let ni=0; ni<inputs.length; ni++) {
			nrn[0][ni].value = [inputs[ni]];
		}

		// Descend
		for(let li=1; li<nrn.length; li++) {
			for(let n1i=0; n1i<nrn[li].length-1; n1i++) { // -1: last is NeuronOne, no need for inputs
				// Gathers values from synapses
				const inputs = [];
				for(let n0i=0; n0i<syn[li-1].length; n0i++) {
					inputs.push(nrn[li-1][n0i].value * syn[li-1][n0i][n1i]);
				}
				nrn[li][n1i].update(inputs, (li===nrn.length-1)?sigm:relu);
			}
		}

		// Get outputs
		const outputs = [];
		const l_out = nrn[nrn.length-1];
		let sum = 0;
		for(let ni=0; ni<l_out.length -1; ni++) { // -1: ignore last (NeuronOne)
			const val = l_out[ni].value;
			sum += val;
			outputs.push(val);
		}
		return outputs;
	}

	THIS.addNeuron = function(layerIndex, neuronIndex=-1, rndValue=0) {
		if(layerIndex < 0) {
			layerIndex = THIS.layers.length + layerIndex;
		}
		if(neuronIndex < 0) {
			neuronIndex = THIS.layers[layerIndex] + neuronIndex;
		}

		// New Neuron
		THIS.layers[layerIndex]++;
		nrn[layerIndex].splice(neuronIndex, 0, new Neuron());

		if(layerIndex > 0) {
			// New synapses before
			for(let ni0=0; ni0<nrn[layerIndex-1].length; ni0++) {
				syn[layerIndex-1][ni0].splice(neuronIndex, 0, (Math.random()-0.5)*rndValue);
			}
		}

		if(layerIndex < THIS.layers.length-1) {
			// New synapses after
			syn[layerIndex].splice(neuronIndex, 0, []);
			for(let ni1=0; ni1<nrn[layerIndex+1].length; ni1++) {
				syn[layerIndex][neuronIndex][ni1] = (Math.random()-0.5)*rndValue;
			}
		}
	}

	THIS.removeLowerNeuron = function() {
		// find lower neuron
		const low = {
			l: -1,
			n: -1,
			w: Infinity,
		};
		for(let li=1; li<nrn.length-1; li++) { // hidden layers only
			for(let n1i=0; n1i<nrn[li].length-1; n1i++) { // -1: last is NeuronOne
				let w = 0;

				for(let n0i=0; n0i<nrn[li-1].length; n0i++) {
					const a = syn[li-1][n0i][n1i];
					w += a*a;
				}
				for(let n2i=0; n2i<nrn[li+1].length-1; n2i++) { // -1: last is NeuronOne
					const a = syn[li][n1i][n2i];
					w += a*a;
				}
				if(w < low.w) {
					low.l = li;
					low.n = n1i;
					low.w = w;
				}
			}
		}

		// remove it
		THIS.layers[low.l]--;
		nrn[low.l].splice(low.n, 1);
		syn[low.l].splice(low.n, 1);
		for(let n0i=0; n0i<syn[low.l-1].length; n0i++) {
			syn[low.l-1][n0i].splice(low.n, 1);
		}

		// return it
		return low;
	}

	/**
	 * [1,2,3,4,5] > addLayer(3) > [1,2,3,4,4,5]
	**/
	THIS.addLayer = function(layerIndex) {
		// Moving layers [1,2,3,4,5] > [1,2,3, ,4,5]
		for(let li=THIS.layers.length; li>layerIndex; li--) {
			THIS.layers[li] = THIS.layers[li-1];
			nrn[li] = nrn[li-1];
			syn[li] = syn[li-1];
		}
		nrn[layerIndex+1] = [];
		syn[layerIndex] = [];
		syn.pop(); // 1 less synapses layer than neurons layers

		// Creating neurons
		for(let ni=0; ni<THIS.layers[layerIndex]; ni++) {
			nrn[layerIndex+1][ni] = new Neuron();
		}
		nrn[layerIndex+1].push(neuronOne);

		// Creating synapses (such as RNN output is the same after ading layer than before)
		for(let n0i=0; n0i<THIS.layers[layerIndex]+1; n0i++) {  // +1: includes last (NeuronOne)
			syn[layerIndex][n0i] = [];
			for(let n1i=0; n1i<THIS.layers[layerIndex]; n1i++) {
				syn[layerIndex][n0i][n1i] = (n0i === n1i)?1:0;
			}
		}
	}

	THIS.display = function() {
		const prt = [];
		for(let li=0; li<nrn.length; li++) {
			const prtl = [];
			for(let ni=0; ni<nrn[li].length-1; ni++) {
				prtl.push(  (((nrn[li][ni].value)|0)+'').padStart(2, ' ')  );
			}
			prt.push(prtl.join(' '))
		}
		return prt.join('\n');
	}

	THIS.toJson = function() {
		return JSON.stringify({n: THIS.layers, s: syn});
	}
	THIS.fromJson = function(json) {
		const data = JSON.parse(json);
		THIS.layers = data.n;
		syn = data.s;
		nrn = [];

		for(let li=0; li<THIS.layers.length; li++) {
			const l = [];
			for(let ni = 0; ni < THIS.layers[li]; ni++) {
				l.push(new Neuron());
			}
			l.push(neuronOne); // retrurns One, whatever the inputs layers
			nrn.push(l);
		}
	}

	THIS.alter = function(func) {
		for(let li=0; li<syn.length; li++) {
			for(let n0i=0; n0i<syn[li].length; n0i++) {
				for(let n1i=0; n1i<syn[li][n0i].length; n1i++) {
					syn[li][n0i][n1i] = func(syn[li][n0i][n1i]);
				}
			}
		}
	}

	init();
}
function copyRNN(toCopy) {
	const copy = new RNN();
	copy.fromJson(toCopy.toJson());
	return copy;
}

function Neuron() {
	this.value = 1;
	this.update = function(inputs, func) {
		let sum = 0;
		for(let i=0; i<inputs.length; i++) {
			sum += inputs[i];
		}
		this.value = (func || relu)(sum);
	}
}
const neuronOne = new Neuron();
neuronOne.update = function(){};

function relu(val) {
	return val<=0?0:val;
}
function sigm(val) {
	return 1/(1+Math.exp(-val));
}

function alterRNNrand(rnn, chanceToUpdate, modifRange) {
	rnn.alter(value => value + ((Math.random()<chanceToUpdate)?0: (Math.random()*2-1)*modifRange));
}
function alterRNNnorm(rnn, chanceToUpdate, modifRange) {
	rnn.alter(value => value + ((Math.random()<chanceToUpdate)?0: randomNormal()*modifRange));
}

function randomNormal() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0*Math.log(u)) * Math.cos(2.0*Math.PI*v);
}

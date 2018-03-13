const cleanInput = (x)=>x.replace(/\n\r?/g,'␤')
						 .replace(/\ /g,'␣')
						 .replace(/[\x00-\x1F]/g,(x)=>String.fromCharCode('␀'.charCodeAt(0)+x.charCodeAt(0)));

function textLoaded(text, cb) {
	let nbOp = 0
	text = cleanInput(text)
	cb(text)
	setTimeout(()=>{
		const t = new Text()
		t.set(text)
		t.reduceMax(()=>cb(t.toCode()), ()=>{console.log(++nbOp)})
	},1)
}

function Text() {
	this.symbols = [] // strings
	this.frequencies = [] // linked with symbols (same size, same indexes) negative value = already reduced
	this.orderedSequence = [] // int (corresponding to index in symbols)

	this.set = function(text) {
		// reset
		this.orderedSequence = []
		this.symbols = []
		this.frequencies = []

		// set
		const tln = text.length
		for(let i=0; i<tln; ++i) {
			const c = text[i]
			let rnk = this.symbols.indexOf(c)
			if(rnk < 0) {
				rnk = this.symbols.length
				this.symbols[rnk] = c
				this.frequencies[rnk] = 1
			} else {
				this.frequencies[rnk] ++
			}
			this.orderedSequence[i] = rnk
		}
	}


	this.reduceMax = function(cb, cbInc) {
		if(this.reduceOnce()) {
			setTimeout(()=>this.reduceMax(cb, cbInc),0)
			if(cbInc)
				cbInc()
		} else if(cb)
			cb()
	}


	/**
	 * build list of frequencies for all combination of 2 or more following symbols
	 * @return [[symbolIndex1<int>, ...], frequency<int>], ...]
	 */
	this.getCandidatesV3 = function() {
		const ordSqLn = this.orderedSequence.length

		// [[symbolIndex1<int>, ...], frequency<int>], ...]
		// locations are location of the last char of the sequence (0 is beginning of the orderedSequence)
		const candidates = []

		let candidatesOneLess = null

		let sqLn = 0 // sequenceLength -1 (0>sequences of 1 symbol; 42>sequences of 43 symbols)
		{	// Get location of all uniques symbols in orderedSequence, ordered by symbol
			const cx = new Map()
			for(let i=ordSqLn-1; i>=0; --i) {
				const c = this.orderedSequence[i]
				const locs = cx.get(c)||[]
				locs[locs.length] = i
				cx.set(c, locs)
			}

			candidatesOneLess = [] // keep only when frequency > 1
			cx.forEach((v,k)=>{if(v.length>1)candidatesOneLess[candidatesOneLess.length]=[[k],v]})
		}

		// find sequences of multiple symbols
		while(candidatesOneLess.length > 0) {
			sqLn++
			const filteredSub = []

			while(candidatesOneLess.length > 0) {
				const curCdt = candidatesOneLess.pop()
				const symSerie = curCdt[0] // [symbol1<int>, ...]
				const lastLocs = curCdt[1] // [loc1<int>, ...]
				
				const sub = new Map() // {nextSymbolIndex<int>: [location]}
				lastLocs.forEach(loc=>{
					loc = loc+1
					if(loc<ordSqLn) {
						const c = this.orderedSequence[loc]
						const locs = sub.get(c)||[]
						locs[locs.length] = loc
						sub.set(c, locs)
					}
				})
				
				if(sub.size === 1) {
					let thesub
					sub.forEach((v,k)=>thesub=[k,v])
					if(thesub[1].length > 1) {
						filteredSub[filteredSub.length] = [[...symSerie, thesub[0]],thesub[1]]
						if(thesub[1].length < lastLocs.length) {
							// if: everywhere there is symSeries, this is always followed by the same symbol, do not add to candidates the current symSerie (the larger one will be added later)
							candidates[candidates.length] = [symSerie, lastLocs.length]
						}
					}
				} else {
					sub.forEach((v,k)=>{if(v.length>1) filteredSub[filteredSub.length] = [[...symSerie, k],v]})
					candidates[candidates.length] = [symSerie, lastLocs.length]
				}
			}
			candidatesOneLess = filteredSub
		}
		return candidates
	}

	/**
	 * build list of frequencies for all combination of 2 following symbols
	 * that can be found multiple time in the sequence
	 * @return [[symbolIndex1<int>, symbolIndex2<int>, frequency<int>], ...]
	 */
	this.buildCandidatesV2 = function() {
		const subSeqMap = new Map() // {char0<int>: {char1<int>: freq<int>, ...}, ...}
		let char0 = this.orderedSequence[0]
		for(let i=1;i<this.orderedSequence.length;++i) {
			const char1 = this.orderedSequence[i]

			const subSeqFrq = subSeqMap.get(char0) || new Map()
			const freq = subSeqFrq.get(char1) || 0
			subSeqFrq.set(char1, freq+1)
			subSeqMap.set(char0, subSeqFrq)

			char0 = char1
		}

		// flatten subSeqMap
		const candidates = []
		subSeqMap.forEach((ss,c0)=>
			ss.forEach((c1,f)=>{if(f>0)candidates[candidates.length]=[c0,c1,f]}))
		return candidates
	}


	const frqSrt = (a,b)=>a[1]-b[1];
	this.reduceOnce = function() {
		const sortedFrequencies = []
		for(let i=0; i<this.frequencies.length; ++i)
			sortedFrequencies[i] = [i, this.frequencies[i]];

		sortedFrequencies.sort(frqSrt)

		const maxFrq = sortedFrequencies.pop();
		if(maxFrq[1]<0) {
			return false// everything maximized
		}

		const candidates = this.getCandidates(maxFrq[0]);

		for(let i=candidates.length-1;i>=0;--i) {
			this.reduceSymbol([maxFrq[0],candidates[i][0]])
		}

		this.frequencies[maxFrq[0]] *= -1

		this.clearNullFrequencies()
		//(ptsFct||defaultPtsFct)(this.symbols[i], this.frequencies[i])
		return true
	}


	const keepMultiple = c=>c[1]>1;
	/**
	 * build list of frequencies for all combination of 2 following symbols
	 * starting by 'beg' that can be found multiple time in the sequence
	 * @return [[symbol<str>, frequency<int>], ...]
	 */
	this.getCandidates = function(beg) {
		// find all sub-sequences beginning by 'beg'
		const subSeq = []
		const subSeqFrq = []
		let ssLn = -1;
		for(let i=0;i<this.orderedSequence.length-1;++i){
			if(this.orderedSequence[i]===beg) {
				const c = this.orderedSequence[i+1]
				const index = subSeq.indexOf(c)
				if(index<0) {
					subSeq[++ssLn] = c
					subSeqFrq[ssLn] = 1
				} else {
					subSeqFrq[index] ++
				}
			}
		}

		const currSymbol = this.symbols[beg]
		const candidates = [];
		for(;ssLn>=0;--ssLn)
			candidates[ssLn] = [subSeq[ssLn], subSeqFrq[ssLn]]

		return candidates.filter(keepMultiple)
	}

	this.clearNullFrequencies = function() {
		const newSymbols = []
		const newFrq = []
		let ln = -1

		for(let i=0;i<this.symbols.length;++i) {
			if(this.frequencies[i]!==0) {
				newSymbols[++ln] = this.symbols[i]
				newFrq[ln] = this.frequencies[i]
			} else {
				this.orderedSequence = this.orderedSequence.map(s=>s>ln?s-1:s)
			}
		}

		this.symbols = newSymbols
		this.frequencies = newFrq
	}

	this.reduceSymbol = function(symbolsToMerge /* int array */) {
		let newSymbol = ""
		for(let i=0;i<symbolsToMerge.length;++i)
			newSymbol += this.symbols[symbolsToMerge[i]]

		let newSymbolIndex = this.symbols.indexOf(newSymbol)
		if(newSymbolIndex < 0)
			newSymbolIndex = this.symbols.length

		// find and replace in orderedSequence
		const newOrderedSequence = []
		let newLn = -1
		let replacements = 0

		while(this.orderedSequence.length >= symbolsToMerge.length) {
			let ok = true
			for(let i=symbolsToMerge.length-1;i>=0;--i) {
				if(this.orderedSequence[i]!==symbolsToMerge[i]) {
					ok = false
					break
				}
			}

			if(ok) {
				for(let i=symbolsToMerge.length-1;i>=0;--i)
					this.orderedSequence.shift()
				newOrderedSequence[++newLn] = newSymbolIndex
				replacements++
			} else {
				newOrderedSequence[++newLn] = this.orderedSequence.shift()
			}
		}

		while(this.orderedSequence.length > 0)
			newOrderedSequence[++newLn] = this.orderedSequence.shift()

		if(replacements > 0) {
			this.symbols[newSymbolIndex] = newSymbol
			this.frequencies[newSymbolIndex] = (this.frequencies[newSymbolIndex]||0)+replacements
			for(let s of symbolsToMerge) {
				this.frequencies[s] -= replacements
			}
		}

		this.orderedSequence = newOrderedSequence
		return replacements
	}

	this.toString = function(sep) {
		return this.orderedSequence.map(s=>this.symbols[s]).join(sep||'');
	}

	const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ(){}[]<>+-*%$&@#.!?:;_€£µß|'

	this.toCode = function(sep,ptsFct) {
		let dict = []
		let values = []
		let limit = 0

		// dict[ [origin, pts], ... ]
		const usedAlphabet = new Set()

		{
			const symbols = this.symbols.map((s,i)=>[s,(ptsFct||defaultPtsFct)(s,Math.abs(this.frequencies[i]))])
			while(symbols.length > 0) {
				const s = symbols.shift()
				if(s[1] <= 0) {
					for(let c=s[0].length-1;c>=0;--c)
						usedAlphabet.add(s[0][c])
				} else {
					values[values.length] = [dict.length, s[1]] // [i, pts]
				}
				dict[dict.length] = s
			}
		}

		let newChar = new Set((this.toString()+charset).split('').filter(a=>!usedAlphabet.has(a)))


		values = values.sort((a,b)=>a[1]-b[1])
		console.log("newChars: "+newChar.size, "Values: "+values.length, "Limit: "+limit)
		while(newChar.size <= values.length) {
			limit = values[0][1]
			do {
				const symbol = dict[values.shift()[0]][0]
				for(let i=symbol.length-1;i>=0;--i)
					newChar.delete(symbol[i])
			} while(values.length >0 && values[0][1] <= limit)

		}

		console.log("newChars: "+newChar.size, "Values: "+values.length, "Limit: "+limit)
		values = undefined

		newChar = Array.from(newChar)

		dict = dict.map(a=>[a[0],a[1],a[1]>limit?newChar.shift()||'▒':a[0]])
		// dict[ [origin, isChanged, changeTo], ... ]

		const text = this.orderedSequence.map(i=>dict[i][2]).join('')

		dict = dict.filter(a=>a[1]>limit).sort((a,b)=>(a[0].length-b[0].length))

		sep=sep||newChar.shift()||'▒'
		let tDict = ''
		while(dict.length>0) {
			const d = dict.shift()
			tDict += sep+d[0]+d[2]
		}

		return tDict+sep+text
	}
}

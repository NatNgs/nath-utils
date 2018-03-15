const cleanInput = (x)=>x.replace(/\n\r?/g,'␤')
						 .replace(/\ /g,'␣')
						 .replace(/[\x00-\x1F]/g,(x)=>String.fromCharCode('␀'.charCodeAt(0)+x.charCodeAt(0)));

function textLoaded(text, cb) {
	let nbOp = 0
	text = cleanInput(text)
	cb(text)
	console.log('init')
	setTimeout(()=>{
		const t = new Text()
		t.set(text)
		t.reduce(()=>{
			cb(t.toCode()+'\n\n'+t.toString(' '))
			console.log('Reduced !')
		})
	},1000)
}


function decode(text) {
	const sep = text[0]
	const tab = text.split(sep)
	
	let encoded = tab.pop()
	
	while(tab.length > 0) {
		const e = tab.shift()
		const replaceFrom = e[e.length-1]
		const replaceTo = e.substr(0, e.length-1)
		
		encoded = encoded.split(replaceFrom).join(replaceTo)
	}
	
	return encoded
}


function Text() {
	this.symbols = [] // [symbol<str>, ...]
	this.orderedSequence = [] // [symbol<int>, ...] (corresponding to index in symbols)

	this.set = function(text) {
		// reset
		this.orderedSequence = []
		this.symbols = []

		// set
		const tln = text.length
		for(let i=0; i<tln; ++i) {
			const c = text[i]
			let rnk = this.symbols.indexOf(c)
			if(rnk < 0) {
				rnk = this.symbols.length
				this.symbols[rnk] = c
			}
			this.orderedSequence[i] = rnk
		}
	}

	this.lnOf = function(symbolSeq) {
		let ln = 0
		for(let i=symbolSeq.length-1; i>=0; i--)
			ln+=this.symbols[symbolSeq[i]].length
		
		return ln
	}
	
	
	const defaultPtsFct = (symbolLn,frequency)=>(symbolLn-1)*(frequency-1)-3;
	this.reduce = function(cb, ptsFct, runAsync) {
		runAsync = runAsync || this.reduceAsync(ptsFct || defaultPtsFct)
		if(!runAsync.next().done)
			setTimeout(()=>this.reduce(cb, null, runAsync), 1)
		else if(cb)
			cb()
	}
	
	this.getCandidatesPts = function(ptsFct) {
		return this.getCandidates() //  [[symbolIndex1<int>, ...], frequency<int>], ...]
				   .map(x=>[x[0],ptsFct(this.lnOf(x[0]),x[1]),x[1]]) // [[symobl<int>, pts<dble>, frq<int>], ...]
				   .filter(x=>x[1]>1) // ignoring when negative or useless score
				   .sort((a,b)=>b[1]-a[1]) // sorting better first, fewer pts last
				   
		/*let c = this.getCandidates()
		console.log(c.length)
		c=c.map(x=>[x[0],ptsFct(this.lnOf(x[0]),x[1]),x[1]]) // [[symobl<int>, pts<dble>, frq<int>], ...]
		console.log(c.length)
		c=c.filter(x=>x[1]>1) // ignoring when negative or useless score
		console.log(c.length)
		c=c.sort((a,b)=>b[1]-a[1]) // sorting better first, fewer pts last
		console.log(c.length)
		return c*/
	}
	this.reduceAsync = function*(ptsFct) {
		let candidates = this.getCandidatesPts(ptsFct) // [[symobl<int>, pts<dble>, frq<int>], ...]
		
		while(candidates.length > 0) {
			let c = candidates[0]
			if(c[1]===null) {
				// recomputing all candidates points
				candidates = this.getCandidatesPts(ptsFct) // TODO: infinite loop ?!
				/*candidates = candidates.map(x=>[x[0],ptsFct(this.lnOf(x[0]),x[2]),x[2]]) // [[symobl<int>, pts<dble>, frq<int>], ...]
				   .filter(x=>x[1]>1) // ignoring when negative or useless score
				   .sort((a,b)=>b[1]-a[1]) // sorting better first, fewer pts last*/
				
				if(candidates.length <= 0)
					break
				console.log('Recomputed', candidates.length)
			}

			this.reduceOnce(candidates.shift(), candidates)
			yield
		}
		
		this.recomputeSymbols()
	}
	this.reduceOnce = function(c, candidates) {
		// find every others candidates that contains c[0] inside
		for(let i=candidates.length-1; i>=0;--i) {
			const otherCandidate = candidates[i]
			let matching = otherCandidate[0].length >= c[0].length
			if(matching) {
				matching = false
				for(let beg=otherCandidate[0].length-c[0].length; beg>=0; --beg) {
					let found = true
					for(let j=c[0].length-1; j>=0; --j) {
						if(otherCandidate[0][beg+j]!==c[0][j]) {
							found = false
							break
						}
					}
					if(found) {
						matching = true
						break
					}
				}

				if(matching) {
					otherCandidate[1] = null
					otherCandidate[2] -= c[2]
				}
			}
		}
		
		// reduce selected candidate
		console.log('Reducing:', c[0].map(s=>this.symbols[s]).join(''), 'pts:', c[1], 'frequency:', c[2])
		this.reduceSymbol(c[0])
		console.log('Nb of symbols:', this.symbols.length)
	}
	
	this.recomputeSymbols = function() {
		const mapOldNewSymbols = Array.from(new Set(this.orderedSequence))
		const newSymbols = mapOldNewSymbols.map(x=>this.symbols[x])
		const newOrderedSequence = this.orderedSequence.map(x=>mapOldNewSymbols.indexOf(x))
		
		this.symbols = newSymbols
		this.orderedSequence = newOrderedSequence
	}

	/**
	 * build list of frequencies for all combination of 2 or more following symbols
	 * @return [[[symbolIndex1<int>, ...], frequency<int>], ...]
	 */
	this.getCandidates = function() {
		const ordSqLn = this.orderedSequence.length

		// locations are location of the last char of the sequence (0 is beginning of the orderedSequence)
		const candidates = [] // [[[symbolIndex1<int>, ...], [loc1<int>, ...]], ...]

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
							candidates[candidates.length] = [symSerie, lastLocs]
						}
					}
				} else {
					sub.forEach((v,k)=>{if(v.length>1) filteredSub[filteredSub.length] = [[...symSerie, k],v]})
					candidates[candidates.length] = [symSerie, lastLocs]
				}
			}
			candidatesOneLess = filteredSub
		}
		
		// Remove sequences that share a part (like ABAB in ABABAB is found 2 times, but should be only once)
								      // [[[symbolIndex1<int>, ...], [loc1<int>, ...]], ...]
		const filteredCandidates = [] // [[[symbolIndex1<int>, ...], frequency<int>], ...]
		while(candidates.length > 0) {
			const c = candidates.shift() // [[symbolIndex1<int>, ...], [loc1<int>, ...]]
			const ln = c[0].length
			
			if(c[0].length <= 1 || !c[1] || c[1].length <= 0)
				continue
			
			const loc = c[1].sort((a,b)=>a-b)
			let frq = 1
			
			let last = loc.shift()|0
			while(loc.length > 0) {
				const cur = loc.shift()|0
				if(cur >= last+ln) {
					frq++
					last = cur
				}
			}
			if(frq > 1)
				filteredCandidates[filteredCandidates.length] = [c[0],frq]
		}
		
		console.log('Candidates', filteredCandidates.map(a=>a[0].map(b=>this.symbols[b]).join('|') + ': ' + a[1]))
		return filteredCandidates 
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
		}

		this.orderedSequence = newOrderedSequence
		return replacements
	}

	this.toString = function(sep) {
		return this.orderedSequence.map(s=>this.symbols[s]).join(sep||'');
	}
	this.toReplacedString = function(replacedSymbols) {
		return  this.orderedSequence.map(s=>replacedSymbols[s]).join('');
	}
	
	const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ(){}[]<>+-*%$&@#.!?:;_€£µß|éÉèÈëËíÍìÌïÏóÓòÒöÖúÚùÙüÜ'

	this.toCode = function(forcedSep) {
		let newChar = Array.from(new Set((this.toString()+charset).split('').filter(a=>this.symbols.indexOf(a)<0)))

		let dict = this.symbols.map(s=>[s, s.length<=1?s:newChar.shift()||s])
		const text = this.toReplacedString(dict.map(x=>x[1]))
		
		forcedSep=forcedSep||newChar.shift()||'▒'
		let tDict = ''
		
		while(dict.length>0) {
			const d = dict.shift()
			if(d[0].length>d[1].length)
				tDict += forcedSep+d[0]+d[1]
		}

		return tDict+forcedSep+text
	}
}

let _AreaFrom, _AreaTo, _AlphabetFrom, _AlphabetTo, _BaseFrom, _BaseTo, _StartButton, _StatusBar, _AreaEncoded, _shuffleFrom, _shuffleTo, _decodeBtn, _encodeBtn

function init() {
	_AreaFrom = document.getElementById("AreaFrom")
	_AreaTo = document.getElementById("AreaTo")
	_AlphabetFrom = document.getElementById("from")
	_AlphabetTo = document.getElementById("to")
	_BaseFrom = document.getElementById("fromS")
	_BaseTo = document.getElementById("toS")
	_StartButton = document.getElementById("start")
	_StatusBar = document.getElementById("compress")
	_AutoButton = document.getElementById("autoFrom")
	_AreaEncoded = document.getElementById("AreaEncoded")
	_ShuffleFrom = document.getElementById("shuffleFrom")
	_ShuffleTo = document.getElementById("shuffleTo")
	_decodeBtn = document.getElementById("decode")
	_encodeBtn = document.getElementById("encode")
	checkInputs()
}

const cleanInput = (x)=>x.replace(/\n\r?/g,'␤')
						 .replace(/\ /g,'␣')
						 .replace(/[\x00-\x1F]/g,(x)=>String.fromCharCode('␀'.charCodeAt(0)+x.charCodeAt(0)));

function onError(errorMessage) {
	_StartButton.disabled = _ShuffleFrom.disabled = _ShuffleTo.disabled = true

	_StatusBar.value = errorMessage
	_StatusBar.classList.add("statusErr")
	return false
}
function noMoreError() {
	_StartButton.disabled = _ShuffleFrom.disabled = _ShuffleTo.disabled = false
	
	_StatusBar.value = "Ready to convert"
	_StatusBar.classList.remove("statusErr")
	return true
}

function AreaEncodedChanged() {
	_AreaEncoded.value = cleanInput(_AreaEncoded.value)
}

function autoAreaFrom() {
	_AutoButton.disabled = true // avoid doubleclick

	const bFrom = _AreaFrom.value
	let alpha = _AlphabetFrom.value

	for(let i=bFrom.length-1; i>=0; --i) {
		const c = bFrom[i]
		if(alpha.indexOf(c)<0)
			alpha += c
	}

	_AlphabetFrom.value = alpha
	checkInputs()
}

let checkingInputs = false;
function checkInputsAsync() {
	if(!checkingInputs)
		setTimeout(checkInputs, 1)
}
function checkInputs() {
	checkingInputs = true
	const alphaTo = (_AlphabetTo.value = cleanInput(_AlphabetTo.value))
	const alphaFrom = (_AlphabetFrom.value = cleanInput(_AlphabetFrom.value))
	const areaFrom = (_AreaFrom.value = cleanInput(_AreaFrom.value))

	let error = false
	
	let al = ""
	for(let i=alphaTo.length-1;i>=0;--i) {
		const c = alphaTo[i]
		if(al.indexOf(c)>=0)
			error = `Alphabet "To" contains duplicate symbols: '${c}' (charcode ${c.charCodeAt(0)}, at position ${i})`
		al += c
	}

	if((_BaseTo.value = al.length) <= 1)
		error = 'Alphabet "To" needs at least 2 characters'
	
	al = ""
	for(let i=alphaFrom.length-1;i>=0;--i) {
		const c = alphaFrom[i]
		if(al.indexOf(c)>=0)
			error = `Alphabet "From" contains duplicate symbols: '${c}' (charcode ${c.charCodeAt(0)}, at position ${i})`
		al += c
	}

	if((_BaseFrom.value = al.length) <= 1) {
		_AutoButton.disabled = undefined
		error = 'Alphabet "From" needs at least 2 characters'
	}

	for(let i=areaFrom.length-1; i>=0; --i) {
		const c = areaFrom[i]
		if(alphaFrom.indexOf(c)<0) {
			_AutoButton.disabled = undefined
			error = `Number "From" contains non-in-alphabet-characters: '${c}' (charcode ${c.charCodeAt(0)}, at position ${i})`
		}
	}

	checkingInputs = false
	if(error)
		return onError(error);

	_AutoButton.disabled = true
	return noMoreError()
}

let run = false;
const antiDblClickStart = ()=>{_StartButton.disabled=undefined};
const doConvert = function(){
	run = _AlphabetFrom.readOnly = _AlphabetTo.readOnly = _AreaFrom.readOnly = true
	_encodeBtn.disabled = _decodeBtn.disabled = _ShuffleFrom.disabled = _ShuffleTo.disabled = true
	d_start = new Date()
	_StatusBar.value = `Started Compressing on ${d_start.toISOString()}...`
	convert(_AlphabetFrom.value, _AlphabetTo.value, _AreaFrom.value, cancelConvert)
}

const cancelConvert = function(){
	run = _AlphabetFrom.readOnly = _AlphabetTo.readOnly = _AreaFrom.readOnly = false
	_encodeBtn.disabled = _decodeBtn.disabled = _ShuffleFrom.disabled = _ShuffleTo.disabled = undefined
}

function ClickStart() {
	if(run) {// stop compress
		// avoid doubleclick
		_StartButton.disabled = true

		setTimeout(antiDblClickStart,1000)
		cancelConvert()
	} else {
		if(checkInputs()) { // check for errors before launching
			// avoid doubleclick
			_StartButton.disabled = true

			doConvert()
			setTimeout(antiDblClickStart,1000)
		}
	}
}

function ClickEncode() {
	_AreaEncoded.value = encodeToStr(_AlphabetFrom.value, _AlphabetTo.value, _AreaTo.value)
}

function ClickDecode() {
	const decoded = decodeFromStr(_AreaEncoded.value)
	_AreaFrom.value = decoded.str
	_AlphabetFrom.value = decoded.aFrom
	_AlphabetTo.value = decoded.aTo
	checkInputs()
}



const strSuffhle = (s)=>{
    let a = s.split("")

    for(let i = s.length-1; i>0; --i) {
        const j = (Math.random()*(i+1))|0
        const tmp = a[i]
        a[i] = a[j]
        a[j] = tmp
    }
    return a.join("")
}

function shuffleAlphabetFrom() {
	_AlphabetFrom.value = strSuffhle(_AlphabetFrom.value)
}

function shuffleAlphabetTo() {
	_AlphabetTo.value = strSuffhle(_AlphabetTo.value)
}
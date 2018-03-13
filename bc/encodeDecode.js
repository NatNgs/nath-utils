function decodeFromStr(string) {
	// string should be like: abcdaefghefghefghefgh
	//                    abcd      a       efgh   efgheghegh
	//                   origin  separator  code    encoded
	// origin alphabet: any char, all differents
	// separator: first char of origin
	// code alphabet: any char, all differents
	// encoded: any char composed by code alphabet
	const aOrigin = []
	const aCode = []
	
	// get origin alphabet
	let index=-1
	const len = string.length
	while(true) {
		if(++index > len) {
			alert("string do not follow the right format");
			return // TODO ERROR
		}

		const curr = string[index];
		if(aOrigin[0]===curr)
			break // found from/to separator char

		aOrigin.push(curr);
	}

	// get code alphabet (index is separator char)
	while(true) {
		if(++index > len) {
			alert("string do not follow the right format");
			return // TODO ERROR
		}

		const curr = string[index];
		if(aCode.indexOf(curr)>0)
			break // found first char from encoded string

		aCode.push(curr);
	}

	return {aFrom:aCode.join(""), aTo:aOrigin.join(""), str:string.substr(index)}
}

function encodeToStr(alFrom, alDest, encodedString) {
	return alFrom + alFrom[0] + alDest + encodedString;
}

let d_start;
let tcv, tsrc, tres;

function convert(p_f, p_t, s, onEnd) {
	//convert string to an array of integer digits representing number in base:from
	tsrc = []
	for (let i=s.length-1, k=0; i>=0; --i)
		tsrc[k++] = p_f.indexOf(s[i])

	// table containing base convertion value
	tcv = [1]

	// table containing result
	tres = [tsrc[0]]

	// Calculating
	convert_ph2(1, p_f.length, p_t, onEnd)
}

function convert_ph2(isrc, bFrom, bTo, onEnd) {
	const nextRefresh = new Date().getTime()+34;
	do {
		if(!run) {
			_StatusBar.value="Progression stopped at "+isrc+"/"+tsrc.length+" digits ("+formatDate(new Date() - d_start)+")";
			return onEnd()
		}

		// incrementing conversion table by one power of source base
		for(let icv=tcv.length-1; icv>=0; --icv)
			tcv[icv]*=bFrom;

		// reducing to destination base
		tcv = retenue(tcv, bTo.length);

		const digit = tsrc[isrc];
		for(let icv=0; icv<tcv.length; ++icv)
			if(tres.length <= icv)
				tres[icv] = digit * tcv[icv]
			else
				tres[icv] += digit * tcv[icv]

	} while(++isrc < tsrc.length && nextRefresh>new Date().getTime());

	if(isrc < tsrc.length) {
		setTimeout(()=>convert_ph2(isrc, bFrom, bTo, onEnd), 0);
		_StatusBar.value="Progression: "+isrc+"/"+tsrc.length+" → "+tres.length+" digits ("+formatDate(new Date() - d_start)+")";
		return
	}

	// reducing result table bTo final base
	tres = retenue(tres, bTo.length);

	// Converting bTo string
	let sout = "";
	for (let i=tres.length-1; i>=0; --i)
		sout+= bTo[tres[i]];

	sout = sout.replace(/^0*/, '');
	_StatusBar.value="Finished: "+isrc+" → "+sout.length+" digits ("+formatDate(new Date() - d_start)+")";
	_AreaTo.value = (sout.length<=0)?"0":sout;
	return onEnd()
}

function retenue(tab, max) {
	let i=-1;

	while((++i)<tab.length) {
		if(tab[i] >= max) {
			let r = (tab[i]/max)|0;
			if(tab.length === i+1)
				tab[i+1] = r;
			else
				tab[i+1] += r;
			tab[i] -= r*max;
		}
	}

	return tab;
}

function formatDate(time) {
	let ms = time;
	let d, h, m, s;

	s = Math.floor(ms/1000);
	m = Math.floor(s/60);
	h = Math.floor(m/60);
	d = Math.floor(h/24);
	ms %= 1000;
	s %= 60;
	m %= 60;
	h %= 24;

	let ret = "";
	if(d+h > 0)
		ret += d+"d "+h+"h ";
	if(m > 0)
		ret += m+"m ";

	return ret + s + "s " + ms + "ms"; 
}

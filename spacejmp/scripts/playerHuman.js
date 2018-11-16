function generateManPlayer(grid) {
	const astro = new Astro(grid);

	let shift = false;
	let call;

	bindDisplayToPlayer(astro)
	document.onkeydown = (e=window.event)=>{
		if(e.keyCode === 16) {
			shift = true
		}
		else if(call)
			call(e.keyCode, shift)
	}
	document.onkeyup = (e=window.event)=>{
		if(e.keyCode === 16)
			shift = false
	}
	astro.askForAction = (cb)=>{
		call = (key, shift)=>{
			//console.log((shift?'shift+':'')+key)
			if(shift
			  ? (  (key === 37 && cb(4)) // shift left
			    || (key === 39 && cb(5)) // shift right
			    || (key === 40 && cb(-1))) // shift down
			  : (  (key === 37 && cb(1)) // left
			    || (key === 38 && cb(0)) // up
			    || (key === 39 && cb(3)) // right
			    || (key === 40 && cb(2))) // down
			)
				call = undefined
		}
	};
	return astro
}

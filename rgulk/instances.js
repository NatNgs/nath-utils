function init() {
	//    //   //  // // UTIL
	const map = [];
	

	function newTile(x,y) {
		map[map.length] = new Tile(
			new XpModel(
				Math.abs(x>=y?x:y)||1,
				Math.abs(x>y?y:x)||1
			)
		)
	}

	//    //   //  // // INSTANCIATION
	newTile(0,0); // first tile
	
	let p = new Player(map[0]);
	let m = newBuildingModel();
	map[0].getBuilding(m);

} // end of function init()
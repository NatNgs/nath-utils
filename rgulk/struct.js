//    //   //  // // CONST & UTIL
function binomial(x) {return x*(x+1)/2}
function antiBinomial(x) {return (Math.sqrt(8*x+1)-1)/2}

//    //   //  // // CLASSES (only that some constants depends on)
const XpModel = function(txp=1, tlv=1) {
	this.xpToLv = (xp)=>(antiBinomial(xp/txp)/tlv);
	this.lvToXp = (lv)=>(binomial(lv*tlv)*txp);
}
const BuildingModel = function(txp, tlv) {
	XpModel(txp,tlv);
	this.tasks = []
}

//    //   //  // // CONST & UTIL (only that depends on some classes)
const GENERAL_LEVEL_XPMODEL = new XpModel(1,1)

//    //   //  // // CLASSES
class Player {
	constructor(spawnTile) {
		this.competences = []; // type XpLevel
		this.loc = spawnTile
		this.computeLv()
		//this.lv
		//this.xp
	}
	computeLv() {this.lv=GENERAL_LEVEL_XPMODEL.xpToLv(this.xp=this.competences.reduce(a=>a.xp,0))}
}

class Tile {
	constructor(tileXpModel) {
		this.build = new XpLevel(tileXpModel,0);
		this.buildings = [] // type XpLevel
	}
	getBuilding(buildingModel) {
		if(!buildingModel.isBuildingModel) {       //
			console.log('NOT A BUILDING MODEL !!!!')// DEBUG
			return                                  //
		}                                          //

		for(let i=this.buildings.length; i>=0; i--)
			if(this.buildings[i].build.model === buildingModel)
				return this.buildings[i];
		
		return (this.buildings[this.buildings.length] = new Building(buildingModel))
	}
}

class Building {
	constructor(buildingModel) {
		this.build = new XpLevel(model, 0)
		this.votesFor = []
		this.votesAgainst = []
	}

	/// @return [<TaskModel>]
	listAvailableTasks(player) {
		const tasks = this.build.model.tasks;
		if(this.build.xp <= 0)
			return []
		const ret = []
		
		const taskContext = {player: player, building: this}
		for(let i=tasks.length-1; i>=0; i--)
			if(tasks[i].isAllowed(taskContext))
				ret.push(tasks[i]);

		return ret
	}
	
	/// @return <boolean>
	canBuild() {return this.votesFor.length >= this.votesAgainst.length}
	
	/// @return <boolean>
	canDestruct() {return this.build.xp > 0 && this.votesAgainst.length >= this.votesFor.length}
}

class XpLevel {
	constructor(model, xpAmount=0) {
		this.model = model
		this.set(xpAmount)
	}
	set(xpAmount = 0) {this.lv=this.model.xpToLv(this.xp=xpAmount)}
	up(xpAmount = 1) {this.set(this.xp+xpAmount)}
	toString() {return this.lv.toFixed(2)}
}

const TaskModel = function() {
	/* context = {player: <Player>, building: <Building>} */
	this.isAllowed = (context)=>{console.log("TaskModel#isAllowed called before method was specified !", taskContext); return false};
	this.doSimu = (context)=>{console.log("TaskModel#doSimu called before method was specified !", taskContext)};
	this.doTask = (context)=>{console.log("TaskModel#doTask called before method was specified !", taskContext)};
}

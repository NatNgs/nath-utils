package natngs.integ.srvclt.srv;

import natngs.utils.srv.AServerCmdEmitter;
import natngs.utils.srv.Server;

class SrvPongEmitter extends AServerCmdEmitter {
	SrvPongEmitter(Server server) {
		super(server);
	}

	void send(String pingTime) {
		this.send("PONG", pingTime);
	}
}

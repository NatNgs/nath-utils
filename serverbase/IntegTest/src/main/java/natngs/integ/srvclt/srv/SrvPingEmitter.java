package natngs.integ.srvclt.srv;

import natngs.utils.srv.AServerCmdEmitter;
import natngs.utils.srv.Server;

public class SrvPingEmitter extends AServerCmdEmitter {
	protected SrvPingEmitter(Server server) {
		super(server);
	}

	public void sendPing() {
		sendBroadcast("PING", null);
	}
}

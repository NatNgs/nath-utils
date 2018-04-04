package natngs.integ.srvclt.clt;

import natngs.utils.clt.AClientCmdEmitter;
import natngs.utils.clt.Client;

public class CltPingEmitter extends AClientCmdEmitter {
	protected CltPingEmitter(Client client) {
		super(client);
	}

	public void sendPing() {
		this.send("PING", null);
	}
}

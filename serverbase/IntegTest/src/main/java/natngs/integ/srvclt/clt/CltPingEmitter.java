package natngs.integ.srvclt.clt;

import natngs.utils.clt.AClientCmdEmitter;
import natngs.utils.clt.Client;

import java.util.Calendar;

public class CltPingEmitter extends AClientCmdEmitter {
	protected CltPingEmitter(Client client) {
		super(client);
	}

	public void sendPing() {
		send("PING", Calendar.getInstance().getTimeInMillis());
	}
}

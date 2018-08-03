package natngs.integ.srvclt.srv;

import natngs.utils.srv.AServerCmdEmitter;
import natngs.utils.srv.Server;

import java.util.Calendar;

public class SrvPingEmitter extends AServerCmdEmitter {
	protected SrvPingEmitter(Server server) {
		super(server);
	}

	public void sendPing() {
		sendBroadcast("PING", Calendar.getInstance().getTimeInMillis());
	}
}

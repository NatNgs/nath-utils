package natngs.integ.srvclt.srv;

import natngs.utils.srv.IServerCmdReceiver;

public class SrvPingReceiver implements IServerCmdReceiver {
	@Override
	public void receive(String clientIdentifier, String params) {
		// TODO
		System.err.println("RECEIVED PING");
	}
}

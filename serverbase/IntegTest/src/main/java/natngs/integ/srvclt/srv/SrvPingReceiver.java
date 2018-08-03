package natngs.integ.srvclt.srv;

import natngs.utils.srv.IServerCmdReceiver;
import natngs.utils.srv.Server;

public class SrvPingReceiver implements IServerCmdReceiver {
	private final Server server;

	public SrvPingReceiver(Server s) {
		this.server = s;
	}

	@Override
	public void receive(String clientIdentifier, String params) {
		System.out.println("SrvPingReceiver");
		SrvPongEmitter pongEmitter = new SrvPongEmitter(server);
		pongEmitter.send(params);
	}
}

package natngs.integ.srvclt.clt;

import natngs.utils.clt.Client;
import natngs.utils.clt.IClientCmdReceiver;

public class CltPingReceiver implements IClientCmdReceiver {
	private final Client client;

	CltPingReceiver(Client client) {
		this.client = client;
	}

	@Override
	public void receive(String params) {
		System.out.println("CltPingReceiver");
		CltPongEmitter pongEmitter = new CltPongEmitter(client);
		pongEmitter.send(params);
	}
}

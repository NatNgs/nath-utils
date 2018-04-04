package natngs.integ.srvclt.clt;

import natngs.utils.clt.IClientCmdReceiver;

public class CltPongReceiver implements IClientCmdReceiver {
	@Override
	public void receive(String params) {
		// TODO
		System.err.println("RECEIVED PONG");
	}
}

package natngs.integ.srvclt.srv;

import natngs.utils.srv.IServerCmdReceiver;

import java.util.Calendar;

public class SrvPongReceiver implements IServerCmdReceiver {
	@Override
	public void receive(String clientIdentifier, String params) {
		long time = Calendar.getInstance().getTimeInMillis() - Long.parseLong(params);
		System.err.println("SrvPongReceiver "+time+"ms");
	}
}

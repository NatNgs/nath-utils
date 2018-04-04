package natngs.utils.srv;

public abstract class AServerCmdSender {
	private final Server server;

	protected AServerCmdSender(Server server) {
		this.server = server;
	}

	protected void send(String cmdCode, String params, String... clients) {
		server.sendCmd(cmdCode, params, clients);
	}

	protected void sendBroadcast(String cmdCode, String params) {
		server.sendCmdBroadcast(cmdCode, params);
	}
}

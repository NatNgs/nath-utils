package natngs.utils.clt;

public abstract class AClientCmdSender {
	private final Client client;

	protected AClientCmdSender(Client client) {
		this.client = client;
	}

	protected void send(String cmdCode, String params) {
		client.sendCmd(cmdCode, params);
	}
}

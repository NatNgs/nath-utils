package natngs.utils.clt;

public abstract class AClientCmdEmitter {
	private final Client client;

	protected AClientCmdEmitter(Client client) {
		this.client = client;
	}

	protected void send(String cmdCode, String params) {
		client.sendCmd(cmdCode, params);
	}
}

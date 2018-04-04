package natngs.utils.srv;

public abstract class AServerCmdSender {
	private final AServerController controller;
	
	protected AServerCmdSender(AServerController controller) {
		this.controller = controller;
	}
	
	protected void send(String message, String... clients) {
		controller.server.sendCmd(message, clients);
	}
	
	protected void sendBroadcast(String message) {
		controller.server.sendCmdBroadcast(message, clients);
	}
}

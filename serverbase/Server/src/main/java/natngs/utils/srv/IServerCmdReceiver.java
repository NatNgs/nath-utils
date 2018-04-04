package natngs.utils.srv;

public interface IServerCmdReceiver {
	void receive(String clientIdentifier, String params);
}

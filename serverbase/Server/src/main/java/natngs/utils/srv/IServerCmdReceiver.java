package natngs.utils.srv;

public interface IServerCmdReceiver {
	void receive(String clientIdentifier, List<String> params);
}

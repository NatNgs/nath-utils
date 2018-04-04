package natngs.utils.srv;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;

/*package*/ class SrvClientSocket {
	private final Socket socket;
	private final BufferedReader in;
	private final OutputStreamWriter out;
	private final Map<String /*CmdCode*/, String /*Rule*/> currentRights = new HashMap<>();

	/*package*/ SrvClientSocket(Socket socket) throws IOException {
		this.socket = socket;
		this.in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		this.out = new OutputStreamWriter(socket.getOutputStream());
	}

	/**
	 * setRight(cmdCode, null) to remove the right
	 */
	/*package*/ String setRule(String cmdCode, String rule) {
		if (rule == null) {
			return this.currentRights.remove(cmdCode);
		}
		return this.currentRights.put(cmdCode, rule);
	}

	/*package*/ String getRule(String rule) {
		return this.currentRights.get(rule);
	}

	/*package*/ String getIdentifier() {
		return socket.getInetAddress().getHostAddress();
	}

	/*package*/ void send(String cmdCode, String params) {
		try {
			out.write(cmdCode);
			if (params != null && !params.isEmpty()) {
				out.write(' ');
				out.write(params);
			}
			out.write('\n');
			out.flush();
		} catch (IOException ignored) {}
	}

	/*package*/ void forceDisconnect() {
		try {
			socket.close();
		} catch (IOException ignored) {
		}
	}

	/*package*/ String waitForNextMessage() throws IOException {
		return in.readLine();
	}

	/*package*/ boolean isOpen() {
		return !socket.isClosed();
	}
}

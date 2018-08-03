package natngs.utils.srv;

import com.sun.istack.internal.NotNull;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.HashSet;
import java.util.Set;

/*package*/ class SrvClientSocket {
	private final Socket socket;
	private final BufferedReader in;
	private final OutputStreamWriter out;
	@NotNull /*package*/ String phase;

	/*package*/ SrvClientSocket(@NotNull Socket socket, @NotNull String startPhase) throws IOException {
		this.socket = socket;
		this.in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		this.out = new OutputStreamWriter(socket.getOutputStream());
		this.phase = startPhase;
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
		} catch (IOException ioe) {
			ioe.printStackTrace();
			this.forceDisconnect();
		}
	}

	/*package*/ void forceDisconnect() {
		try {
			socket.close();
		} catch (IOException ignored) {}
	}

	/*package*/ String waitForNextMessage() throws IOException {
		return in.readLine();
	}

	/*package*/ boolean isOpen() {
		return !socket.isClosed();
	}
}

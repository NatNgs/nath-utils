package natngs.utils.clt;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.*;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class Client {
	private final Map<String /*cmdCode*/, Map<String /*rule*/, IClientCmdReceiver>> receivers = new HashMap<>();
	private final Map<String /*CmdCode*/, String /*Rule*/> currentRights = new HashMap<>();

	private Socket socket = null;
	private BufferedReader in;
	private OutputStreamWriter out;
	private boolean isOpen = false;

	/**
	 * Connect the client to a server on specified port.
	 *
	 * @param address Server host
	 * @param port    Server port
	 * @throws IOException In case of problem to open the server socket
	 * @see Client#close
	 */
	public void open(String address, int port) throws IOException {
		this.isOpen = true;
		this.socket = new Socket(address, port);
		this.in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
		this.out = new OutputStreamWriter(socket.getOutputStream());
	}

	/**
	 * Close the connection to the server
	 *
	 * @see Client#open
	 */
	public void close() {
		this.isOpen = false;
		try {
			socket.close();
		} catch (IOException ignored) {
		}
		try {
			in.close();
		} catch (IOException ignored) {
		}
		try {
			out.close();
		} catch (IOException ignored) {
		}
		socket = null;
		in = null;
		out = null;
	}

	/**
	 * @param cmdCode  code of the command that starts every REST message calling to it
	 * @param rule     identifier of the receiver to call, to differentiate receivers using the same cmdCode
	 * @param receiver the receiver to be called when the command REST is received and rule is applied
	 * @return receiver that was corresponding to cmdCode and rule before the change (null if it is a new cmdCode/rule)
	 * @see Client#unsetReceiver(String)
	 * @see Client#unsetReceiver(String, String)
	 */
	public IClientCmdReceiver registerReceiver(String cmdCode, String rule, IClientCmdReceiver receiver) {
		if (!receivers.containsKey(cmdCode)) {
			receivers.put(cmdCode, new HashMap<>());
		}
		return this.receivers.get(cmdCode).put(rule, receiver);
	}

	/**
	 * @param cmdCode Command of the register to unset (all corresponding rules will be unset)
	 * @see Client#unsetReceiver(String, String)
	 * @see Client#registerReceiver
	 */
	public void unsetReceiver(String cmdCode) {
		this.receivers.remove(cmdCode);
	}

	/**
	 * @param cmdCode Command of the register to unset
	 * @param rule    identifier of the receiver to unset
	 * @see Client#unsetReceiver(String)
	 * @see Client#registerReceiver
	 */
	public void unsetReceiver(String cmdCode, String rule) {
		this.receivers.get(cmdCode).remove(rule);
		if (this.receivers.get(cmdCode).isEmpty()) {
			this.receivers.remove(cmdCode);
		}
	}


	/**
	 * @param cmdCode Command that change of rule
	 * @param newRule new rule to follow, 'null' to remove the right
	 * @return last active rule
	 */
	public String setActiveRule(String cmdCode, String newRule) {
		if (newRule == null) {
			return this.currentRights.remove(cmdCode);
		}
		return this.currentRights.put(cmdCode, newRule);
	}

	/**
	 * Get server local address
	 *
	 * @param preferIpv4 'true' to force return IPV4 address
	 * @return - String like: '[123.45.67.89]:4224'
	 * (or ipv6: '[1fff:0:a88:85a3::ac1f]:8001')
	 * - String without port if not connected like '[123.45.67.89]'
	 * - 'null' if failed to find.
	 */
	public String getLocalAddress(boolean preferIpv4) {
		try {
			Enumeration en = NetworkInterface.getNetworkInterfaces();
			while (en.hasMoreElements()) {
				NetworkInterface i = (NetworkInterface)en.nextElement();
				for (Enumeration en2 = i.getInetAddresses(); en2.hasMoreElements(); ) {
					InetAddress addr = (InetAddress)en2.nextElement();
					if (!preferIpv4 || addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
						if (isOpen) {
							return "[" + addr.getHostAddress() + "]:" + socket.getLocalPort();
						} else {
							return "[" + addr.getHostAddress() + "]";
						}
					}
				}
			}
		} catch (SocketException ignored) {
		}
		return null;
	}

	/**
	 * Send a message to the server
	 */
	/*package*/ void sendCmd(String cmdCode, String params) {
		try {
			out.write(cmdCode + ' ' + params);
			out.flush();
		} catch (IOException ignored) {
		}
	}

	private void receiveCmd(String fullReceivedMessage) {
		int sep = fullReceivedMessage.indexOf(' ');
		if (sep < 0) {
			sep = fullReceivedMessage.length() - 1;
		}

		String params = fullReceivedMessage.substring(sep);
		String cmdCode = fullReceivedMessage.substring(0, sep - 1);

		this.receivers.get(cmdCode).get(this.currentRights.get(cmdCode)).receive(params);
	}
}

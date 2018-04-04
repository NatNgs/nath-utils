package natngs.utils.srv;

import java.io.IOException;
import java.net.*;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class Server {
	private final Map<String /*client identifier*/, SrvClientSocket> clients = new HashMap<>();
	private final Map<String /*cmdCode*/, Map<String /*rule*/, IServerCmdReceiver>> receivers = new HashMap<>();

	private ServerSocket socket = null;
	private int maxAllowedClients = 0;
	private boolean isOpen = false;
	private Thread acceptingClientsThread = null;

	/**
	 * Open the server on specified port.
	 * Starting to accept clients if maxAllowedClients was set to a positive number.
	 *
	 * @param port if negative, will be randomized
	 * @throws IOException In case of problem to open the server socket
	 * @see Server#close
	 * @see Server#setMaxAllowedClients
	 */
	public void open(int port) throws IOException {
		this.isOpen = true;
		try {
			this.socket = new ServerSocket(port);
		} catch (IllegalArgumentException iae) {
			this.socket = new ServerSocket();
		}
		acceptingNewClients();
	}

	/**
	 * Close the server and disconnect all active client connections.
	 *
	 * @see Server#open
	 */
	public void close() {
		try {
			this.isOpen = false;
			for (SrvClientSocket client : clients.values()) {
				client.forceDisconnect();
			}
			socket.close();
			clients.clear();
		} catch (IOException ignored) {
		}
	}

	/**
	 * @param cmdCode  code of the command that starts every REST message calling to it
	 * @param rule     identifier of the receiver to call, to differentiate receivers using the same cmdCode
	 * @param receiver the receiver to be called when the command REST is received and rule is applied
	 * @return receiver that was corresponding to cmdCode and rule before the change (null if it is a new cmdCode/rule)
	 * @see Server#unsetReceiver(String)
	 * @see Server#unsetReceiver(String, String)
	 */
	public IServerCmdReceiver registerReceiver(String cmdCode, String rule, IServerCmdReceiver receiver) {
		if (!receivers.containsKey(cmdCode)) {
			receivers.put(cmdCode, new HashMap<>());
		}
		return this.receivers.get(cmdCode).put(rule, receiver);
	}

	/**
	 * @param cmdCode Command of the register to unset (all corresponding rules will be unset)
	 * @see Server#unsetReceiver(String, String)
	 * @see Server#registerReceiver
	 */
	public void unsetReceiver(String cmdCode) {
		this.receivers.remove(cmdCode);
	}

	/**
	 * @param cmdCode Command of the register to unset
	 * @param rule    identifier of the receiver to unset
	 * @see Server#unsetReceiver(String)
	 * @see Server#registerReceiver
	 */
	public void unsetReceiver(String cmdCode, String rule) {
		this.receivers.get(cmdCode).remove(rule);
		if (this.receivers.get(cmdCode).isEmpty()) {
			this.receivers.remove(cmdCode);
		}
	}


	/**
	 * @param maxAllowedClients total number of clients allowed. '-1' to stop accepting clients
	 * @return last value
	 */
	public int setMaxAllowedClients(int maxAllowedClients) {
		int tmp = this.maxAllowedClients;
		this.maxAllowedClients = maxAllowedClients;
		acceptingNewClients();
		return tmp;
	}

	/**
	 * @param clientIdentifier Client that changed of rule
	 * @param cmdCode          Command that change of rule
	 * @param newRule          new rule to follow
	 * @return last active rule
	 */
	public String setActiveRule(String clientIdentifier, String cmdCode, String newRule) {
		return this.clients.get(clientIdentifier).setRule(cmdCode, newRule);
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
	 * Send a message to one or multiple clients
	 */
	/*package*/ void sendCmd(String cmdCode, String params, String[] clients) {
		for (String clientIdentifier : clients) {
			this.clients.get(clientIdentifier).send(cmdCode, params);
		}
	}

	/**
	 * Send a message to all connected clients
	 */
	/*package*/ void sendCmdBroadcast(String cmdCode, String params) {
		for (SrvClientSocket client : this.clients.values()) {
			client.send(cmdCode, params);
		}
	}

	private void onClientConnected(final SrvClientSocket client) {
		final String clientIdentifier = client.getIdentifier();
		new Thread(()->{
			this.clients.put(clientIdentifier, client);
			try {
				do {
					receiveCmd(clientIdentifier, client.waitForNextMessage());
				} while (client.isOpen());
			} catch (IOException ioe) {
				// On client disconnected
				this.clients.remove(clientIdentifier);
				acceptingNewClients();
			}
		}).start();
	}

	private void acceptingNewClients() {
		if (!this.isOpen || clients.size() >= this.maxAllowedClients || this.acceptingClientsThread != null) {
			return; // already running or will not run because of condition
		}

		this.acceptingClientsThread = new Thread(()->{
			try {
				while (this.isOpen && clients.size() < this.maxAllowedClients) {
					onClientConnected(new SrvClientSocket(this.socket.accept()));
				}
			} catch (IOException ignored) {
			}
			this.acceptingClientsThread = null;
		});
		acceptingClientsThread.start();
	}

	private void receiveCmd(String clientIdentifier, String fullReceivedMessage) {
		int sep = fullReceivedMessage.indexOf(' ');
		if (sep < 0) {
			sep = fullReceivedMessage.length() - 1;
		}

		String params = fullReceivedMessage.substring(sep);
		String cmdCode = fullReceivedMessage.substring(0, sep - 1);

		String currPhase = this.clients.get(clientIdentifier).getRule(cmdCode);
		this.receivers.get(cmdCode).get(currPhase).receive(clientIdentifier, params);
	}
}

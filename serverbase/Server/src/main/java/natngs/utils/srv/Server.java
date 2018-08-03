package natngs.utils.srv;

import java.io.IOException;
import java.net.*;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

public class Server {
	private final Map<String /*client identifier*/, SrvClientSocket> clients = new HashMap<>();
	private final Map<String /*cmdCode*/, Map<String /*phase*/, IServerCmdReceiver>> receivers = new HashMap<>();

	public static boolean debugMode = false;

	private ServerSocket socket = null;
	private int maxAllowedClients = 0;
	private boolean isOpen = false;
	private Thread acceptingClientsThread = null;
	private String defaultPhase = "";

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
		} catch (IOException ignored) {}
	}

	/**
	 * @param cmdCode  code of the command that starts every REST message calling to it
	 * @param phase    identifier of the receiver to call, to differentiate receivers using the same cmdCode
	 * @param receiver the receiver to be called when the command REST is received and phase is applied
	 * @return receiver that was corresponding to cmdCode and phase before the change (null if it is a new cmdCode/phase)
	 * @see Server#unsetReceiver(String)
	 * @see Server#unsetReceiver(String, String)
	 */
	public IServerCmdReceiver registerReceiver(String cmdCode, String phase, IServerCmdReceiver receiver) {
		if (!receivers.containsKey(cmdCode)) {
			receivers.put(cmdCode, new HashMap<>());
		}
		return this.receivers.get(cmdCode).put(phase, receiver);
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
	 * @param phase   identifier of the receiver to unset
	 * @see Server#unsetReceiver(String)
	 * @see Server#registerReceiver
	 */
	public void unsetReceiver(String cmdCode, String phase) {
		this.receivers.get(cmdCode).remove(phase);
		if (this.receivers.get(cmdCode).isEmpty()) {
			this.receivers.remove(cmdCode);
		}
	}

	public void setDefaultPhase(String newDefaultPhase) {
		this.defaultPhase = newDefaultPhase;
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
	 * @param clientsIdentifier Client(s) that changed of phase
	 * @param newPhase          new phase of the client
	 */
	public void setActivePhase(String newPhase, String... clientsIdentifier) {
		print(false, "Clients " + Arrays.toString(clientsIdentifier) + " are now in phase "+newPhase);
		for(String clientIdentifier : clientsIdentifier) {
			this.clients.get(clientIdentifier).phase = newPhase;
		}
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
		System.out.println("Sent to "+ Arrays.toString(clients) +": " + cmdCode + (params != null ? ' ' + params : ""));
		for (String clientIdentifier : clients) {
			this.clients.get(clientIdentifier).send(cmdCode, params);
		}
	}

	/**
	 * Send a message to all connected clients
	 */
	/*package*/ void sendCmdBroadcast(String cmdCode, String params) {
		System.out.println("Sent to all clients: " + cmdCode + (params != null ? ' ' + params : ""));
		for (SrvClientSocket client : this.clients.values()) {
			client.send(cmdCode, params);
		}
	}


	private void onClientConnected(final SrvClientSocket client) {
		final String clientIdentifier = client.getIdentifier();
		new Thread(()->{
			print(false, "Client connected: " + clientIdentifier+", starting in phase "+defaultPhase);
			this.clients.put(clientIdentifier, client);
			try {
				do {
					receiveCmd(clientIdentifier, client.waitForNextMessage());
				} while (client.isOpen());
			} catch (IOException ioe) {
				// On client disconnected
				this.clients.remove(clientIdentifier);
				print(false, "Client disconnected: "+clientIdentifier);
				acceptingNewClients();
			}
		}).start();
	}

	private void acceptingNewClients() {
		if (!this.isOpen || clients.size() >= this.maxAllowedClients || this.acceptingClientsThread != null) {
			return; // already running or will not run because of condition
		}

		this.acceptingClientsThread = new Thread(()->{
			print(false, "Accepting new clients");
			try {
				while (this.isOpen && clients.size() < this.maxAllowedClients) {
					onClientConnected(new SrvClientSocket(this.socket.accept(), defaultPhase));
				}
			} catch (IOException ignored) {
			}
			this.acceptingClientsThread = null;
			print(false, "Not accepting new clients");
		});
		acceptingClientsThread.start();
	}

	private void receiveCmd(String clientIdentifier, String fullReceivedMessage) {
		System.err.println("SRV RECEIVED: "+clientIdentifier+": "+fullReceivedMessage);

		int sep = fullReceivedMessage.indexOf(' ');
		if (sep < 0) {
			sep = fullReceivedMessage.length();
		}

		String params = fullReceivedMessage.substring(sep);
		String cmdCode = fullReceivedMessage.substring(0, sep);

		SrvClientSocket client = this.clients.get(clientIdentifier);

		Map<String, IServerCmdReceiver> cmds = this.receivers.get(cmdCode);
		if(cmds == null) {
			print(false, "CMD "+cmdCode+" unknown from server");
			return;
		}

		IServerCmdReceiver cmdReceiver = cmds.get(client.phase);
		if(cmdReceiver == null) {
			print(true,
					"Client's phase "+client.phase+" does not allow to use command "+cmdCode+
					(cmds.size()==0
						?" (never allowed)"
						:" (allowed for"+String.join(", ", cmds.keySet())+")")
			);
			return;
		}

		cmdReceiver.receive(clientIdentifier, params);
	}

	private static void print(boolean isError, Object text) {
		if(!debugMode) {
			return;
		}
		if(isError) {
			System.err.println("[SERVER] "+text.toString());
		} else {
			System.out.println("[SERVER] "+text.toString());
		}
	}
}

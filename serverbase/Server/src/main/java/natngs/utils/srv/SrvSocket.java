package natngs.utils.srv;

/*package*/ class SrvSocket {
	private static final String DEFAULT_PHASE = "";

	private final Map<String /*client identifier*/, Socket> clients = new HashMap<>();
	private final Map<String /*client identifier*/, String /* current phase */> phases = new HashMap<>();
	private final Map<String /*cmdCode*/, Map<String /*phase*/, IServerCmdReceiver>> receivers = new HashMap<>();
	
	private String initialPhase = null;
	private int maxAllowedClients = 1024;
	
	/* registerReceiver(phase, cmdCode, receiver) > activate a receiver
	 * registerReceiver(phase, cmdCode, null) > disable receiver (will block default receiver)
	 * registerReceiver(null/"", cmdCode, receiver) > activate a default receiver (working for all phases)
	 * registerReceiver(null/"", cmdCode, null) > disable default receiver
	 */
	/*package*/ void registerReceiver(String phase, String cmdCode, IServerCmdReceiver receiver) {
		if(!receivers.has(cmdCode)) {
			receivers.put(cmdCode, new HashMap<>())
		}
		if(phase==null) {
			phase = DEFAULT_PHASE;
		}
		return this.receivers.get(cmdCode).put(phase, receiver);
	}
	
	/* unsetReceiver(phase, cmdCode) > unset specific a receiver (if it was null, unset default receiver blocking)
	 * unsetReceiver(null/"", cmdCode) > disable default receiver
	 */
	/*package*/ IServerCmdReceiver unsetReceiver(String phase, String cmdCode) {
		if(phase==null) {
			phase = DEFAULT_PHASE;
		}
		return this.receivers.get(cmdCode).remove(phase);
	}
	
	/*package*/ void open() {
		this.isOpen = true;
		// TODO
	}
	
	/*package*/ void close() {
		this.isOpen = false;
		// TODO
	}
	
	/*package*/ void acceptintNewClients() {
		while(this.isOpen && clients.size() < this.maxAllowedClients) {
			// TODO
		}
	}
	
	/*package*/ void onClientConnected(Socket client) {
		Stirng clientIdentifier = /* TODO */;
		this.clients.put(clientIdentifier, client);
		this.phases.put(clientIdentifier, this.initialPhase);
		try {
			do {
				// TODO get next message
				receiveCmd(clientIdentifier, /* TODO */);
			} while(true);
		} catch(IOException ioe) {
			// On client disconnected
			this.clients.remove(clientIdentifier);
			this.phases.remove(clientIdentifier);
		}
	}
	
	/*package*/ void receiveCmd(String clientIdentifier, String fullReceivedMessage) {
		String cmdCode = /* TODO */;
		List<String> params = /* TODO */;
		
		Map<String/*phase*/, IServerCmdReceiver> receivers = receivers.get(cmdCode)
		String currPhase = this.phases.get(clientIdentifier);
		IServerCmdReceiver receiver = receivers.has(currPhase)
			? receivers.get(currPhase)
			: receivers.get(DEFAULT_PHASE);
		
		receiver.receive(clientIdentifier, params);
	}
	
	/*package*/ void sendCmd(String fullMessageToSend, String... clients) {
		for(String clientIdentifier : clients) {
			sendCmd(this.clients.get(clientIdentifier), fullMessageToSend);
		}
	}
	
	/*package*/ void sendCmdBroadcast(String fullMessageToSend) {
		for(Socket client : this.clients.values()) {
			sendCmd(client, fullMessageToSend);
		}
	}
	
	private void sendCmd(Socket client, String fullMessageToSend) {
		// TODO
	}
	
	/*package*/ void setMaxAllowedClients(int maxAllowedClients) {
		this.maxAllowedClients = maxAllowedClients;
	}
	
	/*package*/ String setPhase(String clientIdentifier, String newPhase) {
		this.phase.put(clientIdentifier, newPhase);
	}
}

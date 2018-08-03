package natngs.integ.srvclt.srv;

import natngs.utils.srv.Server;

import java.io.IOException;
import java.util.Scanner;

public class SrvController {
	private Server s;

	private SrvController() throws IOException {
		Server.debugMode = true;

		s = new Server();
		s.registerReceiver("PING", "A", new SrvPingReceiver(s));
		s.registerReceiver("PONG", "A", new SrvPongReceiver());

		System.out.println(s.getLocalAddress(true));
		System.out.println(s.getLocalAddress(false));

		s.setDefaultPhase("A");
		s.open(4224);
		s.setMaxAllowedClients(1);

		System.out.println(s.getLocalAddress(true));
		System.out.println(s.getLocalAddress(false));

		Scanner sc = new Scanner(System.in);
		System.out.println("To send a ping, click Enter...");
		sc.nextLine();

		SrvPingEmitter pinger = new SrvPingEmitter(s);
		pinger.sendPing();

		System.out.println("To close, click enter...");
		sc.nextLine();
		s.close();
	}

	public static void main(String[] args) throws IOException {
		new SrvController();
	}
}

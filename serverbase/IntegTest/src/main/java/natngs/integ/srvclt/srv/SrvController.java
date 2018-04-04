package natngs.integ.srvclt.srv;

import natngs.utils.srv.Server;

import java.io.IOException;
import java.util.Scanner;

public class SrvController {
	private Server s;

	private SrvController() throws IOException {
		s = new Server();
		s.registerReceiver("PING", "A", new SrvPingReceiver());
		s.registerReceiver("PONG", "A", new SrvPongReceiver());

		System.out.println(s.getLocalAddress(true));
		System.out.println(s.getLocalAddress(false));

		s.open(4224);

		System.out.println(s.getLocalAddress(true));
		System.out.println(s.getLocalAddress(false));

		Scanner sc = new Scanner(System.in);
		sc.nextLine();

		SrvPingEmitter pinger = new SrvPingEmitter(s);
		pinger.sendPing();

		sc.nextLine();
	}

	public static void main(String[] args) throws IOException {
		new SrvController();
	}
}

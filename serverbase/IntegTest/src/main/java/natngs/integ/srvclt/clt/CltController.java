package natngs.integ.srvclt.clt;

import natngs.utils.clt.Client;

import java.io.IOException;
import java.util.Scanner;

public class CltController {
	private Client c;

	private CltController() throws IOException {
		c = new Client();
		c.registerReceiver("PING", "A", new CltPingReceiver(c));
		c.registerReceiver("PONG", "A", new CltPongReceiver());

		System.out.println(c.getLocalAddress(true));
		System.out.println(c.getLocalAddress(false));

		c.setActivePhase("A");
		c.open("127.0.0.1", 4224);

		System.out.println(c.getLocalAddress(true));
		System.out.println(c.getLocalAddress(false));

		Scanner sc = new Scanner(System.in);
		System.out.println("To send a ping, click Enter...");
		sc.nextLine();

		CltPingEmitter pinger = new CltPingEmitter(c);
		pinger.sendPing();

		System.out.println("To close, click Enter...");
		sc.nextLine();
	}


	public static void main(String[] args) throws IOException {
		new CltController();
	}
}

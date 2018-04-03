# TODO

## Package Server

- AServerCmdReceiver
- SrvClientSocket (have 0-* AServerCmdReceiver)
- ServerSocket (have 0-* SrvClientSocket)
- AServerController (have 1 ServerSocket)
- AServerCmdSender (have 1 AServerController)

### Demo

- DemoController ext. AServerController (+ main)
- PingReceiver ext. AServerCmdReceiver
- PongReceiver ext. AServerCmdReceiver
- PingSender ext. AServerCmdSender
- PongSender ext. AServerCmdSender

## Package Client

- AClientCmdReceiver
- ClientSocket (have 0-* AClientCmdReceiver)
- AClientController (have 1 ClientSocket)
- AClientCmdSender (have 1 AClientController)

### Demo

- DemoController ext. AClientController (+ main)
- PingReceiver ext. AClientCmdReceiver
- PongReceiver ext. AClientCmdReceiver
- PingSender ext. AClientCmdSender
- PongSender ext. AClientCmdSender

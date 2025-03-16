import { Socket } from "socket.io";
import { ObservableEvent } from "../observables/event";

export class AccountSockets {
  private connection_sockets: { [socket_id: string]: Socket } = {};
  public readonly OnAllSocketsDisconnect = new ObservableEvent<void>();
  public readonly OnSocketDisconnect = new ObservableEvent<void>();

  public AddSockets(socket: Socket) {
    this.connection_sockets[socket.id] = socket;
  }

  public RemoveSocket(socket: Socket) {
    delete this.connection_sockets[socket.id];

    this.OnSocketDisconnect.Raise();

    if (Object.keys(this.connection_sockets).length > 0) return;

    this.OnAllSocketsDisconnect.Raise();
  }
}

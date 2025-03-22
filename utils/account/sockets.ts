import { Server, Socket } from "socket.io";
import { ObservableEvent } from "../observables/event";

export class AccountSockets {
  private connection_sockets: { [socket_id: string]: Socket } = {};
  public readonly OnAllSocketsDisconnect = new ObservableEvent<void>();
  public readonly OnSocketDisconnect = new ObservableEvent<void>();
  public readonly OnSocketAdded = new ObservableEvent<Socket>();

  public readonly io: Server;
  private session_id: string;

  constructor(io: Server,account_id: string) {
    this.io = io;
    this.session_id = `session_${account_id}`;
  }

  public AddSockets(socket: Socket) {
    this.connection_sockets[socket.id] = socket;
    socket.join(this.session_id);
    this.OnSocketAdded.Raise(socket);
  }
  
  public RemoveSocket(socket: Socket) {
    socket.leave(this.session_id);
    delete this.connection_sockets[socket.id];
    this.OnSocketDisconnect.Raise();
    
    if (Object.keys(this.connection_sockets).length > 0) return;
    
    this.OnAllSocketsDisconnect.Raise();
  }

  public get Session() {
    return this.io.to(this.session_id);
  }

  public get SessionRoomID() {
    return this.session_id;
  }
  
}

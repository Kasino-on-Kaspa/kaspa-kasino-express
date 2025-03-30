import { Server, Socket } from "socket.io";
import { EventsMap, DefaultEventsMap } from "socket.io/dist/typed-events";
import { Express, Router, RouterOptions } from "express";
export abstract class Service<
  TClientToServerEvents extends EventsMap = DefaultEventsMap,
  TServerToClientEvents extends EventsMap = DefaultEventsMap
> {

  protected readonly server: Server;
  protected readonly router: Router;

  constructor(io: Server, express: Express) {
    this.server = io;
    this.router = Router();
    this.HandleInitialize();
    this.InitializeRoutes();
    this.HandleInitializeRoutes(express);
  }

  private HandleInitialize() {
    this.server.on("connection", (socket) => {  
      this.Handler(socket);
    });
  }

  public InitializeRoutes() {}

  private HandleInitializeRoutes(express: Express) {
    express.use(this.router);
  }

  public Handler(socket: Socket): void {}
}

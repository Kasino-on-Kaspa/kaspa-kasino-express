import { AccountStoreInstance } from "@/index";
import { Namespace, Server, Socket } from "socket.io";
import { EventsMap, DefaultEventsMap } from "socket.io/dist/typed-events";
import { z, ZodObject, ZodRawShape, ZodSchema } from "zod";

export abstract class Service<
  TClientToServerEvents extends EventsMap = DefaultEventsMap,
  TServerToClientEvents extends EventsMap = DefaultEventsMap
> {

  protected readonly server: Server;

  constructor(io: Server) {
    this.server = io;
    this.HandleInitialize();
  }

  private HandleInitialize() {
    this.server.on("connection", (socket) => {
      console.log(socket.client)  
      this.Handler(socket);
    });
  }

  public Handler(socket: Socket): void {}
}

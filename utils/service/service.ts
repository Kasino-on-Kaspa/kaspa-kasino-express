import { Server, Socket } from "socket.io";
import { z, ZodObject, ZodRawShape, ZodSchema } from "zod";

export abstract class Service {
  protected abstract serviceName: string;

  public get ServiceName() {
    return this.serviceName;
  }

  public Handler(io: Server, socket: Socket): void {}
  
}

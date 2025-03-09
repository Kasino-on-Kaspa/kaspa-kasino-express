import { Server, Socket } from "socket.io";
import { z, ZodObject, ZodRawShape, ZodSchema } from "zod";

export abstract class Service {
  protected abstract serviceName: string;

  public get ServiceName() {
    return this.serviceName;
  }

  protected ParseParams<T extends ZodRawShape>(bet_data:any, BetType : ZodObject<T> ,socket:Socket) {
    let parsed_data = BetType.safeParse(bet_data);

    return parsed_data
    
  }

  

  public Handler(io: Server, socket: Socket): void {}
  
}

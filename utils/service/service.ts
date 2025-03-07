import { Server, Socket } from "socket.io";
import { z, ZodObject, ZodRawShape, ZodSchema } from "zod";

export abstract class Service {
  protected abstract serviceName: string;

  public get ServiceName() {
    return this.serviceName;
  }

  protected ParseParams<T extends ZodRawShape>(bet_data:any, BetType : ZodObject<T> ,socket:Socket) : z.infer<ZodObject<T>> | undefined{
    let parsed_data = BetType.safeParse(bet_data);
    if (!parsed_data.success){
      socket.emit("error:parse", {message: `Failed to parse arguments`, error: parsed_data.error.issues })
      return
    }
    
    return parsed_data.data
    
  }

  

  public Handler(io: Server, socket: Socket): void {}
  
}

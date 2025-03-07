import { Server, Socket } from "socket.io";
import { Service } from "./service";

 export class ServiceRegistry {

  private services: Service[] = [];


  public RegisterService(service: Service) {
    this.services.push(service);
  }

  
  public OnNewConnection(io: Server, socket: Socket) {
    for (let service of this.services) {
      service.Handler(io, socket);
    }
  }
}


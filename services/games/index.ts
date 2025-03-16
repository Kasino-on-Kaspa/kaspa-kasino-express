import { ServiceRegistry } from "../../utils/service/handler-registry";

const GameServices: any[] = [];

export function InitializeGameServices(registry: ServiceRegistry) {
  for (let game of GameServices) {
    registry.RegisterService(game);
  }
}

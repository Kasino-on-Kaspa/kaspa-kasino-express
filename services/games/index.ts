import { ServiceRegistry } from "../../utils/service/handler-registry";
import { CoinflipServiceInstance } from "./coinflip/coinflip.service";
import { DieRollServiceInstance } from "./dieroll/dieroll.service";

const GameServices = [CoinflipServiceInstance, DieRollServiceInstance];

export function InitializeGameServices(registry: ServiceRegistry) {
  for (let game of GameServices) {
    registry.RegisterService(game);
  }
}

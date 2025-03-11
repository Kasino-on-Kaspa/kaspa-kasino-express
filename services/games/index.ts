import { readdirSync } from "node:fs";
import { ServiceRegistry } from "../../utils/service/handler-registry";
import path from "node:path";
import { DieRollServiceInstance } from "./dieroll/service";

const GameServices = [DieRollServiceInstance]

export function InitializeGameServices(registry: ServiceRegistry) {
  for (let game of GameServices) {
    registry.RegisterService(game)
  }
}

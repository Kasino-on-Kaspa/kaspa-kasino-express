import { readdirSync } from "node:fs";
import { ServiceRegistry } from "../../utils/service/handler-registry";
import path from "node:path";

export function InitializeGameServices(registry: ServiceRegistry) {
  for (let x of readdirSync(__dirname)) {
    if (x.endsWith(".js")||x.endsWith(".ts")) continue;
    let { Initialize } = require(path.join(__dirname, x, "service.js"));
    Initialize(registry)
  }
}

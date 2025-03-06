import { ListenerService } from "../utils/service/listeners";

const SERVICES: ListenerService[] = [];

export async function InitializeHandlers() {
	for (let service of SERVICES) {
		console.log(`Initializing ${service.listenerName} service`);
		service.Instantiate();
	}
}

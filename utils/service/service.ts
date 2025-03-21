import { Namespace, Server, Socket } from "socket.io";
import { EventsMap, DefaultEventsMap } from "socket.io/dist/typed-events";
import { z, ZodObject, ZodRawShape, ZodSchema } from "zod";

export abstract class Service<
	TClientToServerEvents extends EventsMap = DefaultEventsMap,
	TServerToClientEvents extends EventsMap = DefaultEventsMap
> {
	protected readonly namespace: Namespace<
		TClientToServerEvents,
		TServerToClientEvents
	>;
	protected readonly server: Server;

	constructor(io: Server, namespace: string) {
		this.server = io;
		this.namespace = io.of(`/${namespace}`);
	}

	private HandleInitialize() {
		this.namespace.on("connection", () => {});
	}

	public Handler(socket: Socket): void {}
}

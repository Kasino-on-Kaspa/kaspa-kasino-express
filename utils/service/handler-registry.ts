import {
	TSocketMessageListener,
	TSocketMessageListenerParams,
} from "../../typings";

export class HandlerRegistry {
	private static _instance: HandlerRegistry;

	private listeners: { [key: string]: TSocketMessageListener } = {};

	public static get Instance() {
		if (!this._instance) {
			this._instance = new this();
		}
		return this._instance;
	}

	public OnNewConnection(
		io: TSocketMessageListenerParams["io"],
		socket: TSocketMessageListenerParams["socket"]
	) {
		Object.entries(this.listeners).forEach(([on_message, handler]) => {
			socket.on(on_message, (...args) => handler(io, socket, args));
		});
	}

	public RegisterAction({
		on_message,
		caller,
	}: {
		on_message: string;
		caller: any;
	}) {
		this.listeners[on_message] = caller;
	}
}

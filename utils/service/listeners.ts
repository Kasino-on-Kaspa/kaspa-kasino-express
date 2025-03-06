import { TSocketMessageListener } from "../../typings";
import { HandlerRegistry } from "./handler-registry";

type TProcessRegister = {
	on_message: string;
	key: string;
};

export abstract class ListenerService {
	public abstract listenerName: string;

	protected static p_handlers: Map<
		typeof ListenerService,
		TProcessRegister[]
	> = new Map();

	public static Handler(
		action: Omit<TProcessRegister, "chain" | "caller" | "key">
	) {
		return function (target: ListenerService, key: string, _descriminator: TypedPropertyDescriptor<TSocketMessageListener>) {

			const constructor = target.constructor as typeof ListenerService;
			if (!ListenerService.p_handlers.has(constructor))
				ListenerService.p_handlers.set(constructor, []);

			ListenerService.p_handlers
				.get(constructor)!
				.push({ ...action, key });
		};
	}

	public Instantiate() {
		let actions = ListenerService.p_handlers.get(
			this.constructor as typeof ListenerService
		);
		if (!actions) return;

		for (let action of actions) {
			let caller = this[action.key as keyof this];
			if (typeof caller !== "function") continue;

			HandlerRegistry.Instance.RegisterAction({
				on_message: action.on_message,
				caller: caller.bind(this),
			});
		}
	}
}

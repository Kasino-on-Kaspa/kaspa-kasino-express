import { ObservableEvent } from "./event";

type ObservableListener<T> = (new_data: T) => Promise<void>;

export class ObservableData<T> {
	private _data: T;

	private onUpdateEvent: ObservableEvent<T> = new ObservableEvent();

	constructor(data: T) {
		this._data = data;
	}

	public AddListener(listener: ObservableListener<T>, once?: boolean) {
		return this.onUpdateEvent.RegisterEventListener(listener, once);
	}

	public RemoveListener(index: number) {
		return this.onUpdateEvent.UnRegisterEventListener(index);
	}

	public SetData(data: T) {
		this._data = data;
		this.onUpdateEvent.Raise(data);
	}

	public GetData() {
		return this._data;
	}
}

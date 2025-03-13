type ObservableListener<T> = (new_data: T) => Promise<void>;

export class ObservableData<T> {
	private _data: T;
	private listeners: ObservableListener<T>[] = [];

	constructor(data: T) {
		this._data = data;
	}

	public AddListener(listener: ObservableListener<T>) {
		return this.listeners.push(listener) - 1;
	}

	public RemoveListener(index: number) {
		this.listeners.splice(index, 1);
	}

	public SetData(data: T) {
		this._data = data;
		this.OnDataChange();
	}

	public OnDataChange() {
		this.listeners.forEach((val) => {
			val(this._data);
		});
	}

	public GetData() {
		return this._data;
	}
}

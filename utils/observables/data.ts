import { ObservableEvent } from "./event";

export class ObservableData<T> {
  private _data: T;
  
  private onUpdateEvent: ObservableEvent<T> = new ObservableEvent();

  constructor(data: T) {
    this._data = data;
  }

  public AddListener = this.onUpdateEvent.RegisterEventListener;

  public RemoveListener = this.onUpdateEvent.UnRegisterEventListener;

  public SetData(data: T) {
    this._data = data;
    this.onUpdateEvent.Raise(data);
  }


  public GetData() {
    return this._data;
  }
}

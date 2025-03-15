type ObservableListener<T> = (new_data: T) => Promise<void>;

export class ObservableEvent<TData> {
  private listeners: { listener: ObservableListener<TData>; once: boolean }[] =
    [];

  public RegisterEventListener(
    listener: ObservableListener<TData>,
    once = false
  ) {
    return this.listeners.push({ listener, once }) - 1;
  }

  public UnRegisterEventListener(index: number) {
    this.listeners.splice(index, 1);
  }

  public Raise(data: TData) {
    this.listeners.forEach((val, index) => {
      val.listener(data);
      if (val.once) this.UnRegisterEventListener(index);
    });
  }
}

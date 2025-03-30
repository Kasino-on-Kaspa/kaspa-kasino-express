import { EventEmitter } from "events";

export class EventBus extends EventEmitter {
    private static instance: EventBus;
    
    public static get Instance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
}
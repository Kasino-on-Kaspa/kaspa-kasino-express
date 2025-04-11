export enum CoinflipSessionGameState {
    START = "START",
    CHOICE = "CHOICE",
    FLIP = "FLIP",
    SETTLE = "SETTLE",
    NEXT = "NEXT",
    
    CASHOUT = "CASHOUT",

    END = "END",
    TIMEOUT = "TIMEOUT"
}

export * from "./start.state";
export * from "./choice.state";
export * from "./flip.state";
export * from "./settle.state";
export * from "./cashout.state";
export * from "./end.state";    
export * from "./timeout.state";
export * from "./next.state";
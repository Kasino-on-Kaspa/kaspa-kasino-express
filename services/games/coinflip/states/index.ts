export enum CoinflipSessionGameState {
    START = "START",
    FLIP_CHOICE = "FLIP_CHOICE",
    FLIP = "FLIP",
    SETTLE = "SETTLE",
    NEXT_CHOICE = "NEXT_CHOICE",
    CASHOUT = "CASHOUT",
    END = "END",
    TIMEOUT = "TIMEOUT"
}

export * from "./start.state";
export * from "./flip-choice.state";
export * from "./flip.state";
export * from "./settle.state";
export * from "./next-choice.state";
export * from "./cashout.state";
export * from "./end.state";    
export * from "./timeout.state";
export enum DieRollGameState {
  START = "START",
  ROLL = "ROLL",
  SETTLE = "SETTLE",
  END = "END",
}

export type TDieRollGameState = DieRollGameState;

export * from "./start.state";
export * from "./roll.state";
export * from "./settle.state";
export * from "./end.state";
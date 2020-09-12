export type CreepState =
  SpawningState |
  StoringState |
  HarvestingState |
  PickingUpState |
  UpgradingState |
  WithdrawingState |
  RefillingState |
  BuildingState |
  RepairingState |
  MovingState |
  IdleState;

export type SpawningState = "spawning-state"
export type MovingState = "moving-state"
export type StoringState = "storing-state"
export type HarvestingState = "harvesting-state"
export type PickingUpState = "picking-up-state"
export type WithdrawingState = "withdrawing-state"
export type RefillingState = "refilling-state"
export type BuildingState = "building-state"
export type RepairingState = "repairing-state"
export type UpgradingState = "upgrading-state"
export type IdleState = "idle-state"

export const SpawningState: SpawningState = "spawning-state"
export const MovingState: MovingState = "moving-state"
export const StoringState: StoringState = "storing-state"
export const HarvestingState: HarvestingState = "harvesting-state"
export const PickingUpState: PickingUpState = "picking-up-state"
export const WithdrawingState: WithdrawingState = "withdrawing-state"
export const RefillingState: RefillingState = "refilling-state"
export const BuildingState: BuildingState = "building-state"
export const RepairingState: RepairingState = "repairing-state"
export const UpgradingState: UpgradingState = "upgrading-state"
export const IdleState: IdleState = "idle-state"

export interface StateResolver {
  nextState?: CreepState,
  getNextState?: () => CreepState,
  replay?: (creep: Creep) => void,
  params?: Record<string, any>
}

export function resolve(stateResolver: StateResolver): CreepState {
  if (stateResolver.nextState) return stateResolver.nextState;
  if (stateResolver.getNextState) return stateResolver.getNextState();
  throw new Error('Unresolvable state');
}

export function replay(creep: Creep, stateResolver: StateResolver): void {
  if (stateResolver.replay) stateResolver.replay(creep);
}

export function resolveAndReplay(creep: Creep, stateResolver: StateResolver): void {
  creep.memory.state = resolve(stateResolver);
  creep.memory.param = stateResolver?.params;
  replay(creep, stateResolver);
}

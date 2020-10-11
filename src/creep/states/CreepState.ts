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

export type ReplayFunction = (creep: Creep) => void;

export interface StateResolver {
  nextState?: CreepState,
  getNextState?: () => CreepState,
  replay?: ReplayFunction
}

export function resolve(creep: Creep, stateResolver: StateResolver): CreepState {
  let nextState;
  if (stateResolver.nextState) nextState = stateResolver.nextState;
  if (stateResolver.getNextState) nextState = stateResolver.getNextState();
  if (!nextState) {
    throw new Error('Unresolvable state');
  }

  creep.memory.lastState = creep.memory.state;
  creep.memory.state = nextState;

  if (Memory.log.state === true) console.log(`[${Game.time}] creep[${creep.name}]: ${creep.memory.lastState} ==> ${creep.memory.state} | param ${JSON.stringify(creep.memory.move)}`);
  return nextState as CreepState;
}

export function replay(creep: Creep, stateResolver: StateResolver): void {
  if (stateResolver.replay) stateResolver.replay(creep);
}

export function resolveAndReplay(creep: Creep, stateResolver: StateResolver): void {
  resolve(creep, stateResolver);
  replay(creep, stateResolver);
}

export function resolveLastState(creep: Creep): void {
  if (Memory.log.state === true) console.log(`[${Game.time}] creep[${creep.name}]: ${creep.memory.lastState} <== ${creep.memory.state} | param ${JSON.stringify(creep.memory.move)}`);
  creep.memory.state = creep.memory.lastState;
}

export function resolveLastStateAndReplay(creep: Creep, stateResolver: StateResolver): void {
  resolveLastState(creep);
  replay(creep, stateResolver);
}

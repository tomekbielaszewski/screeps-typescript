import {
  BuildingState,
  CreepState,
  IdleState,
  MovingState,
  RefillingState,
  RepairingState,
  resolve,
  resolveAndReplay,
  resolveLastStateAndReplay,
  SpawningState,
  StateResolver
} from "../states/CreepState"
import {move, MovingResult, toTarget} from "../states/Moving"
import {refillCreep, RefillingResult} from "../states/RefillingCreep"
import {building, BuildingResult} from "../states/Building"
import {findLowHpStructures, repairing, RepairingResult} from "../states/Repairing"

export function BuilderJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }
  Memory.repair.fortifications = Memory.repair.fortifications === true

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob})
      break
    case RefillingState:
      runRefillingState(creep)
      break
    case MovingState:
      runMovingState(creep)
      break
    case BuildingState:
      runBuildingState(creep)
      break
    case RepairingState:
      runRepairingState(creep)
      break
    case IdleState:
      runIdleState(creep)
      break
  }
}

function runIdleState(creep: Creep) {
  const nextState = buildingOrRepairing(creep)();
  if (nextState !== IdleState) {
    resolve(creep, {nextState, replay: BuilderJob})
    return
  }
  creep.say('🚬')
  const idleFlag = Object.values(Game.flags)
    .filter(f => f.pos.roomName === creep.room.name)
    .find(f => f.name.toLowerCase() === 'idle')
  if (idleFlag) {
    if (creep.pos.getRangeTo(idleFlag.pos) > 3) {
      creep.memory.move = {
        range: 3,
        target: toTarget(idleFlag)
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: BuilderJob})
    }
  }
}

function runMovingState(creep: Creep) {
  const movingResult = move(creep)
  switch (movingResult) {
    case MovingResult.CouldNotMove: //do not advance to another state and see what happens
    case MovingResult.Moving: //do not advance to another state and keep moving
      break
    case MovingResult.NoPath: //something blocking the path? wait to next tick and run again. In future good to have some traffic control here
      creep.say('🗺️🤔')
      break
    case MovingResult.NoTargetPositionSet:
      resolveLastStateAndReplay(creep, {replay: BuilderJob})
      break
    case MovingResult.ReachedDestination:
      resolveLastStateAndReplay(creep, {replay: BuilderJob})
      break
    case MovingResult.Tired:
      creep.say('😩')
      break
  }
}

function runRepairingState(creep: Creep) {
  const repairingResult = repairing(creep, Memory.repair.fortifications)
  switch (repairingResult) {
    case RepairingResult.Working: //then keep working
    case RepairingResult.CouldNotRepair: //do not advance to another state and see what happens
      break
    case RepairingResult.NothingToRepair:
    case RepairingResult.StructureNoLongerExists:
      resolveAndReplay(creep, {nextState: IdleState, replay: BuilderJob})
      break
    case RepairingResult.StructureRepaired:
      resolve(creep, {nextState: IdleState})
      break
    case RepairingResult.CreepStoreEmpty:
      resolveAndReplay(creep, {nextState: RefillingState, replay: BuilderJob})
      break
    case RepairingResult.OutOfRange:
      creep.memory.move = {
        range: 3,
        target: toTarget(creep.memory.repair?.get())
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: BuilderJob})
      break
  }
}

function runRefillingState(creep: Creep) {
  const refillingResult = refillCreep(creep, true)
  switch (refillingResult) {
    case RefillingResult.CreepRefilled:
      resolve(creep, {getNextState: buildingOrRepairing(creep)})
      break
    case RefillingResult.CreepStoreFull:
      resolveAndReplay(creep, {getNextState: buildingOrRepairing(creep), replay: BuilderJob})
      break
    case RefillingResult.NoResourcesInStorage: //do not advance to another state
      creep.say('!💸')
      break
    case RefillingResult.CouldNotWithdraw: //do not advance to another state
      break
    case RefillingResult.OutOfRange:
      creep.memory.move = {
        target: toTarget(creep.memory.storage?.get())
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: BuilderJob})
      break
  }
}

function runBuildingState(creep: Creep) {
  const buildingSubState = building(creep)
  switch (buildingSubState) {
    case BuildingResult.Working: //then keep working
      break
    case BuildingResult.OutOfRange:
      creep.memory.move = {
        range: 3,
        target: toTarget(creep.memory.construction?.get())
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: BuilderJob})
      break
    case BuildingResult.ConstructionSiteNoLongerExist: //has CS been completed? Lets reply the current state
      resolveAndReplay(creep, {nextState: BuildingState, replay: BuilderJob})
      break
    case BuildingResult.NoConstructionSite: //nothing to build - try repairing stuff
      resolveAndReplay(creep, {nextState: RepairingState, replay: BuilderJob})
      break
    case BuildingResult.CreepStoreEmpty:
      resolveAndReplay(creep, {nextState: RefillingState, replay: BuilderJob})
      break
  }
}

function buildingOrRepairing(creep: Creep) {
  return function (): CreepState {
    const lowHpStructures = findLowHpStructures(creep.room, Memory.repair.fortifications)
    if (lowHpStructures.length) return RepairingState
    const constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES)
    if (constructionSites.length) return BuildingState
    return IdleState
  }
}

function initialize(creep: Creep, state: StateResolver): void {
  if (creep.spawning) return
  resolveAndReplay(creep, state)
}

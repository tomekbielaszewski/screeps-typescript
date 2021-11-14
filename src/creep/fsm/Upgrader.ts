import {
  HarvestingState,
  IdleState,
  MovingState,
  RefillingState,
  resolve,
  resolveAndReplay,
  resolveLastStateAndReplay,
  SpawningState,
  StateResolver,
  UpgradingState
} from "./runner/common/CreepState";
import {harvest, HarvestingResult} from "./runner/common/HarvestingEnergy";
import {move, MovingResult, toTarget} from "./runner/common/Moving";
import {upgradeController, UpgradeResult} from "./runner/common/UpgradingController";
import {refillCreep, RefillingResult} from "./runner/common/RefillingCreep";
import {NamedLogger} from "../../utils/Logger";
import {SerializableRoomObject} from "../../utils/Serializables";

export enum UpgraderState {
  UPGRADING = '⚡',
  REFILLING = '🌾'
}

type EnergyTakeMethod =
  | Harvest
  | Pickup
  | Withdraw;

type Harvest = "harvest";
type Pickup = "pickup";
type Withdraw = "withdraw";

interface EnergySource {
  id: Id<Structure | Source | Resource>,
  take: EnergyTakeMethod | undefined
}

const JOB_NAME = 'UpgraderJob'

export function UpgraderJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, {nextState: RefillingState, replay: UpgraderJob});
      break;
    case RefillingState:
      runRefillingState(creep)
      break;
    case HarvestingState:
      runHarvestingState(creep)
      break;
    case MovingState:
      runMovingState(creep)
      break;
    case UpgradingState:
      runUpgradingState(creep)
      break;
    case IdleState:
      resolve(creep, {nextState: HarvestingState, replay: UpgraderJob})
      break;
  }
}

function runUpgradingState(creep: Creep) {
  const upgradeResult = upgradeController(creep)
  new NamedLogger(JOB_NAME).log(`[${creep.name}] upgradeResult: ${upgradeResult}`)

  switch (upgradeResult) {
    case UpgradeResult.CreepStoreEmpty:
      resolveAndReplay(creep, {nextState: RefillingState, replay: UpgraderJob})
      break
    case UpgradeResult.NoControllerInRoom:
      creep.say('💤')
      break
    case UpgradeResult.Upgrading:
      break
    case UpgradeResult.OutOfRange:
      if (creep.room.controller) {
        creep.memory.move = {
          range: 3,
          target: toTarget(creep.room.controller)
        }
        resolveAndReplay(creep, {nextState: MovingState, replay: UpgraderJob})
      }
      break
    case UpgradeResult.CouldNotUpgrade:
      break
  }
}

function runMovingState(creep: Creep) {
  const movingResult = move(creep)
  new NamedLogger(JOB_NAME).log(`[${creep.name}] movingResult: ${movingResult}`)

  switch (movingResult) {
    case MovingResult.CouldNotMove: //do not advance to another state and see what happens
    case MovingResult.Moving: //so keep moving
      break
    case MovingResult.NoPath: //something blocking the path? wait to next tick and run again. In future good to have some traffic control here
      creep.say('🗺️🤔')
      break
    case MovingResult.NoTargetPositionSet:
      resolveLastStateAndReplay(creep, {replay: UpgraderJob})
      break
    case MovingResult.ReachedDestination:
      resolveLastStateAndReplay(creep, {replay: UpgraderJob})
      break
    case MovingResult.Tired:
      creep.say('😩')
      break
  }
}

function runHarvestingState(creep: Creep) {
  const harvestingResult = harvest(creep, true, true)
  new NamedLogger(JOB_NAME).log(`[${creep.name}] harvestingResult: ${harvestingResult}`)

  switch (harvestingResult) {
    case HarvestingResult.CouldNotFindSource: //well... lets call it a day
      // resolveAndReplay(creep, {nextState: IdleState, replay: UpgraderJob})
      break
    case HarvestingResult.CouldNotHarvest: //try again next tick
    case HarvestingResult.Harvesting: //then keep it up
      break
    case HarvestingResult.CreepStoreFull:
      resolveAndReplay(creep, {nextState: UpgradingState, replay: UpgraderJob})
      break
    case HarvestingResult.OutOfRange:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.source)?.get())
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: UpgraderJob})
      break
  }
}

function runRefillingState(creep: Creep) {
  const refillingResult = refillCreep(creep, false)
  new NamedLogger(JOB_NAME).log(`[${creep.name}] refillingResult: ${refillingResult}`)

  switch (refillingResult) {
    case RefillingResult.CreepStoreFull:
      resolveAndReplay(creep, {nextState: UpgradingState, replay: UpgraderJob})
      break
    case RefillingResult.CreepRefilled:
      resolve(creep, {nextState: UpgradingState})
      break
    case RefillingResult.OutOfRange:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.storage)?.get())
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: UpgraderJob})
      break
    case RefillingResult.NoResourcesInStorage:
      resolveAndReplay(creep, {nextState: HarvestingState, replay: UpgraderJob})
      break
    case RefillingResult.CouldNotWithdraw:
      break
  }
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;
  resolveAndReplay(creep, state);
}

function runLegacy(creep: Creep) {
  switch (calculateState(creep)) {
    case UpgraderState.UPGRADING:
      _upgradeController(creep);
      break;
    case UpgraderState.REFILLING:
      _refillCreep(creep);
      break;
  }
}

const VISITED_ENERGY_STORAGE = "E"

function calculateState(creep: Creep): UpgraderState {
  creep.memory.state = creep.memory.state ? creep.memory.state : UpgraderState.REFILLING;

  if (creep.memory.state === UpgraderState.UPGRADING) {
    if (creep.store[RESOURCE_ENERGY] === 0) {
      creep.memory.state = UpgraderState.REFILLING;
    }
  } else if (creep.memory.state === UpgraderState.REFILLING) {
    if (creep.store.getFreeCapacity() === 0) {
      creep.memory.state = UpgraderState.UPGRADING;
      // delete creep.memory.param[VISITED_ENERGY_STORAGE]
    }
  }

  creep.say(creep.memory.state);
  return creep.memory.state as UpgraderState;
}

function _upgradeController(creep: Creep): void {
  if (creep.room.controller) {
    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
    }
  } else {
    creep.say("No controller in room?!")
  }
}

function _refillCreep(creep: Creep): void {
  let foundEnergyStorage = {} as EnergySource | undefined;//creep.memory.param[VISITED_ENERGY_STORAGE] as EnergySource | undefined;
  if (!foundEnergyStorage || !Game.getObjectById(foundEnergyStorage.id) || isEmpty(foundEnergyStorage)) {
    if (!creep.memory.move) return;//compilation fix
    /*creep.memory.param[VISITED_ENERGY_STORAGE] = */
    foundEnergyStorage = findClosestEnergyStorage(creep);
  }

  const object = Game.getObjectById(foundEnergyStorage.id);
  switch (foundEnergyStorage.take) {
    case "harvest":
      if (creep.harvest(object as Source) === ERR_NOT_IN_RANGE) {
        creep.moveTo(object as Source, {visualizePathStyle: {stroke: '#ffaa00'}});
      }
      return;
    case "pickup":
      // if (creep.pickup(object as Resource) === ERR_NOT_IN_RANGE) {
      //   creep.moveTo(object as Resource, {visualizePathStyle: {stroke: '#ffaa00'}});
      // }
      return;
    case "withdraw":
      if (creep.withdraw(object as StructureStorage | StructureContainer, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(object as StructureStorage | StructureContainer, {visualizePathStyle: {stroke: '#ffaa00'}});
      }
      return;
  }
}

function isEmpty(energySource: EnergySource): boolean {
  const object = Game.getObjectById(energySource.id);
  switch (energySource.take) {
    case "withdraw":
      return isStorageEmpty(object as StructureStorage | StructureContainer);
    case "pickup":
      return (object as Resource).amount <= 0;
    case "harvest":
      return (object as Source).energy <= 0;
  }
  return true;
}

function findClosestEnergyStorage(creep: Creep): EnergySource {
  const pos = creep.pos;
  const room = creep.room;
  const structures = room.find(FIND_STRUCTURES, {
    filter: s => (s.structureType === STRUCTURE_CONTAINER ||
      s.structureType === STRUCTURE_STORAGE) &&
      s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  }) as RoomObject[];
  const resources = room.find(FIND_DROPPED_RESOURCES, {
    filter: r => r.resourceType === RESOURCE_ENERGY
  }) as RoomObject[];
  const sources = room.find(FIND_SOURCES, {
    filter: s => s.energy > 0
  }) as RoomObject[];
  const closestByPath = pos.findClosestByPath(structures.concat(resources).concat(sources)) as Structure | Source | Resource;
  const takeMethod = obtainTakeMethod(closestByPath);
  return {
    id: closestByPath.id,
    take: takeMethod
  };
}

function obtainTakeMethod(energySource: Structure | Source | Resource): EnergyTakeMethod | undefined {
  if (_.get(energySource, "structureType")) {
    return "withdraw";
  }
  if (_.get(energySource, "energy")) {
    return "harvest";
  }
  if (_.get(energySource, "resourceType")) {
    return "pickup";
  }
  return undefined;
}

function isStorageEmpty(storage: StructureStorage | StructureContainer): boolean {
  if (storage.structureType === STRUCTURE_STORAGE ||
    storage.structureType === STRUCTURE_CONTAINER)
    return storage.store.getUsedCapacity(RESOURCE_ENERGY) === 0;
  return true;
}

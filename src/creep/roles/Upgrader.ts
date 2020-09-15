import {
  CreepState,
  HarvestingState,
  IdleState,
  MovingState,
  RefillingState,
  resolve,
  SpawningState,
  StateResolver,
  UpgradingState
} from "../states/CreepState";
import {harvest} from "../states/HarvestingEnergy";
import {move} from "../states/Moving";
import {upgradeController} from "../states/UpgradingController";
import {refillCreep} from "../states/RefillingCreep";

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

export function UpgraderJob(creep: Creep): void {
  if (global.legacy) {
    runLegacy(creep);
  } else {
    if (!creep.memory.state) {
      creep.memory.state = SpawningState
    }

    switch (creep.memory.state) {
      case SpawningState:
        initialize(creep, {nextState: RefillingState});
        break;
      case RefillingState:
        refillCreep(creep, {getNextState: stateAfterRefill(creep)});
        break;
      case HarvestingState:
        harvest(creep, true, {nextState: UpgradingState});
        break;
      case MovingState:
        move(creep, {getNextState: stateAfterMoving(creep)});
        break;
      case UpgradingState:
        upgradeController(creep, {nextState: RefillingState})
        break;
      case IdleState:
        break;
    }
  }
}

function stateAfterRefill(creep: Creep) {
  return function (): CreepState {
    return creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ? UpgradingState : HarvestingState;
  };
}

function stateAfterMoving(creep: Creep) {
  return function (): CreepState {
    return creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ? UpgradingState : HarvestingState;
  };
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;
  creep.memory.state = resolve(state);
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
    if (!creep.memory.param) return;//compilation fix
    creep.memory.param[VISITED_ENERGY_STORAGE] = foundEnergyStorage = findClosestEnergyStorage(creep);
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

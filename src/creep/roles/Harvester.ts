import {UpgraderJob} from "./Upgrader";
import {
  CreepState,
  HarvestingState,
  MovingState,
  SpawningState,
  StateResolver,
  StoringState,
  resolve
} from "../states/CreepState";
import {harvest} from "../states/HarvestingEnergy";
import {move} from "../states/Moving";
import {storeEnergy} from "../states/StoringEnergy";

export function HarvesterJob(creep: Creep): void {
  if (global.legacy) {
    runLegacy(creep);
  } else {
    if (!creep.memory.state) {
      creep.memory.state = SpawningState
    }

    switch (creep.memory.state) {
      case SpawningState:
        initialize(creep, {nextState: HarvestingState});
        break;
      case MovingState:
        move(creep, {getNextState: stateAfterMoving(creep)});
        break;
      case HarvestingState:
        harvest(creep, {nextState: StoringState});
        break;
      case StoringState:
        storeEnergy(creep, {nextState: HarvestingState});
        break;
    }
  }
}

function stateAfterMoving(creep: Creep) {
  return function (): CreepState {
    return creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 ? StoringState : HarvestingState;
  };
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return;

  const source = _.shuffle(creep.room.find(FIND_SOURCES))[0];
  creep.memory.source = source.id;
  creep.memory.targetPos = {
    x: source.pos.x,
    y: source.pos.y,
    room: source.pos.roomName,
  };

  creep.memory.state = resolve(state);
}

function runLegacy(creep: Creep): void {
  if (creep.store.getFreeCapacity() > 0) {
    const sources = creep.room.find(FIND_SOURCES);
    if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
      creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
      creep.say("🥾➡️🌾")
    }
  } else {
    const targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
          structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });
    if (targets.length > 0) {
      const transferResult = creep.transfer(targets[0], RESOURCE_ENERGY);
      if (transferResult === ERR_NOT_IN_RANGE) {
        creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
        creep.say("🥾➡️🏠")
      }
    } else {
      const spawn = creep.room.find(FIND_MY_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_SPAWN
      })[0];
      // creep.moveTo(spawn.pos.x, spawn.pos.y + 5);
      // creep.say("🕜 idle")
      UpgraderJob(creep);
    }
  }
}

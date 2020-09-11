import {HarvestingState, IdleState, MovingState, resolve, StateResolver} from "./CreepState";

export function upgradeController(creep: Creep, state: StateResolver): void {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    creep.memory.state = resolve(state);
  }

  const controller = creep.room.controller;
  if (!controller) {
    creep.say("💤");
    creep.memory.state = resolve({nextState: IdleState});
    return;
  }

  const upgradeResult = creep.upgradeController(controller);
  if (upgradeResult === OK) return;
  if (upgradeResult === ERR_NOT_IN_RANGE) {
    goToController(creep, controller);
  }
}

function goToController(creep: Creep, controller: StructureController) {
  creep.memory.targetPos = {
    x: controller.pos.x,
    y: controller.pos.y,
    room: controller.pos.roomName,
  };
  creep.say("🥾");
  creep.memory.state = resolve({nextState: MovingState});
}

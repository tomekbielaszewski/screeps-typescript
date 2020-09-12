import {resolveAndReplay, StateResolver} from "./CreepState";

export function move(creep: Creep, state: StateResolver) {
  const targetPos = creep.memory.targetPos;
  if (!targetPos) {
    console.error(`Moving state executed without setting target position! ${creep.name}`);
    resolveAndReplay(creep, state);
    return;
  }
  const target = new RoomPosition(targetPos.x, targetPos.y, targetPos.room);

  if (creep.pos.getRangeTo(target) > 1) {
    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
    return;
  }

  delete creep.memory.targetPos;
  resolveAndReplay(creep, state);
}

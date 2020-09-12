import {resolveAndReplay, StateResolver} from "./CreepState";

export function move(creep: Creep, state: StateResolver) {
  const targetPos = creep.memory.targetPos;
  if (!targetPos) {
    console.error(`Moving state executed without setting target position! ${creep.name}`);
    resolveAndReplay(creep, state);
    return;
  }
  const target = new RoomPosition(targetPos.x, targetPos.y, targetPos.room);
  const range = creep.memory.param?.range as number || 1;

  if (creep.pos.getRangeTo(target) > range) {
    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
    return;
  }

  delete creep.memory.param?.range
  delete creep.memory.targetPos;
  resolveAndReplay(creep, state);
}

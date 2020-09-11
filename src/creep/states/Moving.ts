import {resolveAndReplay, StateResolver} from "./CreepState";

export function move(creep: Creep, state: StateResolver) {
  const targetPos = creep.memory.targetPos;
  if (!targetPos) {
    throw new Error('Moving state executed without setting target position')
  }
  const target = new RoomPosition(targetPos.x, targetPos.y, targetPos.room)

  if (creep.pos.getRangeTo(target) > 1) {
    creep.moveTo(target);
    return;
  }

  delete creep.memory.targetPos;
  resolveAndReplay(creep, state);
}

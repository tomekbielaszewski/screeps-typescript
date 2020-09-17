import {resolveLastStateAndReplay, StateResolver} from "./CreepState";

export function move(creep: Creep, state: StateResolver) {
  const targetPos = creep.memory.targetPos;
  if (!targetPos) {
    console.log(`Moving state executed without setting target position! ${creep.name}`);
    resolveLastStateAndReplay(creep, state);
    return;
  }
  const target = new RoomPosition(targetPos.x, targetPos.y, targetPos.room);
  const range = creep.memory.param?.range as number || 1;

  if (creep.pos.getRangeTo(target) > range) {
    const moveToResult = creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
    switch (moveToResult) {
      case OK:
        break;
      case ERR_TIRED:
        break;
      default:
        console.log(`Moving: moveTo result ${moveToResult}`);
    }
    return;
  }

  delete creep.memory.param?.range
  delete creep.memory.targetPos;
  resolveLastStateAndReplay(creep, state);
}

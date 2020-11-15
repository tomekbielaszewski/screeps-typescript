import {IdentifiableRoomObject, SerializablePosition} from "../../../../utils/Serializables";

export enum MovingResult {
  NoTargetPositionSet,
  Moving,
  Tired,
  NoPath,
  CouldNotMove,
  ReachedDestination
}

export function move(creep: Creep): MovingResult {
  const targetPos = creep.memory.move?.target;
  if (!targetPos) {
    console.log(`Moving state executed without setting target position! ${creep.name}`);
    return MovingResult.NoTargetPositionSet;
  }
  const target = SerializablePosition.clone(targetPos).toPos();
  const range = creep.memory.move?.range || 1;

  if (creep.pos.getRangeTo(target) > range) {
    const moveToResult = creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
    switch (moveToResult) {
      case OK:
        return MovingResult.Moving
      case ERR_TIRED:
        return MovingResult.Tired
      case ERR_NO_PATH:
        return MovingResult.NoPath
      default:
        console.log(`Moving: moveTo result ${moveToResult}`);
        return MovingResult.CouldNotMove
    }
  } else {
    delete creep.memory.move
    return MovingResult.ReachedDestination
  }
}

export function toTarget(roomObject: IdentifiableRoomObject | Flag | null | undefined): SerializablePosition {
  if (!roomObject) throw Error('No target set')
  return SerializablePosition.from(roomObject.pos)
}

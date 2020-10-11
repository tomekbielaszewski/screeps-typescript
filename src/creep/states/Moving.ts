export enum MovingResult {
  NoTargetPositionSet,
  Moving,
  Tired,
  NoPath,
  CouldNotMove,
  ReachedDestination
}

export function move(creep: Creep): MovingResult {
  const targetPos = creep.memory.param?.target as SerializablePosition;
  if (!targetPos) {
    console.log(`Moving state executed without setting target position! ${creep.name}`);
    return MovingResult.NoTargetPositionSet;
  }
  const target = targetPos.toPos();
  const range = creep.memory.param?.range as number || 1;

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
    delete creep.memory.param?.range
    delete creep.memory.param?.target
    return MovingResult.ReachedDestination
  }
}

export function toTarget(roomObject: IdentifiableRoomObject | Flag | null | undefined): SerializablePosition {
  if (!roomObject) throw Error('No target set')
  return SerializablePosition.from(roomObject.pos)
}

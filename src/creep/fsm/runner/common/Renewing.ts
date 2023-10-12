import { SerializableRoomObject } from "../../../../utils/Serializables";

export enum RenewingResult {
  Renewing,
  CreepRenewed,
  CouldNotFindSpawn,
  OutOfRange,
  SpawnEmpty,
  CouldNotRenew,
  SpawnSpawning,
}

export function renew(creep: Creep): RenewingResult {
  if (creep.ticksToLive && creep.ticksToLive > 1400) {
    delete creep.memory.spawn
    return RenewingResult.CreepRenewed
  }

  if (!creep.memory.spawn) {
    assignSpawn(creep)
  }

  let spawn = SerializableRoomObject.cloneNullable(creep.memory.spawn)?.get() as StructureSpawn | null
  if (!spawn) {
    return RenewingResult.CouldNotFindSpawn
  }

  const renewResult = spawn.renewCreep(creep)
  switch (renewResult) {
    case OK:
      return RenewingResult.Renewing
    case ERR_NOT_IN_RANGE:
      return RenewingResult.OutOfRange
    case ERR_NOT_ENOUGH_ENERGY:
      return RenewingResult.SpawnEmpty
    case ERR_BUSY:
      return RenewingResult.SpawnSpawning
    default:
      console.log(`Renewing: creep renew result ${renewResult}`);
      return RenewingResult.CouldNotRenew
  }
}

function assignSpawn(creep: Creep) {
  creep.room.find(FIND_MY_SPAWNS)
    .sort((s1, s2) => creep.pos.getRangeTo(s1.pos) - creep.pos.getRangeTo(s2.pos))
    .find(spawn => creep.memory.spawn = SerializableRoomObject.from(spawn));
}

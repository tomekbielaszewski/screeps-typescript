import { SerializableRoomObject } from "../../../../utils/Serializables";
import { RenewingState } from "./CreepState";

export enum RenewingResult {
  Renewing,
  CreepRenewed,
  CouldNotFindSpawn,
  OutOfRange,
  SpawnEmpty,
  CouldNotRenew,
  SpawnSpawning,
}

export const RENEW_FROM = 150
export const RENEW_UPTO = 1400

export function shouldRenew(creep: Creep): boolean {
  const isDying = !!(creep.ticksToLive && creep.ticksToLive < RENEW_FROM)
  if (!creep.memory.renewing && isDying) {
    return creep.memory.renewing = isDying
  }
  return false
}

export function renew(creep: Creep): RenewingResult {
  if (creep.ticksToLive && creep.ticksToLive > RENEW_UPTO) {
    delete creep.memory.spawn
    delete creep.memory.renewing
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
      if(!creep.memory.totalRenewedTicks) creep.memory.totalRenewedTicks = 0
      if(!creep.memory.totalRenewedCost) creep.memory.totalRenewedCost = 0
      creep.memory.totalRenewedTicks += Math.floor(600/creep.body.length)
      creep.memory.totalRenewedCost += Math.ceil(creep.memory.cost/2.5/creep.body.length)
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
    .sort((s1, s2) => s1.store.energy - s2.store.energy)
    .find(spawn => creep.memory.spawn = SerializableRoomObject.from(spawn));
}

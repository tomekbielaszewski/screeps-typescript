import {IdleState, MovingState, ReplayFunction, resolveAndReplay, StateResolver} from "./CreepState";

export function repairing(creep: Creep, repairFortifications: boolean, state: StateResolver): void {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    resolveAndReplay(creep, state);
    return;
  }

  if (!Memory.repair.lowHP || !Memory.repair.hysteresis) {
    Memory.repair.lowHP = 0.8
    Memory.repair.hysteresis = 0.19
  }

  if (Memory.repair.lowHP + Memory.repair.hysteresis > 1) {
    throw new Error("Wrong repairing settings! Low HP + Hysteresis must be lower or equal to 1!");
  }

  if (!creep.memory.repair) {
    findLowHpStructure(creep, repairFortifications);
  }

  if (!creep.memory.repair) {
    resolveAndReplay(creep, {nextState: IdleState, replay: state.replay});
    return;
  }

  const repairedStructure = Game.getObjectById<OwnedStructure>(creep.memory.repair);
  if (!repairedStructure) {
    delete creep.memory.repair;
    resolveAndReplay(creep, state);
    return;
  }

  if (isRepaired(repairedStructure)) {
    delete creep.memory.repair;
    resolveAndReplay(creep, state);
    return;
  }

  const repairResult = creep.repair(repairedStructure);
  switch (repairResult) {
    case OK:
      break;
    case ERR_NOT_IN_RANGE:
      goToStructure(creep, repairedStructure, state?.replay);
      break;
    default:
      console.log(`Repairing: repair result ${repairResult}`);
  }
}

//Game.rooms['W24N13'].find(FIND_STRUCTURES).filter(s => s.structureType !== STRUCTURE_CONTROLLER).filter(s => s.hits / s.hitsMax < Memory.repair.lowHP)
// .filter(s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART)
// .reduce((s1, s2) => (s1.hits / s1.hitsMax < s2.hits / s2.hitsMax ? s1 : s2))
// .map(s => s.structureType)

function findLowHpStructure(creep: Creep, repairFortifications: boolean) {
  let lowestHpStructures = creep.room.find(FIND_STRUCTURES)
    .filter(s => s.structureType !== STRUCTURE_CONTROLLER)
    .filter(s => hpPercent(s) < Memory.repair.lowHP);
  if (repairFortifications === false) {
    lowestHpStructures = lowestHpStructures
      .filter(s =>
        s.structureType !== STRUCTURE_WALL &&
        s.structureType !== STRUCTURE_RAMPART
      )
  }
  if (lowestHpStructures.length) {
    const lowestHpStructure = lowestHpStructures.reduce((s1, s2) => (hpPercent(s1) < hpPercent(s2) ? s1 : s2));
    creep.memory.repair = lowestHpStructure.id;
  }
}

function isRepaired(repairedStructure: Structure): boolean {
  switch (repairedStructure.structureType) {
    case STRUCTURE_WALL:
      return repairedStructure.hits > (Memory.repair.wall || 500000)
    case STRUCTURE_RAMPART:
      return repairedStructure.hits > (Memory.repair.rampart || 500000)
    default:
      return hpPercent(repairedStructure) > Memory.repair.lowHP + Memory.repair.hysteresis;
  }
}

function goToStructure(creep: Creep, structure: Structure, replay: ReplayFunction | undefined) {
  setTarget(creep, structure);
  creep.say("🥾");
  resolveAndReplay(creep, {nextState: MovingState, params: {range: 3, target: creep.memory.targetPos}, replay});
}

function setTarget(creep: Creep, structure: Structure): void {
  creep.memory.targetPos = {
    x: structure.pos.x,
    y: structure.pos.y,
    room: structure.pos.roomName,
  };
}

function hpPercent(s: Structure): number {
  return s.hits / s.hitsMax;
}

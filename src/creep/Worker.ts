import {BuilderJob} from "./fsm/Builder";
import {CarrierJob} from "./fsm/Carrier";
import {CreepRole, creepSymbols} from "./CreepManager";
import {HarvesterJob} from "./fsm/Harvester";
import {MinerJob} from "./fsm/Miner";
import {UpgraderJob} from "./fsm/Upgrader";
import {measure} from "../utils/Profiler";
import {CleanerJob} from "./fsm/Cleaner";

const workers: Record<CreepRole, (creep: Creep) => void> = {
  [CreepRole.HARVESTER]: HarvesterJob,
  [CreepRole.UPGRADER]: UpgraderJob,
  [CreepRole.BUILDER]: BuilderJob,
  [CreepRole.MINER]: MinerJob,
  [CreepRole.CARRIER]: CarrierJob,
  [CreepRole.CLEANER]: CleanerJob,
}

export function CreepWorker(): void {
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName];
    const role = creep.memory.role as CreepRole;
    measure(executeRole(role, creep), "roles." + role);
  }
}

function executeRole(role: CreepRole, creep: Creep) {
  return function (): void {
    workers[role](creep);
    creep.room.visual.text(creepSymbols[role], creep.pos, {align: "center"})
  };
}

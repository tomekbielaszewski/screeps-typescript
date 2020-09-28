import {BuilderJob} from "./roles/Builder";
import {CarrierJob} from "./roles/Carrier";
import {CreepRole} from "./CreepManager";
import {HarvesterJob} from "./roles/Harvester";
import {MinerJob} from "./roles/Miner";
import {UpgraderJob} from "./roles/Upgrader";
import {measure} from "../utils/Profiler";
import {CleanerJob} from "./roles/Cleaner";

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
  };
}

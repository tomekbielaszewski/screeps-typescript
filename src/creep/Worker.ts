import {BuilderJob} from "./roles/Builder";
import {CarrierJob} from "./roles/Carrier";
import {CreepRole} from "./CreepManager";
import {HarvesterJob} from "./roles/Harvester";
import {MinerJob} from "./roles/Miner";
import {UpgraderJob} from "./roles/Upgrader";

const workers: Record<CreepRole, (creep: Creep) => void> = {
  [CreepRole.HARVESTER]: HarvesterJob,
  [CreepRole.UPGRADER]: UpgraderJob,
  [CreepRole.BUILDER]: BuilderJob,
  [CreepRole.MINER]: MinerJob,
  [CreepRole.CARRIER]: CarrierJob,
}

export function CreepWorker() {
  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName];
    const role = creep.memory.role as CreepRole;
    workers[role](creep);
  }
}

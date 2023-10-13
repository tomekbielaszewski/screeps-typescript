import "lodash"
import {getLogger} from "../utils/Logger";

const JOB_NAME = 'CreepManager'

class CreepDefinition {
  public readonly type: CreepRole;
  public readonly parts: BodyPartConstant[];
  public readonly cost: number;

  public constructor(type: CreepRole, parts: BodyPartConstant[], cost: number) {
    this.type = type;
    this.parts = parts;
    this.cost = cost;
  }
}

/*
  roles:
   harvester
   upgrader
   builder
   miner
   carrier
   puller
   defender
   healer

  constraints
   is there any other creep?
   is there any energy harvesting creep?
     harvester?
     miner + carrier?
   is room under attack?
   do you have enough energy capacity?
   how long to get that energy?
   is it more optimal to create smaller creep to get energy for bigger creep?
   do I still need low level creeps?
   emergency backup creep after attack
 */

export enum CreepRole {
  HARVESTER = "Harvester",
  UPGRADER = "Upgrader",
  BUILDER = "Builder",
  MINER = "Miner",
  CARRIER = "Carrier",
  CLEANER = "Cleaner",
}

const creepRoleOrder = [
  CreepRole.HARVESTER,
  CreepRole.UPGRADER,
  CreepRole.BUILDER,
  CreepRole.MINER,
  CreepRole.CARRIER,
  CreepRole.CLEANER,
];

/*
RCL 1: max energy capacity = 300
RCL 2: max energy capacity = 550
RCL 3: max energy capacity = 800
RCL 4: max energy capacity = 1300
RCL 5: max energy capacity = 1800
RCL 6: max energy capacity = 2300
RCL 7: max energy capacity = 5600
RCL 8: max energy capacity = 12900
*/
const creepDefinitions: Record<CreepRole, CreepDefinition[]> = {
  [CreepRole.HARVESTER]: [
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], 10*50 + 4*100 + 6*50),
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, CARRY], 800),
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY], 500),
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY], 450),
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, MOVE, MOVE, WORK, CARRY], 300),
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, WORK, CARRY], 200),
  ],
  [CreepRole.UPGRADER]: [
    new CreepDefinition(CreepRole.UPGRADER, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY], 9*50 + 3*100 + 6*50),
    new CreepDefinition(CreepRole.UPGRADER, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY], 800),
    new CreepDefinition(CreepRole.UPGRADER, [MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY], 500),
    new CreepDefinition(CreepRole.UPGRADER, [MOVE, MOVE, MOVE, WORK, CARRY], 300),
    new CreepDefinition(CreepRole.UPGRADER, [MOVE, WORK, CARRY], 200),
  ],
  [CreepRole.BUILDER]: [
    new CreepDefinition(CreepRole.BUILDER, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY, CARRY, CARRY], 300+200+200),
    new CreepDefinition(CreepRole.BUILDER, [MOVE, MOVE, MOVE, MOVE, WORK, CARRY, CARRY, CARRY], 450),
    new CreepDefinition(CreepRole.BUILDER, [MOVE, MOVE, MOVE, WORK, CARRY], 300),
  ],
  [CreepRole.MINER]: [
    new CreepDefinition(CreepRole.MINER, [MOVE, WORK, WORK, WORK, WORK, WORK], 550),
  ],
  [CreepRole.CARRIER]: [
    new CreepDefinition(CreepRole.CARRIER, [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], 550),
  ],
  [CreepRole.CLEANER]: [
    new CreepDefinition(CreepRole.CLEANER, [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], 550),
  ],
};

const creepAmounts: Record<CreepRole, number> = {
  [CreepRole.HARVESTER]: 4,
  [CreepRole.UPGRADER]: 3,
  [CreepRole.BUILDER]: 2,
  [CreepRole.MINER]: 0,
  [CreepRole.CARRIER]: 0,
  [CreepRole.CLEANER]: 0,
}

export const creepSymbols: Record<CreepRole, string> = {
  [CreepRole.HARVESTER]: "🌾",
  [CreepRole.UPGRADER]: "⚡",
  [CreepRole.BUILDER]: "🔨",
  [CreepRole.MINER]: "⛏️",
  [CreepRole.CARRIER]: "📦",
  [CreepRole.CLEANER]: "📦",
}

export function CreepManager(): void {
  forEverySpawn(spawn => {
    if (spawn.spawning) drawSpawning(spawn);
    else {
      for (const _role of creepRoleOrder) {
        const role = _role as CreepRole
        const amountOfLive = countCreepsByRole(role, spawn)
        if (amountOfLive < creepAmounts[role]) {
          for (const creepDef of creepDefinitions[role]) {

            let spawningPredicate
            if (role == CreepRole.HARVESTER && amountOfLive <= 2) {
              spawningPredicate = spawn.room.energyAvailable >= creepDef.cost
                && !spawn.spawning
            } else {
              spawningPredicate = spawn.room.energyAvailable >= spawn.room.energyCapacityAvailable * 0.8
                && spawn.room.energyAvailable >= creepDef.cost
                && !spawn.spawning
            }

            if (spawningPredicate) {
              getLogger(JOB_NAME).log(`[Spawn: ${spawn.name}] spawning ${creepDef.type} worth ${creepDef.cost}`)
              spawn.spawnCreep(creepDef.parts, `${role}:${Game.time}`, {
                memory: {
                  role: _role,
                  room: spawn.room.name,
                  cost: creepDef.cost
                }
              });
              return;
            }
          }
        }
      }
    }
  });

  function drawSpawning(spawn: StructureSpawn): void {
    if (spawn.spawning) {
      const spawningCreep = Game.creeps[spawn.spawning.name];
      const role = spawningCreep.memory.role as CreepRole;
      const creepSymbol = creepSymbols[role]
      spawn.room.visual.text(
        creepSymbol,
        spawn.pos.x + 1,
        spawn.pos.y,
        { align: 'left', opacity: 0.8 });
    }
  }

  function forEverySpawn(onSpawn: (spawn: StructureSpawn) => void): void {
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      onSpawn(spawn);
    }
  }

  function countCreepsByRole(role: CreepRole, spawn: StructureSpawn): number {
    return _.filter(Game.creeps, creep => creep && creep.memory.role === role)
      .filter(creep => creep.memory.room === spawn.room.name)
      .length;
  }
}

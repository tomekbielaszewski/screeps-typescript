import "lodash"

class CreepDefinition {
  public readonly type: CreepRole;
  public readonly parts: BodyPartConstant[];
  public readonly cost: number;
  public readonly symbol: string;

  public constructor(type: CreepRole, parts: BodyPartConstant[], cost: number, symbol: string) {
    this.type = type;
    this.parts = parts;
    this.cost = cost;
    this.symbol = symbol;
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
  HARVESTER = "1",
  UPGRADER = "2",
  BUILDER = "3",
  MINER = "4",
  CARRIER = "5"
}

const creepDefinitions: Record<CreepRole, CreepDefinition[]> = {
  [CreepRole.HARVESTER]: [
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY], 500, "🌾"),
    new CreepDefinition(CreepRole.HARVESTER, [MOVE, WORK, CARRY], 200, "🌾"),
  ],
  [CreepRole.UPGRADER]: [
    new CreepDefinition(CreepRole.UPGRADER, [MOVE, MOVE, MOVE, MOVE, WORK, CARRY, CARRY, CARRY, CARRY, CARRY], 550, "⚡"),
    new CreepDefinition(CreepRole.UPGRADER, [MOVE, WORK, CARRY], 200, "⚡"),
  ],
  [CreepRole.BUILDER]: [
    new CreepDefinition(CreepRole.BUILDER, [MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY, CARRY], 550, "🔨"),
    new CreepDefinition(CreepRole.BUILDER, [MOVE, MOVE, WORK, CARRY, CARRY], 300, "🔨"),
  ],
  [CreepRole.MINER]: [
    new CreepDefinition(CreepRole.MINER, [MOVE, WORK, WORK, WORK, WORK, WORK], 550, "⛏️"),
  ],
  [CreepRole.CARRIER]: [
    new CreepDefinition(CreepRole.CARRIER, [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], 550, "📦"),
  ],
};

const creepAmounts: Record<CreepRole, number> = {
  [CreepRole.HARVESTER]: 2,
  [CreepRole.UPGRADER]: 2,
  [CreepRole.BUILDER]: 2,
  [CreepRole.MINER]: 2,
  [CreepRole.CARRIER]: 2,
}

export function CreepManager() {
  forEverySpawn(spawn => {
    if (spawn.spawning) drawSpawning(spawn);
    else {
      for (const _role in CreepRole) {
        const role = _role as CreepRole
        const amountOfLive = _.filter(Game.creeps, creep => creep.memory.role === role)
          .filter(creep => creep.memory.room === spawn.room.name)
          .length;
        if (amountOfLive < creepAmounts[role]) {
          for (const creepDef of creepDefinitions[role]) {
            const availableEnergy = spawn.room.energyAvailable;
            if (availableEnergy >= creepDef.cost) {
              // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
              spawn.spawnCreep(creepDef.parts, _role + ":" + Game.time, {
                memory: {
                  role: _role,
                  room: spawn.room.name
                }
              });
              break;
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
      const creepSymbol = creepDefinitions[role][0].symbol
      spawn.room.visual.text(
        creepSymbol,
        spawn.pos.x + 1,
        spawn.pos.y,
        {align: 'left', opacity: 0.8});
    }
  }

  function forEverySpawn(onSpawn: (spawn: StructureSpawn) => void): void {
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      onSpawn(spawn);
    }
  }

  return;
}

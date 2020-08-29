class CreepDefinition {
  public readonly type: string;
  public readonly parts: BodyPartConstant[];
  public readonly cost: number;
  public readonly amount: number;

  public constructor(type: string, parts: BodyPartConstant[], cost: number, amount: number) {
    this.type = type;
    this.parts = parts;
    this.cost = cost;
    this.amount = amount;
  }
}

/**
 * roles:
 *  harvester
 *  upgrader
 *  builder
 *  miner
 *  carrier
 *  puller
 *  defender
 *  healer
 *
 * constraints
 *  is there any other creep?
 *  is there any energy harvesting creep?
 *    harvester?
 *    miner + carrier?
 *  is room under attack?
 *  do you have enough energy capacity?
 *  how long to get that energy?
 *  is it more optimal to create smaller creep to get energy for bigger creep?
 *  do I still need low level creeps?
 *  emergency backup creep after attack
 */

const creepPriority: CreepDefinition[] = [
    new CreepDefinition("harvester", [MOVE, WORK, CARRY], 200, 2),
    new CreepDefinition("upgrader", [MOVE, WORK, CARRY], 200, 2),

    new CreepDefinition("harvester", [MOVE, MOVE, WORK, CARRY, CARRY], 300, 2),
    new CreepDefinition("builder", [MOVE, MOVE, WORK, CARRY, CARRY], 300, 2),
    new CreepDefinition("miner", [MOVE, WORK, WORK, WORK], 350, 2),
    new CreepDefinition("carrier", [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY], 400, 2),
    new CreepDefinition("upgrader", [MOVE, MOVE, WORK, CARRY, CARRY], 300, 1)
  ];

export function CreepPopulationManager() {
  forEveryControlledRoom((rcl, spawn) => {
    if (!spawn.spawning) {
      const priority = creepPriority[rcl];

    }
  });

  function forEveryControlledRoom(onControlledRoom: (rcl: number, spawn: StructureSpawn) => void): void {
    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName];
      if (spawn.room.controller) {
        onControlledRoom(spawn.room.controller.level, spawn);
      }
    }
  }

  return;
}

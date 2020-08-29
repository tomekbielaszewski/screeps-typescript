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

const bootstrapCreepPriorities: CreepDefinition[] = [
  new CreepDefinition("harvester", [MOVE, WORK, CARRY], 200, 1),
  new CreepDefinition("miner", [MOVE, WORK, WORK], 250, 2),
  new CreepDefinition("carrier", [MOVE, MOVE, CARRY, CARRY], 200, 2),
  new CreepDefinition("upgrader", [MOVE, WORK, WORK, WORK], 100, 1)
];

const rcl2CreepPriorities: CreepDefinition[] = [];

export function CreepPopulationManager() {
  return;
}

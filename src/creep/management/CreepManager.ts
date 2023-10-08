import {BTNode, BTNodeResult, LeafNode, SelectorNode, SequenceNode} from "../../utils/BehaviourTree";
import {CreepRole} from "../CreepManager";

interface SpawningContext {
  room: string
  spawns: Id<StructureSpawn>[]
  sources: Id<Source>[]
}

interface RoomSpawningDecision {
  context: SpawningContext
  decisionTree: BTNode<SpawningContext>
}

const HarvesterSpawnDecision: BTNode<SpawningContext> = new SequenceNode([
  new LeafNode(hasNoMiners),
  new LeafNode(hasNoCarriers),
  new LeafNode(harvestersLessThanSources),
])
const UpgraderSpawnDecision: BTNode<SpawningContext> = new SelectorNode([
  new LeafNode(hasHarvestersOrMiners),
])
const BuilderSpawnDecision: BTNode<SpawningContext> = new SelectorNode([])
const MinerSpawnDecision: BTNode<SpawningContext> = new SelectorNode([])
const CarrierSpawnDecision: BTNode<SpawningContext> = new SelectorNode([])
const NotSpawning: BTNode<SpawningContext> = new LeafNode<SpawningContext>(notSpawning)

function newDecisionTree(room: Room): RoomSpawningDecision {
  return {
    context: {
      room: room.name,
      spawns: room.find(FIND_MY_SPAWNS)
        .map(s => s.id), //TODO: What if spawns change (destroy? build new?) after creating decision tree for given room?
      sources: room.find(FIND_SOURCES)
        .map(s => s.id),
    },
    decisionTree: new SequenceNode([
      NotSpawning,
      new SelectorNode([
        HarvesterSpawnDecision,
        UpgraderSpawnDecision,
        BuilderSpawnDecision,
        MinerSpawnDecision,
        CarrierSpawnDecision,
      ]),
    ]),
  }
}

const roomSpawningDecisions: { [name: string]: RoomSpawningDecision } = {}

export function CreepManager(): void {
  Object.values(Game.rooms)
    .forEach(room => {
      const roomSpawningDecision = roomSpawningDecisions[room.name] || newDecisionTree(room)
      roomSpawningDecisions[room.name] = roomSpawningDecision
      roomSpawningDecision.decisionTree.process(roomSpawningDecision.context)
    });
}

function notSpawning(ctx: SpawningContext): BTNodeResult {
  const spawns = ctx.spawns.map(id => Game.getObjectById(id))
    .filter(spawn => !!spawn?.spawning);
  return spawns.length > 0 ? BTNodeResult.SUCCESS : BTNodeResult.FAILURE;
}

function hasNoMiners(ctx: SpawningContext): BTNodeResult {
  return getAmountOfCreepsInRoom(ctx.room, CreepRole.MINER) === 0 ? BTNodeResult.SUCCESS : BTNodeResult.FAILURE
}

function hasNoCarriers(ctx: SpawningContext): BTNodeResult {
  return getAmountOfCreepsInRoom(ctx.room, CreepRole.CARRIER) === 0 ? BTNodeResult.SUCCESS : BTNodeResult.FAILURE
}

function harvestersLessThanSources(ctx: SpawningContext): BTNodeResult {
  return getAmountOfCreepsInRoom(ctx.room, CreepRole.HARVESTER) < ctx.sources.length ? BTNodeResult.SUCCESS : BTNodeResult.FAILURE
}

function hasHarvestersOrMiners(ctx: SpawningContext): BTNodeResult {
  return getAmountOfCreepsInRoom(ctx.room, CreepRole.HARVESTER) > 0 ||
  getAmountOfCreepsInRoom(ctx.room, CreepRole.MINER) > 0 ? BTNodeResult.SUCCESS : BTNodeResult.FAILURE
}

function getAmountOfCreepsInRoom(room: string, role: CreepRole): number {
  return Object.values(Game.creeps)
    .filter(creep => creep.room.name === room)
    .filter(creep => creep.memory.role === role)
    .length
}

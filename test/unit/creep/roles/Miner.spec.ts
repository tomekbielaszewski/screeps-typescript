import {mockGlobal} from "screeps-jest/index";
import {mockInstanceOf} from "screeps-jest/src/mocking";
import {MinerJob} from "../../../../src/creep/fsm/Miner";

const FULL_STORE = {
  getFreeCapacity: () => 0,
  getCapacity: () => 50,
  getUsedCapacity: () => 50
} as StoreDefinition;

const EMPTY_STORE = {
  getFreeCapacity: () => 50,
  getCapacity: () => 50,
  getUsedCapacity: () => 0
} as StoreDefinition;

const HALF_STORE = {
  getFreeCapacity: () => 25,
  getCapacity: () => 50,
  getUsedCapacity: () => 25
} as StoreDefinition;

mockGlobal<Memory>('Memory', {log: {state: undefined}}, true);

const creepMemory = {
  state: undefined,
  lastState: undefined,
  storage: undefined,
} as CreepMemory;
const spawnPos = new RoomPosition(10, 0, 'room');
const spawn = mockInstanceOf<StructureSpawn>({
  id: 'spawnId' as Id<StructureSpawn>,
  pos: spawnPos
})
const room = mockInstanceOf<RoomPosition>({
  find: () => [spawn]
})
const creep = mockInstanceOf<Creep>({
  name: 'myCreep',
  memory: creepMemory,
  room,
  spawning: false,
  store: FULL_STORE,
  say: () => OK,
  transfer: () => ERR_NOT_IN_RANGE,
  moveTo: () => OK,
  pos: {x: 0, y: 0, roomName: 'room', getRangeTo: () => 10},
});
mockGlobal<Game>('Game', {
  time: 1,
  creeps: {myHero: creep},
  getObjectById: () => spawn,
});
mockGlobal<Memory>('Memory', {log: {state: undefined}}, true);

describe('Miner role', () => {
  it('should do nothing when spawning', () => {
    MinerJob(mockInstanceOf<Creep>({
      memory: {
        state: undefined
      },
      spawning: true,
    }))
  });

  it('should attempt to harvest source when not spawning anymore', () => {
    MinerJob(mockInstanceOf<Creep>({
      memory: {
        state: undefined,

      },
      spawning: false,
    }))
  });

  it('should go to source when out of reach', () => {

  });

  it('should transfer energy to storage when creep full', () => {

  });

  it('should move to storage when creep full and storage out of reach', () => {

  });
})


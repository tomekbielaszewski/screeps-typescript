import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {CreepManager, CreepRole} from "../../../src/creep/CreepManager";
import anything = jasmine.anything;

describe("Creep manager", () => {

  it("should create Harvester as first ever creep", () => {
    const mocks = mockAll({
      energyAvailable: 200
    });
    const spawn = mocks.spawnMock;
    const room = mocks.roomMock;

    CreepManager();

    expect(spawn.spawnCreep).toBeCalledWith([MOVE, WORK, CARRY], anything(), {
      memory: {
        param: {},
        role: CreepRole.HARVESTER,
        room: room.name
      }
    });
  });

  it("should create Upgrader as second creep", () => {
    const mocks = mockAll({
      energyAvailable: 200
    });
    const spawn = mocks.spawnMock;
    const room = mocks.roomMock;

    const harvesterMemory = {
      role: CreepRole.HARVESTER,
      room: room.name,
      state: undefined,
      param: { }
    };
    const creep1 = mockInstanceOf<Creep>({
      name: 'first',
      memory: harvesterMemory,
      say: () => OK
    });
    const creep2 = mockInstanceOf<Creep>({
      name: 'second',
      memory: harvesterMemory,
      say: () => OK
    });
    Game.creeps[creep1.name] = creep1;
    Memory.creeps[creep1.name] = harvesterMemory;
    Game.creeps[creep2.name] = creep2;
    Memory.creeps[creep2.name] = harvesterMemory;

    CreepManager();

    expect(spawn.spawnCreep).toBeCalledWith([MOVE, WORK, CARRY], anything(), {
      memory: {
        param: {},
        role: CreepRole.UPGRADER,
        room: room.name
      }
    });
  });

  it('should create higher level of harvester when energy available', () => {
    const mocks = mockAll({
      energyAvailable: 500
    });
    const spawn = mocks.spawnMock;
    const room = mocks.roomMock;

    CreepManager();

    expect(spawn.spawnCreep).toBeCalledWith([MOVE, MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY], anything(), {
      memory: {
        param: {},
        role: CreepRole.HARVESTER,
        room: room.name
      }
    })
  });
});

function mockAll(roomProps: any = {}, spawnProps: any = {}, gameProps: any = {}, memoryProps: any = {}) {
  const roomMock = mockInstanceOf<Room>(_.merge({
    name: 'W1R1',
  }, roomProps));
  const spawnMock = mockInstanceOf<StructureSpawn>(_.merge({
    name: 'spawn',
    spawning: undefined,
    room: roomMock,
    spawnCreep: () => {
      // @ts-ignore
      spawnMock.spawning = {name: ''};
      return OK;
    }
  }, spawnProps));
  mockGlobal<Game>('Game', _.merge({
    creeps: {
      length: undefined
    },
    rooms: {W1R1: roomMock},
    time: 1,
    spawns: {
      spawn: spawnMock
    }
  }, gameProps));
  mockGlobal<Memory>('Memory', _.merge({
    creeps: {}
  }, memoryProps));
  return {roomMock, spawnMock}
}

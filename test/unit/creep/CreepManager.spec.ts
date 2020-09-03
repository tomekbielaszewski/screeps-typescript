import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {CreepManager, CreepRole} from "../../../src/creep/CreepManager";
import {UpgraderState} from "../../../src/creep/roles/Upgrader";
import anything = jasmine.anything;

describe("Creep manager", () => {

  it("", () => {
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
    })
  });

});

function mockAll(roomProps: any = {}, creepMemoryProps: any = {}, creepProps: any = {}, creepPosProps: any = {},
                 gameProps: any = {}, memoryProps: any = {}) {
  const roomMock = mockInstanceOf<Room>(_.assign({
    name: 'W1R1',
  }, roomProps));
  const spawnMock = mockInstanceOf<StructureSpawn>({
    name: 'spawn',
    spawning: undefined,
    room: roomMock,
    spawnCreep: () => {
      // @ts-ignore
      spawnMock.spawning = {name: ''};
      return OK;
    }
  });
  const creepMemory = _.assign({
    role: CreepRole.UPGRADER,
    room: roomMock.name,
    state: UpgraderState.REFILLING,
    param: {}
  }, creepMemoryProps) as CreepMemory;
  const creepPos = mockInstanceOf<RoomPosition>(_.assign({
    x: 0,
    y: 0,
    roomName: creepMemory.room,
  }, creepPosProps));
  const creep = mockInstanceOf<Creep>(_.assign({
    name: 'myHero',
    pos: creepPos,
    room: roomMock,
    memory: creepMemory,
    say: () => OK
  }, creepProps));
  mockGlobal<Game>('Game', _.assign({
    creeps: {
      myHero: creep,
      length: undefined
    },
    rooms: {W1R1: roomMock},
    time: 1,
    spawns: {
      spawn: spawnMock
    }
  }, gameProps));
  mockGlobal<Memory>('Memory', _.assign({
    creeps: {
      myHero: creepMemory
    }
  }, memoryProps));
  return {spawnMock, roomMock, creepMemory, creep}
}

import {mockInstanceOf} from 'screeps-jest';
import {CreepRole} from "../../../../src/creep/CreepManager";
import {mockGlobal} from "screeps-jest/index";
import {UpgraderJob, UpgraderState} from "../../../../src/creep/roles/Upgrader";


describe("Upgrader role", () => {

  it("should refill creep when just created it (no internal state set)", () => {
    const container = mockInstanceOf<StructureContainer>({
      id: 'containerId' as Id<StructureContainer>,
      store: {getUsedCapacity: () => 100},
      structureType: STRUCTURE_CONTAINER
    });
    const mocks = mockAll(
      {
        find: (finder: FindConstant) => finder === FIND_MY_STRUCTURES ? container : []
      },
      {
        state: undefined,
        param: {
          E: undefined
        }
      },
      {
        store: {
          getFreeCapacity: () => 50,
          energy: 0
        }
      },
      {
        findClosestByPath: () => container
      },
      {
        getObjectById: () => container
      },
      {}
    );
    const creep = mocks.creep;

    UpgraderJob(creep);

    expect(creep.withdraw).toBeCalledWith(container, RESOURCE_ENERGY);
    expect(creep.pickup).not.toBeCalled();
    expect(creep.harvest).not.toBeCalled();
    expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
  });

});

function mockAll(roomProps: any = {}, creepMemoryProps: any = {}, creepProps: any = {}, creepPosProps: any = {},
                 gameProps: any = {}, memoryProps: any = {}) {
  const roomMock = mockInstanceOf<Room>(_.assign({
    name: 'W1R1',
  }, roomProps));
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
    say: () => OK,
    withdraw: () => OK,
    pickup: () => OK,
    harvest: () => OK
  }, creepProps));
  mockGlobal<Game>('Game', _.assign({
    creeps: {myHero: creep},
    rooms: {W1R1: roomMock},
    time: 1,
  }, gameProps));
  mockGlobal<Memory>('Memory', _.assign({
    creeps: {
      myHero: creepMemory
    }
  }, memoryProps));
  return {roomMock, creepMemory, creep}
}

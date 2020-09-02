import {mockInstanceOf} from 'screeps-jest';
import {CreepRole} from '../../../../src/creep/CreepManager';
import {mockGlobal} from "screeps-jest/index";
import {UpgraderJob, UpgraderState} from '../../../../src/creep/roles/Upgrader';

const freshCreepMemory = {
  state: undefined,
  param: {
    E: undefined
  }
}

const emptyStore = {
  getCapacity: () => 50,
  getUsedCapacity: () => 0,
  getFreeCapacity: () => 50,
  energy: 0
}

const fullStore = {
  getCapacity: () => 50,
  getUsedCapacity: () => 50,
  getFreeCapacity: () => 0,
  energy: 50
}

describe('Upgrader role', () => {

  describe('When the creep has just be spawned so no memory is set', () => {
    it('should refill creep using container', () => {
      const container = mockInstanceOf<StructureContainer>({
        id: 'containerId' as Id<StructureContainer>,
        store: fullStore,
        structureType: STRUCTURE_CONTAINER
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_MY_STRUCTURES ? [container] : [] },
        freshCreepMemory,
        {
          withdraw: () => OK,
          pickup: () => OK,
          harvest: () => OK,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => container },
        { getObjectById: () => container },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).toBeCalledWith(container, RESOURCE_ENERGY);
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).not.toBeCalled();
      expect(creep.harvest).not.toBeCalled();
      expect(creep.moveTo).not.toBeCalled();
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: container.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "withdraw"}));
    });

    it('should move to container to refill creep', () => {
      const container = mockInstanceOf<StructureContainer>({
        id: 'containerId' as Id<StructureContainer>,
        store: fullStore,
        structureType: STRUCTURE_CONTAINER
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_MY_STRUCTURES ? [container] : [] },
        freshCreepMemory,
        {
          withdraw: () => ERR_NOT_IN_RANGE,
          pickup: () => OK,
          harvest: () => OK,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => container },
        { getObjectById: () => container },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).toBeCalled();
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).not.toBeCalled();
      expect(creep.harvest).not.toBeCalled();
      expect(creep.moveTo).toBeCalledWith(container, expect.anything())
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: container.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "withdraw"}));
    });

    it('should refill creep using storage', () => {
      const storage = mockInstanceOf<StructureStorage>({
        id: 'storageId' as Id<StructureStorage>,
        store: fullStore,
        structureType: STRUCTURE_STORAGE
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_MY_STRUCTURES ? [storage] : [] },
        freshCreepMemory,
        {
          withdraw: () => OK,
          pickup: () => OK,
          harvest: () => OK,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => storage },
        { getObjectById: () => storage },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).toBeCalledWith(storage, RESOURCE_ENERGY);
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).not.toBeCalled();
      expect(creep.harvest).not.toBeCalled();
      expect(creep.moveTo).not.toBeCalled();
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: storage.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "withdraw"}));
    });

    it('should move to storage to refill creep', () => {
      const storage = mockInstanceOf<StructureStorage>({
        id: 'storageId' as Id<StructureStorage>,
        store: fullStore,
        structureType: STRUCTURE_STORAGE
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_MY_STRUCTURES ? [storage] : [] },
        freshCreepMemory,
        {
          withdraw: () => ERR_NOT_IN_RANGE,
          pickup: () => OK,
          harvest: () => OK,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => storage },
        { getObjectById: () => storage },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).toBeCalled();
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).not.toBeCalled();
      expect(creep.harvest).not.toBeCalled();
      expect(creep.moveTo).toBeCalledWith(storage, expect.anything())
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: storage.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "withdraw"}));
    });

    it('should refill creep using dropped resources', () => {
      const droppedResources = mockInstanceOf<Resource>({
        id: 'resourcesId' as Id<Resource>,
        amount: 50,
        resourceType: RESOURCE_ENERGY,
        length: undefined // lodash looking for this but Jest does not allow undefined access on mocks
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_DROPPED_RESOURCES ? [droppedResources] : [] },
        freshCreepMemory,
        {
          withdraw: () => OK,
          pickup: () => OK,
          harvest: () => OK,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => droppedResources },
        { getObjectById: () => droppedResources },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).not.toBeCalled();
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).toBeCalled();
      expect(creep.harvest).not.toBeCalled();
      expect(creep.moveTo).not.toBeCalled();
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: droppedResources.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "pickup"}));
    });

    it('should move to dropped resources to refill creep', () => {
      const droppedResources = mockInstanceOf<Resource>({
        id: 'resourcesId' as Id<Resource>,
        amount: 50,
        resourceType: RESOURCE_ENERGY,
        length: undefined // lodash looking for this but Jest does not allow undefined access on mocks
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_DROPPED_RESOURCES ? [droppedResources] : [] },
        freshCreepMemory,
        {
          withdraw: () => OK,
          pickup: () => ERR_NOT_IN_RANGE,
          harvest: () => OK,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => droppedResources },
        { getObjectById: () => droppedResources },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).not.toBeCalled();
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).toBeCalled();
      expect(creep.harvest).not.toBeCalled();
      expect(creep.moveTo).toBeCalledWith(droppedResources, expect.anything());
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: droppedResources.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "pickup"}));
    });

    it('should refill creep using source', () => {
      const source = mockInstanceOf<Source>({
        id: 'sourceId' as Id<Source>,
        energy: 50,
        length: undefined // lodash looking for this but Jest does not allow undefined access on mocks
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_SOURCES ? [source] : [] },
        freshCreepMemory,
        {
          withdraw: () => OK,
          pickup: () => OK,
          harvest: () => OK,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => source },
        { getObjectById: () => source },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).not.toBeCalled();
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).not.toBeCalled();
      expect(creep.harvest).toBeCalled();
      expect(creep.moveTo).not.toBeCalled();
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: source.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "harvest"}));
    });

    it('should move to source to refill creep', () => {
      const source = mockInstanceOf<Source>({
        id: 'sourceId' as Id<Source>,
        energy: 50,
        length: undefined // lodash looking for this but Jest does not allow undefined access on mocks
      });
      const mocks = mockAll(
        { find: (finder: FindConstant) => finder === FIND_SOURCES ? [source] : [] },
        freshCreepMemory,
        {
          withdraw: () => OK,
          pickup: () => OK,
          harvest: () => ERR_NOT_IN_RANGE,
          moveTo: () => OK,
          store: emptyStore
        },
        { findClosestByPath: () => source },
        { getObjectById: () => source },
        {}
      );
      const creep = mocks.creep;

      UpgraderJob(creep);

      expect(creep.withdraw).not.toBeCalled();
      expect(creep.say).toBeCalledWith('🌾');
      expect(creep.pickup).not.toBeCalled();
      expect(creep.harvest).toBeCalled();
      expect(creep.moveTo).toBeCalledWith(source, expect.anything());
      expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
      expect(creep.memory.param.E).toEqual(expect.objectContaining({id: source.id}));
      expect(creep.memory.param.E).toEqual(expect.objectContaining({take: "harvest"}));
    });
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
    say: () => OK
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

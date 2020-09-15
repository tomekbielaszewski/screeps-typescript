import {mockGlobal, mockInstanceOf} from "screeps-jest/src/mocking";
import {refill} from "../../../../src/creep/states/Refilling";
import {IdleState, MovingState} from "../../../../src/creep/states/CreepState";
import {CreepRole} from "../../../../src/creep/CreepManager";

const EMPTY_STORE = mockInstanceOf<StoreDefinition>({
  getUsedCapacity: () => 0,
  getFreeCapacity: () => 50,
  getCapacity: () => 50
})
const FULL_STORE = mockInstanceOf<StoreDefinition>({
  getUsedCapacity: () => 50,
  getFreeCapacity: () => 0,
  getCapacity: () => 50
})

describe('Refilling state', () => {
  it('resolves state when creep is full', () => {
    const creep = mockInstanceOf<Creep>({
      store: FULL_STORE,
      memory: {
        state: undefined
      }
    });

    refill(creep, {nextState: IdleState});

    expect(creep.memory.state).toEqual(IdleState)
  });

  it('withdraws from storage when in range and has no assigned container', () => {
    const storage = mockInstanceOf<StructureStorage>({})
    const creep = mockInstanceOf<Creep>({
      store: EMPTY_STORE,
      memory: {
        container: undefined,
        targetPos: undefined
      },
      pos: {
        findClosestByRange: () => storage
      },
      withdraw: () => OK
    });

    refill(creep, {nextState: IdleState});

    expect(creep.withdraw).toBeCalledWith(storage, RESOURCE_ENERGY);
    expect(creep.memory.targetPos).toBeUndefined();
    expect(creep.memory.state).toEqual(IdleState);
  });

  it('withdraws from storage when in range and has assigned empty container', () => {
    const containerMock = mockInstanceOf<StructureContainer>({
      store: EMPTY_STORE
    });
    const storage = mockInstanceOf<StructureStorage>({});
    const creep = mockInstanceOf<Creep>({
      store: EMPTY_STORE,
      memory: {
        role: CreepRole.HARVESTER,
        room: "room",
        container: "containerId" as Id<StructureContainer>,
        targetPos: undefined
      } as CreepMemory,
      pos: {
        findClosestByRange: () => storage
      },
      withdraw: () => OK
    });
    mockGlobal<Game>('Game', {
      getObjectById: () => containerMock
    });

    refill(creep, {nextState: IdleState});

    expect(creep.withdraw).toBeCalledWith(storage, RESOURCE_ENERGY);
    expect(creep.memory.targetPos).toBeUndefined();
    expect(creep.memory.state).toEqual(IdleState);
  });

  it('withdraws from container when its not empty', () => {
    const containerMock = mockInstanceOf<StructureContainer>({
      store: FULL_STORE
    });
    const creep = mockInstanceOf<Creep>({
      store: EMPTY_STORE,
      memory: {
        role: CreepRole.HARVESTER,
        room: "room",
        container: "containerId" as Id<StructureContainer>,
        targetPos: undefined
      } as CreepMemory,
      withdraw: () => OK
    });
    mockGlobal<Game>('Game', {
      getObjectById: () => containerMock
    });

    refill(creep, {nextState: IdleState});

    expect(creep.withdraw).toBeCalledWith(containerMock, RESOURCE_ENERGY);
    expect(creep.memory.targetPos).toBeUndefined();
    expect(creep.memory.state).toEqual(IdleState);
  });

  it('goes to container when out of reach', () => {
    const containerMock = mockInstanceOf<StructureContainer>({
      store: FULL_STORE,
      pos: {x: 1, y: 1, roomName: 'room'}
    });
    const creep = mockInstanceOf<Creep>({
      store: EMPTY_STORE,
      memory: {
        role: CreepRole.HARVESTER,
        room: "room",
        container: "containerId" as Id<StructureContainer>,
        targetPos: undefined
      } as CreepMemory,
      withdraw: () => ERR_NOT_IN_RANGE,
      say: () => OK
    });
    mockGlobal<Game>('Game', {
      getObjectById: () => containerMock
    });

    refill(creep, {nextState: IdleState});

    expect(creep.withdraw).toBeCalledWith(containerMock, RESOURCE_ENERGY);
    expect(creep.memory.targetPos).toEqual({x: 1, y: 1, room: 'room'});
    expect(creep.memory.state).toEqual(MovingState)
  });

  it('goes to storage when out of reach', () => {
    const containerMock = mockInstanceOf<StructureContainer>({
      store: EMPTY_STORE
    });
    const storage = mockInstanceOf<StructureStorage>({
      pos: {x: 1, y: 1, roomName: 'room'}
    });
    const creep = mockInstanceOf<Creep>({
      store: EMPTY_STORE,
      memory: {
        role: CreepRole.HARVESTER,
        room: "room",
        container: "containerId" as Id<StructureContainer>,
        targetPos: undefined
      } as CreepMemory,
      pos: {
        findClosestByRange: () => storage
      },
      withdraw: () => ERR_NOT_IN_RANGE,
      say: () => OK
    });
    mockGlobal<Game>('Game', {
      getObjectById: () => containerMock
    });

    refill(creep, {nextState: IdleState});

    expect(creep.withdraw).toBeCalledWith(storage, RESOURCE_ENERGY);
    expect(creep.memory.targetPos).toEqual({x: 1, y: 1, room: 'room'});
    expect(creep.memory.state).toEqual(MovingState)
  });
})

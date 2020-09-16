import {HarvesterJob} from "../../../../src/creep/roles/Harvester";
import {mockGlobal, mockInstanceOf} from "screeps-jest/index";
import {HarvestingState, MovingState, SpawningState} from "../../../../src/creep/states/CreepState";
import anything = jasmine.anything;
import objectContaining = jasmine.objectContaining;
import ObjectContaining = jasmine.ObjectContaining;

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

describe('Harvester role', () => {
  it('should do nothing when spawning', () => {
    const creepMemory = {
      state: undefined,
      lastState: undefined,
    } as CreepMemory;
    const creep = mockInstanceOf<Creep>({
      name: 'myCreep',
      memory: creepMemory,
      spawning: true,
      harvest: () => OK,
      moveTo: () => OK,
      transfer: () => OK,
    });

    HarvesterJob(creep);

    expect(creep.memory.state).toEqual(SpawningState);
    expect(creep.harvest).not.toBeCalled();
    expect(creep.moveTo).not.toBeCalled();
  });

  it('should attempt to harvest found source when not spawning anymore', () => {
    const creepMemory = {
      state: undefined,
      lastState: undefined,
      source: "sourceId",
    } as CreepMemory;
    const creep = mockInstanceOf<Creep>({
      name: 'myCreep',
      memory: creepMemory,
      spawning: false,
      store: EMPTY_STORE,
      harvest: () => OK,
      moveTo: () => OK,
      transfer: () => OK,
    });
    const source = mockInstanceOf<Source>({
      id: "sourceId" as Id<Source>,
      energy: 10,
    });
    mockGlobal<Game>('Game', {
      time: 1,
      creeps: {myHero: creep},
      getObjectById: () => source,
    });

    HarvesterJob(creep);

    expect(creep.memory.state).toEqual(HarvestingState);
    expect(creep.harvest).toBeCalledWith(source);
    expect(creep.moveTo).not.toBeCalled();
  });

  it('should go to source when out of reach', () => {
    const creepMemory = {
      state: undefined,
      lastState: undefined,
      targetPos: undefined,
      source: "sourceId",
      param: {},
    } as CreepMemory;
    const creep = mockInstanceOf<Creep>({
      name: 'myCreep',
      memory: creepMemory,
      spawning: false,
      store: EMPTY_STORE,
      harvest: () => ERR_NOT_IN_RANGE,
      moveTo: () => OK,
      transfer: () => OK,
      say: () => OK,
      pos: {x: 0, y: 0, roomName: 'room', getRangeTo: () => 10}
    });
    const sourcePos = new RoomPosition(10, 0, 'room');
    const source = mockInstanceOf<Source>({
      id: "sourceId" as Id<Source>,
      energy: 10,
      pos: sourcePos
    });
    mockGlobal<Game>('Game', {
      time: 1,
      creeps: {myHero: creep},
      getObjectById: () => source,
    });

    HarvesterJob(creep);

    expect(creep.memory.state).toEqual(MovingState);
    expect(creep.harvest).toBeCalledWith(source);
    expect(creep.say).toBeCalledWith("🥾");
    expect(creep.pos.getRangeTo).toBeCalled();
    expect(creep.moveTo).toBeCalledWith(roomPosition(sourcePos), anything());
    expect(creep.memory.targetPos).toEqual(targetPos(sourcePos));
  });

  it('should transfer energy to storage when creep full', () => {
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
    });
    const store = {
      energy: 50,
      getFreeCapacity: () => store.getCapacity() - store.energy,
      getCapacity: () => 50,
      getUsedCapacity: () => store.energy
    } as StoreDefinition;
    const creep = mockInstanceOf<Creep>({
      name: 'myCreep',
      memory: creepMemory,
      room,
      spawning: false,
      store,
      say: () => OK,
      transfer: () => {
        store.energy = 0
        return OK;
      },
    });
    mockGlobal<Game>('Game', {
      time: 1,
      creeps: {myHero: creep},
      getObjectById: () => spawn,
    });

    HarvesterJob(creep);

    expect(creep.transfer).toBeCalledWith(spawn, RESOURCE_ENERGY);
    expect(creep.memory.state).toEqual(HarvestingState);
  });

  it('should move to storage when creep full and storage out of reach', () => {
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

    HarvesterJob(creep);

    expect(creep.memory.state).toEqual(MovingState);
    expect(creep.transfer).toBeCalledWith(spawn, RESOURCE_ENERGY);
    expect(creep.say).toBeCalledWith("🥾");
    expect(creep.memory.targetPos).toEqual(targetPos(spawnPos));
    expect(creep.pos.getRangeTo).toBeCalledWith(roomPosition(spawnPos));
    expect(creep.moveTo).toBeCalledWith(roomPosition(spawnPos), anything());
  });
})

function roomPosition(pos: RoomPosition): ObjectContaining {
  return objectContaining({x: pos.x, y: pos.y, roomName: pos.roomName});
}

function targetPos(pos: RoomPosition): ObjectContaining {
  return objectContaining({x: pos.x, y: pos.y, room: pos.roomName});
}

import {HarvesterJob} from "../../../../src/creep/roles/Harvester";
import {mockGlobal, mockInstanceOf} from "screeps-jest/index";
import {HarvestingState, SpawningState} from "../../../../src/creep/states/CreepState";

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
      state: undefined
    } as CreepMemory;
    const creep = mockInstanceOf<Creep>({
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
      source: "sourceId",
    } as CreepMemory;
    const creep = mockInstanceOf<Creep>({
      memory: creepMemory,
      spawning: false,
      store: EMPTY_STORE,
      harvest: () => OK,
      moveTo: () => OK,
      transfer: () => OK,
    });
    const source = mockInstanceOf<Source>();
    mockGlobal<Game>('Game', {
      creeps: {myHero: creep},
      getObjectById: () => source,
    });

    HarvesterJob(creep);

    expect(creep.memory.state).toEqual(HarvestingState);
    expect(creep.harvest).toBeCalledWith(source);
    expect(creep.moveTo).not.toBeCalled();
  });
})

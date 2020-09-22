import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {loop, unwrappedLoop} from "../../src/main";
import {CreepManager} from "../../src/creep/CreepManager";
import {CreepWorker} from "../../src/creep/Worker";

mockGlobal<Memory>('Memory', {log: {state: undefined}}, true);


jest.mock("creep/CreepManager");
jest.mock("creep/Worker");
jest.mock("utils/StatPublisher");
jest.mock("utils/PixelGenerator");
jest.mock("utils/MemoryCleaner");
jest.mock("utils/CLI");

describe("main", () => {

  it("should export a loop function", () => {
    expect(loop).toBeDefined();
    mockGlobal<Memory>('Memory', {}, true);
    expect(typeof loop === "function").toBeTruthy();
  });

  it("should execute creep manager and worker", () => {
    mockGlobal<Game>('Game', {
      creeps: {},
      rooms: {},
      cpu: {
        getUsed: () => 0
      },
      time: 1
    });
    mockGlobal<Memory>('Memory', {
      creeps: {},
      mainComponentsTime: {}
    }, true);
    unwrappedLoop();
    expect(CreepManager).toBeCalled();
    expect(CreepWorker).toBeCalled();
  });

  it("should remove dead creeps from memory", () => {
    const creep = mockInstanceOf<Creep>({name: 'name', memory: {}});

    mockGlobal<Game>('Game', {
      creeps: {name: creep},
      rooms: {},
      cpu: {
        getUsed: () => 0
      },
      time: 1
    });
    mockGlobal<Memory>('Memory', {
      creeps: {
        unknown1: {},
        unknown2: {},
        name: {}
      },
      mainComponentsTime: {}
    }, true);
    unwrappedLoop();

    // expect(Memory.creeps.unknown1).toBeUndefined();
    // expect(Memory.creeps.unknown2).toBeUndefined();
    expect(Memory.creeps.name).toBeDefined();
  });
});

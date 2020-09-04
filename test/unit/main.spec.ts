import {mockGlobal, mockInstanceOf} from 'screeps-jest';
import {loop, unwrappedLoop} from "../../src/main";
import {CreepManager} from "../../src/creep/CreepManager";
import {CreepWorker} from "../../src/creep/Worker";

jest.mock("creep/CreepManager");
jest.mock("creep/Worker");
jest.mock("utils/StatPublisher");
jest.mock("utils/PixelGenerator");

describe("main", () => {

  it("should export a loop function", () => {
    expect(loop).toBeDefined();
    expect(typeof loop === "function").toBeTruthy();
  });

  it("should execute creep manager and worker", () => {
    mockGlobal<Game>('Game', {
      creeps: {},
      rooms: {},
      time: 1
    });
    mockGlobal<Memory>('Memory', {creeps: {}});
    unwrappedLoop();
    expect(CreepManager).toBeCalled();
    expect(CreepWorker).toBeCalled();
  });

  it("should remove dead creeps from memory", () => {
    const creep = mockInstanceOf<Creep>({name: 'name', memory: {}});

    mockGlobal<Game>('Game', {
      creeps: {name: creep},
      rooms: {},
      time: 1
    });
    mockGlobal<Memory>('Memory', {
      creeps: {
        unknown1: {},
        unknown2: {},
        name: {}
      }
    }, true);
    unwrappedLoop();

    expect(Memory.creeps.unknown1).toBeUndefined();
    expect(Memory.creeps.unknown2).toBeUndefined();
    expect(Memory.creeps.name).toBeDefined();
  });
});

import {ErrorMapper} from "utils/ErrorMapper";
import {CreepManager} from "creep/CreepManager";
import {CreepWorker} from "creep/Worker";
import * as Profiler from "./profiler/Profiler";
import {StatPublisher} from "utils/StatPublisher";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// global.__PROFILER_ENABLED__ = true

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// global.Profiler = Profiler.init();

function unwrappedLoop() {
  CreepManager();
  CreepWorker();

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  StatPublisher();
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
const loop = ErrorMapper.wrapLoop(unwrappedLoop);

export {
  loop,
  unwrappedLoop
};

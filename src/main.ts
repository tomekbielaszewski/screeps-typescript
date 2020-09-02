import {ErrorMapper} from "utils/ErrorMapper";
import {CreepManager} from "creep/CreepManager";
import {CreepWorker} from "creep/Worker";

function unwrappedLoop() {
  CreepManager();
  CreepWorker();

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
const loop = ErrorMapper.wrapLoop(unwrappedLoop);

export {
  loop,
  unwrappedLoop
};

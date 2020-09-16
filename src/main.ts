import {ErrorMapper} from "utils/ErrorMapper";
import {CreepManager} from "creep/CreepManager";
import {CreepWorker} from "creep/Worker";
import {StatPublisher} from "utils/StatPublisher";
import {PixelGenerator} from "utils/PixelGenerator";
import {CleanMemory} from "utils/MemoryCleaner";
import {cli} from "utils/CLI";
import {measure} from "utils/Profiler";

global.legacy = false;
global.cli = cli();

function unwrappedLoop(): void {
  measure(CreepManager, "CreepManager");
  measure(CreepWorker, "CreepWorker");
  measure(CleanMemory, "CleanMemory");
  measure(PixelGenerator, "PixelGenerator");
  measure(StatPublisher, "StatPublisher");
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

const loop = ErrorMapper.wrapLoop(unwrappedLoop);

export {
  loop,
  unwrappedLoop
};

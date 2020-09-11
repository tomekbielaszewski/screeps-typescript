import {ErrorMapper} from "utils/ErrorMapper";
import {CreepManager} from "creep/CreepManager";
import {CreepWorker} from "creep/Worker";
import {StatPublisher} from "utils/StatPublisher";
import {PixelGenerator} from "utils/PixelGenerator";

global.legacy = false;

function unwrappedLoop(): void {
  measure(CreepManager, "CreepManager");
  measure(CreepWorker, "CreepWorker");
  measure(RecycleDead, "RecycleDead");
  measure(PixelGenerator, "PixelGenerator");
  measure(StatPublisher, "StatPublisher");
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

const loop = ErrorMapper.wrapLoop(unwrappedLoop);

function measure(fn: () => void, name: string): void {
  const start = Game.cpu.getUsed();
  fn();
  const end = Game.cpu.getUsed();
  Memory.mainComponentsTime[name] = end - start;
}

function RecycleDead() {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
}

export {
  loop,
  unwrappedLoop
};

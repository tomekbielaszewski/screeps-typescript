import {ErrorMapper} from "utils/ErrorMapper";
import {CreepManager} from "creep/CreepManager";
import {CreepWorker} from "creep/Worker";
import {StatPublisher} from "utils/StatPublisher";
import {PixelGenerator} from "utils/PixelGenerator";
import {CleanMemory} from "utils/MemoryCleaner";
import {measure} from "utils/Profiler";
import {GlobalsInitialization} from "utils/GlobalsInitialization";
import {defendRoom} from "utils/RoomDefense";
import {LinkOperator} from "./creep/management/LinkOperator";

GlobalsInitialization()

function unwrappedLoop(): void {
  Object.values(Game.rooms)
    .forEach(room => {
      measure(() => defendRoom(room), `${room.name}.tower`)
      measure(() => LinkOperator(room), `${room.name}.LinkOperator`)
    });

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

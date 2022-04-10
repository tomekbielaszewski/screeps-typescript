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
import MemHack from "utils/MemHack";
import {RoomsPlanner} from "creep/management/buildings/BuildingPlanner"
import {MultimeterWatcher} from "utils/WatchClient";
import {cli} from "./utils/CLI";

GlobalsInitialization()

const roomPlanner = new RoomsPlanner()

function unwrappedLoop(): void {
  MemHack.pretick()

  Object.values(Game.rooms)
    .forEach(room => {
      measure(() => defendRoom(room), `${room.name}.tower`)
      measure(() => LinkOperator(room), `${room.name}.LinkOperator`)
    });

  measure(CreepManager, "CreepManager")
  measure(CreepWorker, "CreepWorker")
  measure(CleanMemory, "CleanMemory")
  measure(PixelGenerator, "PixelGenerator")
  measure(StatPublisher, "StatPublisher")
  measure(roomPlanner.runOnAllRooms.bind(roomPlanner), "RoomPlanner")
  measure(MultimeterWatcher, "MultimeterWatcher")

  if(Game.time % 10 === 0 &&
    Game.rooms.W24N13.terminal &&
    Game.rooms.W24N13.terminal.cooldown === 0 &&
    Game.rooms.W24N13.terminal.store.energy > 20000
  ) {
    console.log(cli.sellEnergy(10000, "W24N13", 1.5))
  }
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

const loop = ErrorMapper.wrapLoop(unwrappedLoop);

export {
  loop,
  unwrappedLoop
};

import { ErrorMapper } from "utils/ErrorMapper";
import { CreepManager } from "creep/CreepManager";
import { CreepWorker } from "creep/Worker";
import { StatPublisher } from "utils/StatPublisher";
import { PixelGenerator } from "utils/PixelGenerator";
import { CleanMemory } from "utils/MemoryCleaner";
import { measure } from "utils/Profiler";
import { GlobalsInitialization, RoomMemoryInitialization } from "utils/GlobalsInitialization";
import { defendRoom } from "utils/RoomDefense";
import { LinkOperator } from "./creep/management/LinkOperator";
import MemHack from "utils/MemHack";
import { RoomPlanner } from "creep/management/buildings/BuildingPlanner"

GlobalsInitialization()

function unwrappedLoop(): void {
  MemHack.pretick()

  Object.values(Game.rooms)
    .forEach(room => {
      RoomMemoryInitialization(room)
      measure(() => defendRoom(room), `${room.name}.tower`)
      measure(() => LinkOperator(room), `${room.name}.LinkOperator`)
      measure(() => {
        const roomPlanner = new RoomPlanner()
        let bunkerPos = roomPlanner.findPlaceForBunker(room)
        let layout = roomPlanner.setupBuildingsLayout(bunkerPos)

        const opacity = 0.3
        for (const b of layout) {
          room.visual.text(b.type[0], b.pos.x, b.pos.y, { opacity })
        }
      }, `${room.name}.RoomPlanner`)
    });

  measure(CreepManager, "CreepManager")
  measure(CreepWorker, "CreepWorker")
  measure(CleanMemory, "CleanMemory")
  measure(PixelGenerator, "PixelGenerator")
  measure(StatPublisher, "StatPublisher")
}

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code

const loop = ErrorMapper.wrapLoop(unwrappedLoop);

export {
  loop,
  unwrappedLoop
};

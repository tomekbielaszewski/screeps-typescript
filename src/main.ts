import {ErrorMapper} from "utils/ErrorMapper";
import {CreepManager} from "creep/CreepManager";
import {CreepWorker} from "creep/Worker";
import {StatPublisher} from "utils/StatPublisher";
import {PixelGenerator} from "utils/PixelGenerator";
import {CleanMemory} from "utils/MemoryCleaner";
import {cli} from "utils/CLI";
import {measure} from "utils/Profiler";

global.legacy = false;
global.cli = cli;

Memory.features = Memory.features || {}
Memory.repair = Memory.repair || {}
Memory.containers = Memory.containers || {}
Memory.log = Memory.log || {}

function unwrappedLoop(): void {

  function defendRoom(roomName: string) {
    const hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
      const towers = Game.rooms[roomName].find<StructureTower>(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
      towers.forEach(tower => tower.attack(hostiles[0]));
    }
  }

  defendRoom('W24N13');

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

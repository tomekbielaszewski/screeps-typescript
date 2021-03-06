import {
  BuildingState,
  DockingState,
  HarvestingState,
  IdleState,
  MovingState,
  RepairingState,
  resolveAndReplay,
  resolveLastStateAndReplay,
  SpawningState,
  StoringState
} from "./runner/common/CreepState"
import {harvest, HarvestingResult} from "./runner/common/HarvestingEnergy"
import {move, MovingResult, toTarget} from "./runner/common/Moving"
import {SerializablePosition, SerializableRoomObject} from "../../utils/Serializables"
import {building, BuildingResult} from "./runner/common/Building"
import {storeEnergy, StoringResult} from "./runner/common/StoringEnergy"
import {repairing, RepairingResult} from "./runner/common/Repairing"
import {docking, DockingResult} from "./runner/miner/Docking"
import {getLogger} from "../../utils/Logger";

const JOB_NAME = 'MinerJob'

export function MinerJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep)
      break
    case DockingState:
      runDockingState(creep)
      break
    case MovingState:
      runMovingState(creep)
      break
    case BuildingState:
      runBuildingState(creep)
      break
    case HarvestingState:
      runHarvestingState(creep)
      break
    case StoringState:
      runStoringState(creep)
      break
    case RepairingState:
      runRepairingState(creep)
      break
    case IdleState:
      runIdleState(creep)
      break
  }
}

function runIdleState(creep: Creep) {
  if (!creep.memory.source) throw new Error('No source available for Miner')
  const source = SerializableRoomObject.clone(creep.memory.source).get() as Source
  if (!source) throw new Error('No source available for Miner')

  if (source.energy > 0) {
    resolveAndReplay(creep, {nextState: HarvestingState, replay: MinerJob})
    return
  }
  creep.say('🚬')
}

function runRepairingState(creep: Creep) {
  creep.memory.repair = creep.memory.container
  const repairingResult = repairing(creep, false)
  getLogger(JOB_NAME).log(`[${creep.name}] repairingResult: ${repairingResult}`)

  switch (repairingResult) {
    case RepairingResult.CreepStoreEmpty: //dont harvest since source should be empty now
    case RepairingResult.NothingToRepair:
    case RepairingResult.StructureRepaired:
    case RepairingResult.CouldNotRepair:
      resolveAndReplay(creep, {nextState: IdleState, replay: MinerJob})
      break
    case RepairingResult.StructureNoLongerExists:
    case RepairingResult.OutOfRange: // how the hell did that happen?
      resolveAndReplay(creep, {nextState: DockingState, replay: MinerJob})
      break
    case RepairingResult.Working:
      break
  }
}

function runStoringState(creep: Creep) {
  creep.memory.storage = creep.memory.container
  const storingStateResult = storeEnergy(creep)
  getLogger(JOB_NAME).log(`[${creep.name}] storingStateResult: ${storingStateResult}`)

  switch (storingStateResult) {
    case StoringResult.CreepStoreEmpty:
    case StoringResult.StoringFinished: //back to work
      resolveAndReplay(creep, {nextState: HarvestingState, replay: MinerJob})
      break
    case StoringResult.NoStorageSpaceAvailableInRoom: //ouh.. carriers cant keep up?
    case StoringResult.Storing:
    case StoringResult.AssignedStorageFull:
    case StoringResult.CouldNotTransfer:
      creep.say("😐")
      break
    case StoringResult.OutOfRange: //how the hell did that happen?
      resolveAndReplay(creep, {nextState: DockingState, replay: MinerJob})
      break

  }
}

function runBuildingState(creep: Creep) {
  const buildingResult = building(creep)
  getLogger(JOB_NAME).log(`[${creep.name}] buildingResult: ${buildingResult}`)

  switch (buildingResult) {
    case BuildingResult.Working: //chop chop
      break
    case BuildingResult.CreepStoreEmpty: //lets dig up some more of this tasty juice
      resolveAndReplay(creep, {nextState: HarvestingState, replay: MinerJob})
      break
    case BuildingResult.NoConstructionSite:
    case BuildingResult.ConstructionSiteNoLongerExist: //how the hell did that happen?
    case BuildingResult.OutOfRange:
      resolveAndReplay(creep, {nextState: DockingState, replay: MinerJob})
      break
  }
}

function runHarvestingState(creep: Creep) {
  const container = SerializableRoomObject.cloneNullable(creep.memory.container)?.get()
  const creepDocked = container && container.pos.isEqualTo(creep.pos)
  const harvestingResult = harvest(creep, !creepDocked, false)
  getLogger(JOB_NAME).log(`[${creep.name}] harvestingResult: ${harvestingResult}`)

  switch (harvestingResult) {
    case HarvestingResult.CouldNotFindSource:
      throw new Error('No source available for Miner')
    case HarvestingResult.CouldNotHarvest: //try again next tick
    case HarvestingResult.Harvesting: //then keep it up
      break
    case HarvestingResult.CreepStoreFull:
      if (creep.memory.container && SerializableRoomObject.clone(creep.memory.container).isVisible()) {
        resolveAndReplay(creep, {nextState: StoringState, replay: MinerJob})
      } else {
        resolveAndReplay(creep, {nextState: DockingState, replay: MinerJob})
      }
      break
    case HarvestingResult.SourceEmpty: //time for repairs
      resolveAndReplay(creep, {nextState: RepairingState, replay: MinerJob})
      break
    case HarvestingResult.OutOfRange: //how the hell did that happen?
      resolveAndReplay(creep, {nextState: DockingState, replay: MinerJob})
      break
  }
}

function runMovingState(creep: Creep) {
  const movingResult = move(creep)
  getLogger(JOB_NAME).log(`[${creep.name}] movingResult: ${movingResult}`)

  switch (movingResult) {
    case MovingResult.CouldNotMove: //do not advance to another state and see what happens
    case MovingResult.Moving: //so keep moving
      break
    case MovingResult.NoPath: //something blocking the path? wait to next tick and run again. In future good to have some traffic control here
      creep.say('🗺️🤔')
      break
    case MovingResult.NoTargetPositionSet:
      resolveLastStateAndReplay(creep, {replay: MinerJob})
      break
    case MovingResult.ReachedDestination:
      resolveLastStateAndReplay(creep, {replay: MinerJob})
      break
    case MovingResult.Tired:
      creep.say('😩')
      break
  }
}

function runDockingState(creep: Creep) {
  const dockingResult = docking(creep)
  getLogger(JOB_NAME).log(`[${creep.name}] dockingResult: ${dockingResult}`)

  switch (dockingResult) {
    case DockingResult.NO_SOURCE:
      throw new Error('Miner has no source set!')
    case DockingResult.SOURCE_OUT_OF_RANGE:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.source)?.get())
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
      break
    case DockingResult.DOCKED:
      resolveAndReplay(creep, {nextState: HarvestingState, replay: MinerJob})
      break
    case DockingResult.CONTAINER_OUT_OF_RANGE:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.container)?.get()),
        range: 0
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
      break
    case DockingResult.READY_TO_BUILD_CONTAINER:
      resolveAndReplay(creep, {nextState: BuildingState, replay: MinerJob})
      break
    case DockingResult.CONTAINER_CSITE_OUT_OF_RANGE:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.construction)?.get()),
        range: 0
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
      break
    case DockingResult.CONTAINER_CSITE_CREATED: //csite will be available next tik - replay this state
      break
  }
}

function initialize(creep: Creep) {
  if (creep.spawning) return
  if (!creep.memory.source) { //ouh.. it should've been set by spawn
    creep.memory.source = getAvailableSource(creep)
    if (!creep.memory.source) throw new Error('No source available for Miner')
  }
  resolveAndReplay(creep, {nextState: DockingState, replay: MinerJob})
}

//Game.spawns['Spawn1'].spawnCreep([WORK, WORK, WORK, WORK, CARRY, MOVE], 'TestMiner3', {memory: {role: 'Miner', source: {id:'eff307740862fd8', pos:{x:12,y:21,room:'W3N7'}}}})

function getAvailableSource(creep: Creep): SerializableRoomObject<Source> {
  return new SerializableRoomObject("" as Id<Source>, new SerializablePosition(1, 1, ""))
}

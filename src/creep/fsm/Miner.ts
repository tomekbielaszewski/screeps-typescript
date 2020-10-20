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
} from "../states/CreepState"
import {harvest, HarvestingResult} from "../states/HarvestingEnergy"
import {move, MovingResult, toTarget} from "../states/Moving"
import {SerializablePosition, SerializableRoomObject} from "../../utils/Serializables"
import {building, BuildingResult} from "../states/Building"
import {storeEnergy, StoringResult} from "../states/StoringEnergy"
import {repairing, RepairingResult} from "../states/Repairing"

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
  const source = creep.memory.source.get() as Source
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
  const harvestingResult = harvest(creep, false, false)
  switch (harvestingResult) {
    case HarvestingResult.CouldNotFindSource:
      throw new Error('No source available for Miner')
    case HarvestingResult.CouldNotHarvest: //try again next tick
    case HarvestingResult.Harvesting: //then keep it up
      break
    case HarvestingResult.CreepStoreFull:
      if (creep.memory.container && creep.memory.container.isVisible()) {
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
  if (!creep.memory.source) throw new Error('No source available for Miner')
  if (!creep.memory.source.isVisible() || //in case of source being in another room - lets walk to that room first
    creep.pos.getRangeTo(creep.memory.source.pos.toPos()) > 1) {
    creep.memory.move = {
      target: toTarget(creep.memory.source.get())
    }
    resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
    return
  }

  const source = creep.memory.source.get()
  if (!source) throw new Error('No source available for Miner')

  // when there is container already
  const containers = source.pos.findInRange(FIND_STRUCTURES, 1)
    .filter(s => s.structureType === STRUCTURE_CONTAINER)
  if (containers && containers.length) {
    const container = containers[0]

    if (container.pos === creep.pos) {
      creep.memory.container = SerializableRoomObject.from(container as StructureContainer)
      resolveAndReplay(creep, {nextState: HarvestingState, replay: MinerJob})
      return
    } else {
      creep.memory.move = {
        range: 0,
        target: toTarget(container)
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
      return
    }
  }

  // when there is no container but there is a CSite
  const containerCSites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1)
    .filter(cs => cs.structureType === STRUCTURE_CONTAINER)
  if (containerCSites && containerCSites.length) {
    const containerCSite = containerCSites[0]

    if (containerCSite.pos === creep.pos) {
      creep.memory.construction = SerializableRoomObject.from(containerCSite as ConstructionSite)
      resolveAndReplay(creep, {nextState: BuildingState, replay: MinerJob})
      return
    } else {
      creep.memory.move = {
        range: 0,
        target: toTarget(containerCSite)
      }
      resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
      return
    }
  }

  // when the source has no CSite nor container
  if (creep.pos.getRangeTo(source.pos) <= 1) {
    creep.pos.createConstructionSite(STRUCTURE_CONTAINER)
    return
  } else {
    creep.memory.move = {
      target: toTarget(source)
    }
    resolveAndReplay(creep, {nextState: MovingState, replay: MinerJob})
    return
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

function getAvailableSource(creep: Creep): SerializableRoomObject<Source> {
  return new SerializableRoomObject("" as Id<Source>, new SerializablePosition(1, 1, ""))
}

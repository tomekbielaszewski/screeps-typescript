import {
  HarvestingState,
  IdleState,
  MovingState,
  RenewingState,
  resolve,
  resolveAndReplay,
  resolveLastStateAndReplay,
  SpawningState,
  StateResolver,
  StoringState
} from "./runner/common/CreepState"
import { harvest, HarvestingResult } from "./runner/common/HarvestingEnergy"
import { move, MovingResult, toTarget } from "./runner/common/Moving"
import { storeEnergy, StoringResult } from "./runner/common/StoringEnergy"
import { upgradeController, UpgradeResult } from "./runner/common/UpgradingController"
import { renew, RenewingResult } from "./runner/common/Renewing"
import { getLogger } from "../../utils/Logger";
import { SerializableRoomObject } from "../../utils/Serializables";

const JOB_NAME = 'HarvesterJob'

export function HarvesterJob(creep: Creep): void {
  if (!creep.memory.state) {
    creep.memory.state = SpawningState
  }

  if (creep.memory.state !== MovingState
    && creep.memory.state !== RenewingState
    && creep.ticksToLive
    && creep.ticksToLive < 150) {
    resolveAndReplay(creep, { nextState: RenewingState, replay: HarvesterJob })
    return
  }

  switch (creep.memory.state) {
    case SpawningState:
      initialize(creep, { nextState: HarvestingState, replay: HarvesterJob })
      break
    case RenewingState:
      runRenewingState(creep)
      break
    case MovingState:
      runMovingState(creep)
      break
    case HarvestingState:
      runHarvestingState(creep)
      break
    case StoringState:
      runStoringState(creep)
      break
    case IdleState:
      runIdleState(creep)
      break
  }
}

function runIdleState(creep: Creep) {
  const upgradeResult = upgradeController(creep)
  getLogger(JOB_NAME).log(`[${creep.name}] upgradeResult: ${upgradeResult}`)

  switch (upgradeResult) {
    case UpgradeResult.CreepStoreEmpty:
      resolveAndReplay(creep, { nextState: HarvestingState, replay: HarvesterJob })
      break
    case UpgradeResult.NoControllerInRoom:
      creep.say('💤')
      break
    case UpgradeResult.Upgrading:
      break
    case UpgradeResult.OutOfRange:
      if (creep.room.controller) {
        creep.memory.move = {
          range: 3,
          target: toTarget(creep.room.controller)
        }
        resolveAndReplay(creep, { nextState: MovingState, replay: HarvesterJob })
      }
      break
    case UpgradeResult.CouldNotUpgrade:
      break
  }
}

function runStoringState(creep: Creep) {
  const storingResult = storeEnergy(creep)
  getLogger(JOB_NAME).log(`[${creep.name}] storingResult: ${storingResult}`)

  switch (storingResult) {
    case StoringResult.CreepStoreEmpty:
      resolveAndReplay(creep, { nextState: HarvestingState, replay: HarvesterJob })
      break
    case StoringResult.NoStorageSpaceAvailableInRoom:
      resolveAndReplay(creep, { nextState: IdleState, replay: HarvesterJob })
      break
    case StoringResult.Storing: //keep it up
      break
    case StoringResult.StoringFinished:
      resolve(creep, { nextState: HarvestingState })
      break
    case StoringResult.OutOfRange:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.storage)?.get())
      }
      resolveAndReplay(creep, { nextState: MovingState, replay: HarvesterJob })
      break
    case StoringResult.AssignedStorageFull: //try again immediately
      resolveAndReplay(creep, { nextState: StoringState, replay: HarvesterJob })
      break
    case StoringResult.CouldNotTransfer: //try again next tick and see what happens
      break
  }
}

function runHarvestingState(creep: Creep) {
  const harvestingResult = harvest(creep, true, true)
  getLogger(JOB_NAME).log(`[${creep.name}] harvestingResult: ${harvestingResult}`)

  switch (harvestingResult) {
    case HarvestingResult.CouldNotFindSource: //well... lets call it a day
      // resolveAndReplay(creep, {nextState: IdleState, replay: HarvesterJob}) TODO
      break
    case HarvestingResult.CouldNotHarvest: //try again next tick
    case HarvestingResult.Harvesting: //then keep it up
      break
    case HarvestingResult.CreepStoreFull:
      resolveAndReplay(creep, { nextState: StoringState, replay: HarvesterJob })
      break
    case HarvestingResult.OutOfRange:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.sourceTargeted)?.get())
      }
      resolveAndReplay(creep, { nextState: MovingState, replay: HarvesterJob })
      break
  }
}

function runRenewingState(creep: Creep) {
  const renewingResult = renew(creep)
  getLogger(JOB_NAME).log(`[${creep.name}] renewingResult: ${renewingResult}`)

  switch (renewingResult) {
    case RenewingResult.CouldNotFindSpawn: //well... what else if not just die?
    case RenewingResult.CouldNotRenew: //try again next tick
    case RenewingResult.Renewing: //then keep it up
      break
    case RenewingResult.SpawnSpawning: //c'mon im dying!
    case RenewingResult.SpawnEmpty: //should I find another one? Or wait to be filled up?
    case RenewingResult.CreepRenewed: //all good. Back to work!
      resolveAndReplay(creep, { nextState: HarvestingState, replay: HarvesterJob })
      break
    case RenewingResult.OutOfRange:
      creep.memory.move = {
        target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.spawn)?.get())
      }
      resolveAndReplay(creep, { nextState: MovingState, replay: HarvesterJob })
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
      resolveLastStateAndReplay(creep, { replay: HarvesterJob })
      break
    case MovingResult.ReachedDestination:
      resolveLastStateAndReplay(creep, { replay: HarvesterJob })
      break
    case MovingResult.Tired:
      creep.say('😩')
      break
  }
}

function initialize(creep: Creep, state: StateResolver) {
  if (creep.spawning) return
  resolveAndReplay(creep, state)
}

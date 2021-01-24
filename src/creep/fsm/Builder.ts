import {
  BuildingState,
  CreepState,
  IdleState,
  MovingState,
  RefillingState,
  RepairingState,
  SpawningState
} from "./runner/common/CreepState"
import {move, MovingResult, toTarget} from "./runner/common/Moving"
import {refillCreep, RefillingResult} from "./runner/common/RefillingCreep"
import {building, BuildingResult} from "./runner/common/Building"
import {repairing, RepairingResult} from "./runner/common/Repairing"
import {getLogger} from "../../utils/Logger";
import {SerializableRoomObject} from "../../utils/Serializables";
import {FSM} from "./FSM";
import {BuildingSearch} from "../cache/BuildingSearch";

const JOB_NAME = 'BuilderJob'

class BuilderFSM extends FSM {
  private buildingSearch: BuildingSearch;

  public constructor(buildingSearch: BuildingSearch) {
    super()
    this.buildingSearch = buildingSearch
  }

  public work(creep: Creep): void {
    if (!creep.memory.state) {
      creep.memory.state = SpawningState
    }
    Memory.repair.fortifications = Memory.repair.fortifications === true

    switch (creep.memory.state) {
      case SpawningState:
        this.initialize(creep)
        break
      case RefillingState:
        this.runRefillingState(creep)
        break
      case MovingState:
        this.runMovingState(creep)
        break
      case BuildingState:
        this.runBuildingState(creep)
        break
      case RepairingState:
        this.runRepairingState(creep)
        break
      case IdleState:
        this.runIdleState(creep)
        break
    }
  }

  private initialize(creep: Creep): void {
    if (creep.spawning) return
    const nextState = this.buildingOrRepairing(creep)
    this.pushState(creep, {nextState, replay: true})
  }

  private runRefillingState(creep: Creep): void {
    const refillingResult = refillCreep(creep, true)
    getLogger(JOB_NAME).log(`[${creep.name}] refillingResult: ${refillingResult}`)

    switch (refillingResult) {
      case RefillingResult.CreepRefilled:
        this.pushState(creep, {nextState: this.buildingOrRepairing(creep), replay: false})
        break
      case RefillingResult.CreepStoreFull:
        this.pushState(creep, {nextState: this.buildingOrRepairing(creep), replay: true})
        break
      case RefillingResult.NoResourcesInStorage: //do not advance to another state
        creep.say('!💸')
        break
      case RefillingResult.CouldNotWithdraw: //do not advance to another state
        break
      case RefillingResult.OutOfRange:
        creep.memory.move = {
          target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.storage)?.get())
        }
        this.pushState(creep, {nextState: MovingState, replay: true})
        break
    }
  }

  private runMovingState(creep: Creep): void {
    const movingResult = move(creep)
    getLogger(JOB_NAME).log(`[${creep.name}] movingResult: ${movingResult}`)

    switch (movingResult) {
      case MovingResult.CouldNotMove: //do not advance to another state and see what happens
      case MovingResult.Moving: //do not advance to another state and keep moving
        break
      case MovingResult.NoPath: //something blocking the path? wait to next tick and run again. In future good to have some traffic control here
        creep.say('🗺️🤔')
        break
      case MovingResult.NoTargetPositionSet:
        this.popState(creep, true)
        break
      case MovingResult.ReachedDestination:
        this.popState(creep, true)
        break
      case MovingResult.Tired:
        creep.say('😩')
        break
    }
  }

  private runBuildingState(creep: Creep): void {
    const buildingResult = building(creep)
    getLogger(JOB_NAME).log(`[${creep.name}] buildingResult: ${buildingResult}`)

    switch (buildingResult) {
      case BuildingResult.Working: //then keep working
        break
      case BuildingResult.OutOfRange:
        creep.memory.move = {
          range: 3,
          target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.construction)?.get())
        }
        this.pushState(creep, {nextState: MovingState, replay: true})
        break
      case BuildingResult.ConstructionSiteNoLongerExist: //has CS been completed? Lets reply the current state
        this.pushState(creep, {nextState: BuildingState, replay: true})
        break
      case BuildingResult.NoConstructionSite: //nothing to build - try repairing stuff
        this.pushState(creep, {nextState: RepairingState, replay: true})
        break
      case BuildingResult.CreepStoreEmpty:
        this.pushState(creep, {nextState: RefillingState, replay: true})
        break
    }
  }

  private runRepairingState(creep: Creep): void {
    const repairingResult = repairing(creep, Memory.repair.fortifications)
    getLogger(JOB_NAME).log(`[${creep.name}] repairingResult: ${repairingResult}`)

    switch (repairingResult) {
      case RepairingResult.Working: //then keep working
      case RepairingResult.CouldNotRepair: //do not advance to another state and see what happens
        break
      case RepairingResult.NothingToRepair:
      case RepairingResult.StructureNoLongerExists:
        this.pushState(creep, {nextState: IdleState, replay: true})
        break
      case RepairingResult.StructureRepaired:
        this.pushState(creep, {nextState: IdleState, replay: false})
        break
      case RepairingResult.CreepStoreEmpty:
        this.pushState(creep, {nextState: RefillingState, replay: true})
        break
      case RepairingResult.OutOfRange:
        creep.memory.move = {
          range: 3,
          target: toTarget(SerializableRoomObject.cloneNullable(creep.memory.repair)?.get())
        }
        this.pushState(creep, {nextState: MovingState, replay: true})
        break
    }
  }

  private runIdleState(creep: Creep): void {
    const nextState = this.buildingOrRepairing(creep)
    if (nextState !== IdleState) {
      this.pushState(creep, {nextState, replay: true})
      return
    }

    creep.say('🚬')
    const idleFlag = Object.values(Game.flags)
      .filter(f => f.pos.roomName === creep.room.name)
      .find(f => f.color === COLOR_WHITE)
    if (idleFlag) {
      if (creep.pos.getRangeTo(idleFlag.pos) > 3) {
        creep.memory.move = {
          range: 3,
          target: toTarget(idleFlag)
        }
        this.pushState(creep, {nextState: MovingState, replay: true})
      }
    }
  }

  private buildingOrRepairing(creep: Creep): CreepState {
    const lowHpStructures = this.buildingSearch.findLowHpStructures(creep.room, Memory.repair.fortifications)
    if (lowHpStructures.length) return RepairingState
    const constructionSites = this.buildingSearch.findMyConstructionSites(creep.room)
    if (constructionSites.length) return BuildingState
    return IdleState
  }
}

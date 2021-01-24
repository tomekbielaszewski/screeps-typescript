import {CreepState} from "./runner/common/CreepState";

export interface StateResolver {
  nextState: CreepState,
  replay: boolean
}

export abstract class FSM {
  protected game: Game
  private replay: boolean
  private replyCounter: number
  private replyLimit = 5;

  protected constructor() {
    this.replay = false
    this.replyCounter = 0
    this.game = Game
  }

  public setGame(game: Game): void {
    this.game = game
  }

  public start(creep: Creep): void {
    while (this.replay && this.replyCounter < this.replyLimit) {
      this.replay = false
      this.work(creep)
      this.replyCounter++
    }

    this.replyCounter = 0
  }

  abstract work(creep: Creep): void

  protected pushState(creep: Creep, stateResolver: StateResolver): CreepState {
    const nextState = stateResolver.nextState

    creep.memory.pastStates = creep.memory.pastStates || []
    if (creep.memory.state)
      creep.memory.pastStates.push(creep.memory.state)
    creep.memory.state = nextState
    this.replay = stateResolver.replay || false

    // STATE_LOGGER.log(`[${Game.time}] creep[${creep.name}]: ${creep.memory.lastState} ==> ${creep.memory.state} | param ${JSON.stringify(creep.memory.move)}`);
    return nextState as CreepState
  }

  protected popState(creep: Creep, replay?: boolean): CreepState {
    if (!creep.memory.pastStates || !creep.memory.pastStates.length) throw new Error('No past state to fallback to')

    this.replay = replay || false
    return creep.memory.state = creep.memory.pastStates.pop() as CreepState
  }
}

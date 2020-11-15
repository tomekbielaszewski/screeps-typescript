import Mock = jest.Mock;

jest.mock('./runner/miner/Docking')
jest.mock('./runner/common/Moving')
jest.mock('./runner/common/HarvestingEnergy')

import {docking} from './runner/miner/Docking'
import {move, toTarget} from './runner/common/Moving'
import {harvest} from "./runner/common/HarvestingEnergy"
import {mockGlobal, mockInstanceOf} from 'screeps-jest/src/mocking'
import {MinerJob} from './Miner'
import {DockingState, HarvestingState, MovingState, SpawningState} from './runner/common/CreepState'
import {SerializablePosition, SerializableRoomObject} from '../../utils/Serializables'

const {DockingResult} = jest.requireActual('./runner/miner/Docking')
const {MovingResult} = jest.requireActual('./runner/common/Moving')
const {HarvestingResult} = jest.requireActual('./runner/common/HarvestingEnergy')

mockGlobal<Memory>('Memory', {log: {state: undefined}}, true)

describe('Miner role', () => {
  describe('SpawningState', () => {
    it('should do nothing when spawning', () => {
      const creep = mockInstanceOf<Creep>({
        name: 'creepName',
        memory: {
          state: undefined
        },
        spawning: true,
      })

      MinerJob(creep)

      expect(creep.memory.state).toEqual(SpawningState)
    })

    it('should switch to docking when not spawning and validates if source is assigned', () => {
      const creep = mockInstanceOf<Creep>({
        name: 'creepName',
        memory: {
          state: undefined,
          move: undefined,
          source: new SerializableRoomObject("id" as Id<Source>, new SerializablePosition(0, 0, ""))
        },
        spawning: undefined,
      })
      mockGlobal<Game>('Game', {
        creeps: {myHero: creep},
        time: 1,
      })

      MinerJob(creep)

      expect(creep.memory.state).toEqual(DockingState)
    })
  })

  describe('DockingState', () => {
    it('should switch to Moving when out of reach', () => {
      const serializedSource = new SerializableRoomObject("id" as Id<Source>, new SerializablePosition(1, 2, ""))
      const creep = mockInstanceOf<Creep>({
        name: 'creepName',
        memory: {
          state: DockingState,
          source: serializedSource
        }
      })
      const source = mockInstanceOf<Source>({
        id: serializedSource.id,
        pos: serializedSource.pos.toPos()
      })
      mockGlobal<Game>('Game', {
        creeps: {myHero: creep},
        getObjectById: () => source,
        time: 1,
      })

      const mockDocking = docking as Mock
      const mockMoving = move as Mock
      const mockToTarget = toTarget as Mock
      mockDocking.mockReturnValue(DockingResult.SOURCE_OUT_OF_RANGE)
      mockMoving.mockReturnValue(MovingResult.Moving)
      mockToTarget.mockReturnValue(serializedSource)

      MinerJob(creep)

      expect(creep.memory.state).toEqual(MovingState)
      expect(creep.memory.move?.target).toEqual(serializedSource)
    })
  })

  it('should switch to Harvesting when docked', () => {
    const serializedSource = new SerializableRoomObject("id" as Id<Source>, new SerializablePosition(1, 2, ""))
    const creep = mockInstanceOf<Creep>({
      name: 'creepName',
      memory: {
        state: DockingState,
        move: undefined,
        source: serializedSource
      }
    })
    mockGlobal<Game>('Game', {
      creeps: {myHero: creep},
      time: 1,
    })

    const mockDocking = docking as Mock
    const mockHarvesting = harvest as Mock
    mockDocking.mockReturnValue(DockingResult.DOCKED)
    mockHarvesting.mockReturnValue(HarvestingResult.Harvesting)

    MinerJob(creep)

    expect(creep.memory.state).toEqual(HarvestingState)
  })

  it('should transfer energy to storage when creep full', () => {

  })

  it('should move to storage when creep full and storage out of reach', () => {

  })
})


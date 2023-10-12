import Mock = jest.Mock;

jest.mock('./runner/miner/Docking')
jest.mock('./runner/common/Moving')
jest.mock('./runner/common/HarvestingEnergy')

import {docking} from './runner/miner/Docking'
import {move, toTarget} from './runner/common/Moving'
import {harvest} from "./runner/common/HarvestingEnergy"
import {mockGlobal, mockInstanceOf} from 'screeps-jest/src/mocking'
import {DockingState, HarvestingState, MovingState, SpawningState} from './runner/common/CreepState'
import {SerializablePosition, SerializableRoomObject} from '../../utils/Serializables'
import {HarvesterJob} from "./Harvester";

const {DockingResult} = jest.requireActual('./runner/miner/Docking')
const {MovingResult} = jest.requireActual('./runner/common/Moving')
const {HarvestingResult} = jest.requireActual('./runner/common/HarvestingEnergy')

mockGlobal<Memory>('Memory', {log: {state: undefined}}, true)

describe('Harvester role', () => {
  describe('SpawningState', () => {
    it('should do nothing when spawning', () => {
      const creep = mockInstanceOf<Creep>({
        ticksToLive: 1500,
        memory: {
          state: undefined
        },
        spawning: true,
      })

      HarvesterJob(creep)

      expect(creep.memory.state).toEqual(SpawningState)
    })

    it('should switch to harvesting moving and back to harvesting', () => {
      const serializedSource = new SerializableRoomObject("id" as Id<Source>, new SerializablePosition(1, 2, ""))
      const creep = mockInstanceOf<Creep>({
        name: 'creepName',
        ticksToLive: 1500,
        memory: {
          state: undefined,
          move: undefined,
          source: serializedSource,
          sourceTargeted: serializedSource
        },
        spawning: undefined,
      })
      const source = mockInstanceOf<Source>({
        id: serializedSource.id,
        pos: serializedSource.pos.toPos()
      });
      mockGlobal<Game>('Game', {
        getObjectById: () => source,
        time: 1,
      })

      const mockHarvesting = harvest as Mock
      const mockMoving = move as Mock
      const mockToTarget = toTarget as Mock
      mockHarvesting.mockReturnValueOnce(HarvestingResult.OutOfRange)
        .mockReturnValueOnce(HarvestingResult.Harvesting)
      mockMoving.mockReturnValue(MovingResult.ReachedDestination)
      mockToTarget.mockReturnValue(serializedSource)

      HarvesterJob(creep)

      expect(creep.memory.state).toEqual(HarvestingState)
    })
  })

  describe('DockingState', () => {
    xit('should switch to Moving when out of reach', () => {
      const serializedSource = new SerializableRoomObject("id" as Id<Source>, new SerializablePosition(1, 2, ""))
      const creep = mockInstanceOf<Creep>({
        ticksToLive: 1500,
        memory: {
          state: DockingState,
          source: serializedSource
        }
      })
      const source = mockInstanceOf<Source>({
        id: serializedSource.id,
        pos: serializedSource.pos.toPos()
      });
      mockGlobal<Game>('Game', {
        creeps: {myHero: creep},
        getObjectById: () => source,
      })

      const mockDocking = docking as Mock
      const mockMoving = move as Mock
      const mockToTarget = toTarget as Mock
      mockDocking.mockReturnValue(DockingResult.SOURCE_OUT_OF_RANGE)
      mockMoving.mockReturnValue(MovingResult.Moving)
      mockToTarget.mockReturnValue(serializedSource)

      HarvesterJob(creep)

      expect(creep.memory.state).toEqual(MovingState)
      expect(creep.memory.move?.target).toEqual(serializedSource)
    })
  })

  xit('should switch to Harvesting when docked', () => {
    const serializedSource = new SerializableRoomObject("id" as Id<Source>, new SerializablePosition(1, 2, ""))
    const creep = mockInstanceOf<Creep>({
      ticksToLive: 1500,
      memory: {
        state: DockingState,
        source: serializedSource
      }
    })

    const mockDocking = docking as Mock
    const mockHarvesting = harvest as Mock
    mockDocking.mockReturnValue(DockingResult.DOCKED)
    mockHarvesting.mockReturnValue(HarvestingResult.Harvesting)

    HarvesterJob(creep)

    expect(creep.memory.state).toEqual(HarvestingState)
  })

  it('should transfer energy to storage when creep full', () => {

  })

  it('should move to storage when creep full and storage out of reach', () => {

  })
})


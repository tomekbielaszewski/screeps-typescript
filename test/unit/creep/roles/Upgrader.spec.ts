import {mockInstanceOf} from 'screeps-jest';
import {CreepRole} from "../../../../src/creep/CreepManager";
import {mockGlobal} from "screeps-jest/index";
import {UpgraderJob, UpgraderState} from "../../../../src/creep/roles/Upgrader";

const container = mockInstanceOf<StructureContainer>({
  id:'containerId' as Id<StructureContainer>,
  store: {getUsedCapacity: () => 1},
  structureType: STRUCTURE_CONTAINER
});
const roomMock = mockInstanceOf<Room>({
  name: 'W1R1',
  find: (finder: FindConstant) => finder === FIND_MY_STRUCTURES ? container : []
});
const creepMemory = {
  role: CreepRole.UPGRADER,
  room: roomMock.name,
  state: UpgraderState.REFILLING,
  param: {}
}
const creep = mockInstanceOf<Creep>({
  name: 'myHero',
  pos: {x: 0, y: 0, roomName: creepMemory.room, findClosestByPath: () => container},
  room: roomMock,
  memory: creepMemory,
  store: {getFreeCapacity: () => 1},
  withdraw: () => OK
}, true);
mockGlobal<Game>('Game', {
  creeps: {myHero: creep},
  rooms: {W1R1: roomMock},
  time: 1,
  getObjectById: () => container
});
mockGlobal<Memory>('Memory', {
  creeps: {
    myHero: creepMemory
  }
}, true);

describe("Upgrader role", () => {

  it("should default to REFILLING when wrong state set", () => {
    creepMemory.state = undefined as unknown as UpgraderState;

    UpgraderJob(creep);

    // expect(creep.say.bind(creep)).toBeCalledWith(expect.stringContaining())
    expect(creep.memory.state).toEqual(UpgraderState.REFILLING);
  });

});

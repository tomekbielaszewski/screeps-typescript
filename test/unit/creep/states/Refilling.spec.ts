import {mockGlobal, mockInstanceOf} from "screeps-jest/src/mocking";

const EMPTY_STORE = mockInstanceOf<StoreDefinition>({
  getUsedCapacity: () => 0,
  getFreeCapacity: () => 50,
  getCapacity: () => 50
})
const FULL_STORE = mockInstanceOf<StoreDefinition>({
  getUsedCapacity: () => 50,
  getFreeCapacity: () => 0,
  getCapacity: () => 50
})

mockGlobal<Memory>('Memory', {log: {state: undefined}}, true);

describe('Refilling state', () => {
  it('resolves state when creep is full', () => {
  });

  it('withdraws from storage when in range and has no assigned container', () => {

  });

  it('withdraws from storage when in range and has assigned empty container', () => {
  });

  it('withdraws from container when its not empty', () => {

  });

  it('goes to container when out of reach', () => {
  });

  it('goes to storage when out of reach', () => {

  });
})

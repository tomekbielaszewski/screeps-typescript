enum UpgraderState {
  UPGRADING,
  REFILLING
}

export function UpgraderJob(creep: Creep): void {
  switch (calculateState(creep)) {
    case UpgraderState.UPGRADING:
      upgradeController(creep);
      break;
    case UpgraderState.REFILLING:
      refillCreep(creep);
      break;
    default:
      creep.say("I'm in unknown UpgraderState! state: " + (creep.memory.state || "null").toString())
  }
}

const VISITED_ENERGY_STORAGE = "E"

function calculateState(creep: Creep): UpgraderState {
  if (creep.memory.state === UpgraderState.UPGRADING && creep.store[RESOURCE_ENERGY] === 0) {
    creep.memory.state = UpgraderState.REFILLING;
    creep.say('🌾');
  }
  if (creep.memory.state === UpgraderState.REFILLING && creep.store.getFreeCapacity() === 0) {
    creep.memory.state = UpgraderState.UPGRADING;
    delete creep.memory.param[VISITED_ENERGY_STORAGE]
    creep.say('⚡');
  }
  return creep.memory.state = UpgraderState.REFILLING;
}

function upgradeController(creep: Creep): void {
  if (creep.room.controller) {
    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
    }
  } else {
    creep.say("No controller in room?!")
  }
}

function refillCreep(creep: Creep): void {
  let foundEnergyStorage = creep.memory.param[VISITED_ENERGY_STORAGE];
  if (!foundEnergyStorage || isEmpty(foundEnergyStorage)) {
    creep.memory.param[VISITED_ENERGY_STORAGE] = foundEnergyStorage = findClosestEnergyStorage(creep);
  }

  const object = Game.getObjectById<RoomObject>(foundEnergyStorage);
  if (object instanceof Structure) {
    const storage = object as StructureStorage | StructureContainer;
    if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffaa00'}});
    }
  }
  if (object instanceof Resource) {
    const resource = object;
    if (creep.pickup(resource) === ERR_NOT_IN_RANGE) {
      creep.moveTo(resource, {visualizePathStyle: {stroke: '#ffaa00'}});
    }
  }
  if (object instanceof Source) {
    const source = object;
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
    }
  }
}

function isEmpty(id: string): boolean {
  const object = Game.getObjectById<RoomObject>(id);
  if (object instanceof Structure)
    return isStorageEmpty(object);
  if (object instanceof Resource)
    return object.amount > 0;
  if (object instanceof Source)
    return object.energy > 0;
  return true;
}

function findClosestEnergyStorage(creep: Creep): string {
  const pos = creep.pos;
  const room = creep.room;
  const structures = room.find(FIND_STRUCTURES, {
    filter: s => (s.structureType === STRUCTURE_CONTAINER ||
      s.structureType === STRUCTURE_STORAGE) &&
      s.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  }) as RoomObject[];
  const resources = room.find(FIND_DROPPED_RESOURCES, {
    filter: r => r.resourceType === RESOURCE_ENERGY
  }) as RoomObject[];
  const sources = room.find(FIND_SOURCES, {
    filter: s => s.energy > 0
  }) as RoomObject[];
  const closestByPath = pos.findClosestByPath(structures.concat(resources).concat(sources)) as Structure | Source | Resource;
  return closestByPath.id;
}

function isStorageEmpty(storage: Structure): boolean {
  if (storage instanceof StructureStorage ||
    storage instanceof StructureContainer)
    return storage.store.getUsedCapacity(RESOURCE_ENERGY) === 0;
  return true;
}

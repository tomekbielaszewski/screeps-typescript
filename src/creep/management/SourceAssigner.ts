export function assignToSource(creep: Creep, source: Source): boolean {
  Memory.sources = Memory.sources || {};
  if (!Memory.sources[source.id]) {
    const sourceMemory = Memory.sources[source.id] || {};
    sourceMemory.spots = calculateAvailableSpots(source);
    sourceMemory.creeps = [];
    Memory.sources[source.id] = sourceMemory;
  }
  if (Memory.sources[source.id].creeps.length < Memory.sources[source.id].spots) {
    Memory.sources[source.id].creeps.push(creep.name);
    creep.memory.source = source.id;
    return true;
  }
  return false;
}

function calculateAvailableSpots(source: Source): number {
  let availableSpots = 0;
  for (let x = source.pos.x - 1; x < 3; x++) {
    for (let y = source.pos.y - 1; y < 3; y++) {
      if (x !== source.pos.x && y !== source.pos.y) {
        const lookAt = source.room.lookAt(x, y);
        if (isWalkable(lookAt)) availableSpots++;
      }
    }
  }
  return availableSpots;
}

function isWalkable(objects: LookAtResult[]): boolean {
  return objects
    .filter(o =>
      o.type === LOOK_TERRAIN && isNonWalkableTerrain(o) ||
      o.type === LOOK_STRUCTURES && !isWalkableStructure(o)
    )
    .length === 0;
}

function isNonWalkableTerrain(terrain: LookAtResult) {
  return terrain.terrain === "wall";
}

function isWalkableStructure(structure: LookAtResult) {
  return structure.structure?.structureType === STRUCTURE_CONTAINER ||
    structure.structure?.structureType === STRUCTURE_ROAD ||
    structure.structure?.structureType === STRUCTURE_RAMPART;
}

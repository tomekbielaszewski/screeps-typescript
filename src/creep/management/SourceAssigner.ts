export function assignToSource(creep: Creep, source: Source): boolean {
  Memory.sources = Memory.sources || {};
  if (!Memory.sources[source.id]) {
    const newSourceMemory = Memory.sources[source.id] || {};
    newSourceMemory.spots = calculateAvailableSpots(source);
    newSourceMemory.creeps = [];
    Memory.sources[source.id] = newSourceMemory;
  }
  const sourceMemory = Memory.sources[source.id];
  if (sourceMemory.creeps.length < sourceMemory.spots) {
    sourceMemory.creeps.push(creep.name);
    creep.memory.source = source.id;
    return true;
  }
  return false;
}

function calculateAvailableSpots(source: Source): number {
  let availableSpots = 0;
  for (let x = source.pos.x - 1; x <= source.pos.x + 1; x++) {
    for (let y = source.pos.y - 1; y <= source.pos.y + 1; y++) {
      const lookAt = source.room.lookAt(x, y);
      if (isWalkable(lookAt)) {
        availableSpots++;
        source.room.visual.circle(x, y, {radius: 0.5, stroke: '#00aa00', fill: '#005500'});
      }
    }
  }
  return availableSpots;
}

function isWalkable(objects: LookAtResult[]): boolean {
  return objects
    .filter(o =>
      o.type === LOOK_TERRAIN && isNonWalkableTerrain(o) ||
      o.type === LOOK_STRUCTURES && !isWalkableStructure(o) ||
      o.type === LOOK_SOURCES
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

export function defendRoom(room: Room) {
  const hostiles = room.find(FIND_HOSTILE_CREEPS);
  if (hostiles.length > 0) {
    const towers = room.find<StructureTower>(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
    towers.forEach(tower => tower.attack(hostiles[0]));
  }
}

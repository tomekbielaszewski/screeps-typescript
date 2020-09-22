export function defendRoom(roomName: string) {
  const hostiles = Game.rooms[roomName].find(FIND_HOSTILE_CREEPS);
  if (hostiles.length > 0) {
    const towers = Game.rooms[roomName].find<StructureTower>(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
    towers.forEach(tower => tower.attack(hostiles[0]));
  }
}

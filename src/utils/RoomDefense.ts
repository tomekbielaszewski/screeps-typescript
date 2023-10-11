export function defendRoom(room: Room) {
  const towers = room.find<StructureTower>(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
  towers.forEach(tower => {
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
      tower.attack(hostiles[0]);
    } else {
      const structure = room.find(FIND_MY_STRUCTURES)
        .find(s => s.hits / s.hitsMax < 0.79)
      if (structure) tower.repair(structure)
    }
  });
}

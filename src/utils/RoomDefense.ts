import { getLogger, Logger } from "./../utils/Logger"

export function defendRoom(room: Room) {
  const logger = getLogger(`Tower ${room.name}`)
  const towers = room.find<StructureTower>(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
  towers.forEach(tower => {
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
      tower.attack(hostiles[0]);
    } else {
      const lowHpStructures = room.find(FIND_STRUCTURES)
        .filter(s => s.structureType !== STRUCTURE_CONTROLLER)
        .filter(s => s.structureType !== STRUCTURE_WALL)
        .filter(s => s.structureType !== STRUCTURE_RAMPART)
        .filter(s => (s.hits / s.hitsMax) < Memory.repair.lowHP)
      if (lowHpStructures.length) {
        const lowestHpStructure = lowHpStructures.reduce((s1, s2) => ((s1.hits / s1.hitsMax) < (s2.hits / s2.hitsMax) ? s1 : s2))
        if (lowestHpStructure) tower.repair(lowestHpStructure)
      }
    }
  });
}

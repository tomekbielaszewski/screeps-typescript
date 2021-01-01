function cpu(): Record<string, any> {
  const cpuStats = {
    used: Game.cpu.getUsed(),
    mainComponents: Memory.mainComponentsTime,
    bucket: Game.cpu.bucket,
    heap: undefined as unknown as HeapStatistics
  };
  if (typeof Game.cpu.getHeapStatistics === 'function') {
    cpuStats.heap = Game.cpu.getHeapStatistics();
  }
  return cpuStats;
}

interface HarvestEvent {
  targetId: string,
  amount: number
}

interface UpgradeEvent {
  energySpent: number,
  amount: number
}

function calcStoredEnergy(room: Room) {
  const storages = room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_STORAGE
  }) as StructureStorage[]
  const storedEnergy = storages.map(s => s.store.energy)
    .reduce((e1, e2) => e1 + e2, 0)
  const storageCap = storages.map(s => s.store.getCapacity())
    .reduce((e1, e2) => e1 + e2, 0)

  const containers = room.find(FIND_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_CONTAINER
  }) as StructureContainer[]
  const containersEnergy = containers.map(c => c.store.energy)
    .reduce((e1, e2) => e1 + e2, 0)
  const containersCap = containers.map(s => s.store.getCapacity())
    .reduce((e1, e2) => e1 + e2, 0)

  const towers = room.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_TOWER
  }) as StructureTower[]
  const towersEnergy = towers.map(c => c.store.energy)
    .reduce((e1, e2) => e1 + e2, 0)
  const towersCap = towers.map(s => s.store.getCapacity())
    .map(e => e || 0)
    .reduce((e1, e2) => e1 + e2, 0)

  return {
    storedEnergy,
    storageCap,
    containersEnergy,
    containersCap,
    towersEnergy,
    towersCap
  }
}

function rcl(): Record<string, any> {
  const rooms = {} as { [roomName: string]: Record<string, any> };

  function calcEnergyHarvested(room: Room): number {
    return room.getEventLog()
      .filter(e => EVENT_HARVEST === e.event)
      .map(e => e.data as HarvestEvent)
      .map(e => e.amount)
      .reduce((sum, amount) => sum + amount, 0)
  }

  function calcUpgrade(room: Room): UpgradeEvent {
    return room.getEventLog()
      .filter(e => EVENT_UPGRADE_CONTROLLER === e.event)
      .map(e => e.data as UpgradeEvent)
      .reduce((aggregate, event) => {
        return {
          amount: aggregate.amount + event.amount,
          energySpent: aggregate.energySpent + event.energySpent
        }
      }, {amount: 0, energySpent: 0} as UpgradeEvent)
  }

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    rooms[roomName] = {
      name: roomName,
      progress: room.controller ? room.controller.progress : 0,
      progressTotal: room.controller ? room.controller.progressTotal : 0,
      upgraded: calcUpgrade(room),
      energy: room.energyAvailable,
      energyCap: room.energyCapacityAvailable,
      energyHarvested: calcEnergyHarvested(room),
      energyStored: calcStoredEnergy(room)
    };
  }
  return rooms
}

function gcl(): Record<string, any> {
  return Game.gcl;
}

export function StatPublisher() {
  RawMemory.segments[0] = JSON.stringify({
    cpu: cpu(),
    controller: rcl(),
    gcl: gcl()
  });
}

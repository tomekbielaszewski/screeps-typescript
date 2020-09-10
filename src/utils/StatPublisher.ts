function cpu(): Record<string, any> {
  const cpuStats = {
    used: Game.cpu.getUsed(),
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

function rcl(): Record<string, any> {
  const rooms = {} as { [roomName: string]: Record<string, any> } ;

  function calcEnergyHarvested(room: Room): number {
    return room.getEventLog()
      .filter(e => EVENT_HARVEST === e.event)
      .map(e => e.data as HarvestEvent)
      .map(e => e.amount)
      .reduce((sum, amount) => sum + amount, 0)
  }

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    rooms[roomName] = {
      name: roomName,
      progress: room.controller ? room.controller.progress : 0,
      energy: room.energyAvailable,
      energyCap: room.energyCapacityAvailable,
      energyHarvested: calcEnergyHarvested(room)
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

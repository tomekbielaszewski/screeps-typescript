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

function rcl(): Record<string, any> {
  const rooms = {} as { [roomName: string]: Record<string, any> } ;
  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName];
    rooms[roomName] = {
      name: roomName,
      progress: room.controller ? room.controller.progress : 0,
      energy: room.energyAvailable,
      energyCap: room.energyCapacityAvailable
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

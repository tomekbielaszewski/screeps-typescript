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

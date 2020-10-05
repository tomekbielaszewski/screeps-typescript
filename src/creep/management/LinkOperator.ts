enum LinkType {
  MINE = 'mine',
  UPGRADE = 'upgrade',
  STORAGE = 'storage',
}

export function operate(room: Room) {
  if (!room.controller) return
  if (room.controller.level < 5) return
  room.memory.links = room.memory.links || {}

  const mine = getLink(LinkType.MINE, room)
  const upgrade = getLink(LinkType.UPGRADE, room)
  const storage = getLink(LinkType.STORAGE, room)

  transfer(mine, upgrade)
  transfer(mine, storage)
}

function transfer(from: StructureLink | undefined, to: StructureLink | undefined) {
  if (!from) return
  if (!to) return
  if (from.store.getFreeCapacity(RESOURCE_ENERGY) > 0) return;
  if (to.store.getUsedCapacity(RESOURCE_ENERGY) > 0) return;
  if (from.cooldown > 0) return;

  from.transferEnergy(to)
}

function getLink(type: LinkType, room: Room): StructureLink | undefined {
  const id = room.memory.links[type]
  if (!id) return undefined
  const link = Game.getObjectById(id as Id<StructureLink>)
  return link || undefined
}

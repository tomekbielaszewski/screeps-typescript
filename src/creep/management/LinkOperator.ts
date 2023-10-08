enum LinkType {
  MINERAL = 'mineral',
  SOURCE1 = 'source1',
  SOURCE2 = 'source2',
  UPGRADE = 'upgrade',
  STORAGE1 = 'storage1',
  STORAGE2 = 'storage2',
}

export function LinkOperator(room: Room) {
  if (!room.controller) return
  if (room.controller.level < 5) return
  room.memory.links = room.memory.links || {}

  const mineral = getLink(LinkType.MINERAL, room)
  const source1 = getLink(LinkType.SOURCE1, room)
  const source2 = getLink(LinkType.SOURCE2, room)
  const upgrade = getLink(LinkType.UPGRADE, room)
  const storage1 = getLink(LinkType.STORAGE1, room)
  const storage2 = getLink(LinkType.STORAGE2, room)

  transfer(source1, upgrade)
  transfer(source1, storage1)
  transfer(source2, upgrade)
  transfer(source2, storage2)
  transfer(mineral, storage1)
  transfer(mineral, storage2)
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

export enum UpgradeResult {
  CreepStoreEmpty,
  NoControllerInRoom,
  Upgrading,
  OutOfRange,
  CouldNotUpgrade,
}

export function upgradeController(creep: Creep): UpgradeResult {
  if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
    return UpgradeResult.CreepStoreEmpty
  }

  const controller = creep.room.controller;
  if (!controller) {
    return UpgradeResult.NoControllerInRoom
  }

  const upgradeResult = creep.upgradeController(controller);
  switch (upgradeResult) {
    case OK:
      return UpgradeResult.Upgrading
    case ERR_NOT_IN_RANGE:
      return UpgradeResult.OutOfRange
    default:
      console.log(`UpgradingController: upgradeController result ${upgradeResult}`)
      return UpgradeResult.CouldNotUpgrade
  }
}

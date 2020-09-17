export const cli = {
  help,
  creeps: {
    body,
    life
  },
  buildings: {
    hits,
    repair: {
      fortifications,
      wall,
      rampart,
      lowhp,
      hysteresis
    }
  }
}

function help(): string {
  return JSON.stringify(cli, (key, val) => (typeof val === 'function') ? 'f()' : val, 4);
}

function body(): string {
  return Object.values(Game.creeps).map(c => `${c.name}: ${c.body.map(b => b.type)}`).reduce((a, b) => a + "\n" + b);
}

function life(): string {
  return Object.values(Game.creeps).map(c => `${c.name}: ${c.ticksToLive}`).reduce((a, b) => a + "\n" + b);
}

function hits(): string {
  return Object.values(Game.structures).map(c => `${c.structureType}: ${c.hits}/${c.hitsMax} [${c.hits / c.hitsMax}]`).reduce((a, b) => a + "\n" + b);
}

function fortifications(setting?: boolean): string {
  if (setting === undefined) return `Sets if fortifications will be repaired. Current setting: ${Memory.repair.fortifications}`
  Memory.repair.fortifications = setting
  return setting as unknown as string
}

function wall(setting?: number): string {
  if (setting === undefined) return `Sets max hp to which wall will be repaired. Current setting: ${Memory.repair.wall}`
  Memory.repair.wall = setting
  return setting as unknown as string
}

function rampart(setting?: number): string {
  if (setting === undefined) return `Sets max hp to which rampart will be repaired. Current setting: ${Memory.repair.rampart}`
  Memory.repair.rampart = setting
  return setting as unknown as string
}

function lowhp(setting?: number): string {
  if (setting === undefined) return `Sets HP percentage which is considered low HP and should be repaired. Current setting: ${Memory.repair.lowHP}`
  Memory.repair.lowHP = setting
  return setting as unknown as string
}

function hysteresis(setting?: number): string {
  if (setting === undefined) return `Sets HP repair hysteresis. Current setting: ${Memory.repair.hysteresis}`
  Memory.repair.hysteresis = setting
  return setting as unknown as string
}

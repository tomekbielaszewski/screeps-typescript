export function cli() {
  return {
    creeps: {
      bodies: Object.values(Game.creeps).map(c => c.body.map(b => b.type)).map(b => JSON.stringify(b) + "\n"),
      suicide: Object.values(Game.creeps).forEach(c => c.suicide()),
      life: Object.values(Game.creeps).map(c => `${c.name}: ${c.ticksToLive}\n`)
    }
  }
}

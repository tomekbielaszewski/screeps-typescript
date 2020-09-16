export function cli() {
  function getBodyCompositions() {
    return Object.values(Game.creeps).map(c => c.body.map(b => b.type)).map(b => JSON.stringify(b) + "\n");
  }

  function getTicksToLive() {
    return Object.values(Game.creeps).map(c => `${c.name}: ${c.ticksToLive}\n`);
  }

  return {
    creeps: {
      bodies: getBodyCompositions(),
      life: getTicksToLive()
    }
  }
}

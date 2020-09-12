export function CleanMemory(): void {
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      if (Memory.creeps[name].source) {
        const source = Memory.creeps[name].source || "";
        if (Memory.sources[source]) {
          Memory.sources[source].creeps = Memory.sources[source].creeps
            .filter(c => c !== name);
        }
      }
      delete Memory.creeps[name];
    }
  }
}

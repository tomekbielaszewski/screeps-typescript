export function measure(fn: () => void, name: string): void {
  const start = Game.cpu.getUsed();
  fn();
  const end = Game.cpu.getUsed();
  Memory.mainComponentsTime = Memory.mainComponentsTime || {};
  _.set(Memory.mainComponentsTime, name, end - start);
}

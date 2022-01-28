export function MultimeterWatcher(): void {
  if (!(Memory.watch && typeof Memory.watch == "object")) {
    Memory.watch = {};
  }
  if (!(Memory.watch.expressions && typeof Memory.watch.expressions == "object")) {
    Memory.watch.expressions = {};
  }
  if (!(Memory.watch.values && typeof Memory.watch.values == "object")) {
    Memory.watch.values = {};
  }

  for (const [out, exp] of Object.entries(Memory.watch.expressions)) {
    if (!exp) return;
    let result;
    try {
      // eslint-disable-next-line no-eval
      result = eval(exp);
    } catch (e) {
      result = `Error: ${e.message}`;
    }
    if (result) {
      if (out === "console") {
        console.log(result)
      } else {
        Memory.watch.values[out] = result;
      }
    }
  }
}

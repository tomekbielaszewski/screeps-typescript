export function PixelGenerator() {
  if (Game.cpu.bucket >= 9999) {
    if (Game.cpu.generatePixel)
      Game.cpu.generatePixel();
  }
}

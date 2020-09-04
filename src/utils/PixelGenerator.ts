export function PixelGenerator() {
  if(Game.cpu.bucket >= 9999) {
    Game.cpu.generatePixel();
  }
}

import {SerializablePosition} from "../../../utils/Serializables";

export interface Pattern {
  run(onEach: (pos: SerializablePosition) => void): SerializablePosition[]
}

export class Direction {
  public static LEFT: Direction = new Direction(-1, 0)
  public static RIGHT: Direction = new Direction(1, 0)
  public static UP: Direction = new Direction(0, -1)
  public static DOWN: Direction = new Direction(0, 1)

  private readonly dx: number
  private readonly dy: number
  private readonly oppositeX: number
  private readonly oppositeY: number

  private constructor(dx: number, dy: number) {
    this.dx = dx;
    this.dy = dy;
    this.oppositeX = -dx
    this.oppositeY = -dy
  }

  public move(pos: SerializablePosition): void {
    pos.x += this.dx
    pos.y += this.dy
  }

  public moveOpposite(pos: SerializablePosition): void {
    pos.x += this.oppositeX
    pos.y += this.oppositeY
  }

  public isVertical(): boolean {
    return this.dy !== 0
  }

  public isHorizontal(): boolean {
    return !this.isVertical()
  }
}

export class DirectionalPattern implements Pattern {
  private readonly from: SerializablePosition
  private readonly length: number
  private readonly directions: Direction[]

  public constructor(from: SerializablePosition, length: number, ...directions: Direction[]) {
    this.from = from;
    this.length = length
    this.directions = directions
  }

  public run(onEach?: (pos: SerializablePosition) => void): SerializablePosition[] {
    const positions: SerializablePosition[] = []
    let counter = 0
    let currentPosition = SerializablePosition.clone(this.from)

    if (onEach) onEach(this.from)
    positions.push(this.from)

    while (counter < this.length) {
      currentPosition = SerializablePosition.clone(currentPosition)
      const direction = this.directions[counter % this.directions.length]

      direction.move(currentPosition)

      if (onEach) onEach(currentPosition)
      positions.push(currentPosition)

      counter++
    }

    return positions
  }
}

export class StairsPattern implements Pattern {
  private readonly pattern: DirectionalPattern

  public constructor(from: SerializablePosition, length: number, dir1?: Direction, dir2?: Direction) {
    dir1 = dir1 || Direction.RIGHT;
    dir2 = dir2 || Direction.DOWN;
    this.pattern = new DirectionalPattern(from, length, dir1, dir2)
  }

  public run(onEach?: (pos: SerializablePosition) => void): SerializablePosition[] {
    return this.pattern.run(onEach)
  }
}

export class DoubleStairsPattern implements Pattern {
  private readonly upperStairsPattern: StairsPattern
  private readonly lowerStairsPattern: StairsPattern

  public constructor(from: SerializablePosition, length: number, dir1?: Direction, dir2?: Direction) {
    dir1 = dir1 || Direction.RIGHT
    dir2 = dir2 || Direction.DOWN
    const from2 = SerializablePosition.clone(from)
    dir1.isVertical() ? dir1.move(from2) : dir1.moveOpposite(from2) // eslint-disable-line @typescript-eslint/no-unused-expressions
    dir2.isVertical() ? dir2.move(from2) : dir2.moveOpposite(from2) // eslint-disable-line @typescript-eslint/no-unused-expressions
    this.upperStairsPattern = new StairsPattern(from, length, dir1, dir2)
    this.lowerStairsPattern = new StairsPattern(from2, length, dir1, dir2)
  }

  public run(onEach: (pos: SerializablePosition) => void): SerializablePosition[] {
    const positions: SerializablePosition[] = []
    positions.push(...this.upperStairsPattern.run(onEach))
    positions.push(...this.lowerStairsPattern.run(onEach))
    return positions
  }
}

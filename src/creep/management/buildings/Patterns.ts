import {SerializablePosition} from "../../../utils/Serializables";

export interface Pattern {
  run(): SerializablePosition[]
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

  public run(): SerializablePosition[] {
    const positions: SerializablePosition[] = []
    let counter = 0
    let currentPosition = this.from.clone()

    positions.push(this.from.clone())

    while (positions.length <= this.length) {
      currentPosition = currentPosition.clone()
      const direction = this.directions[counter % this.directions.length]

      direction.move(currentPosition)

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

  public run(): SerializablePosition[] {
    return this.pattern.run()
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

  public run(): SerializablePosition[] {
    const positions: SerializablePosition[] = []
    positions.push(...this.upperStairsPattern.run())
    positions.push(...this.lowerStairsPattern.run())
    return positions
  }
}

export class SpiralPattern implements Pattern {
  private readonly start: SerializablePosition;
  private readonly levels: number;

  public constructor(from: SerializablePosition, levels: number) {
    this.start = SerializablePosition.clone(from)
    this.levels = levels
  }

  public run(): SerializablePosition[] {
    const positions: SerializablePosition[] = []
    const currentPosition: SerializablePosition = this.start.clone()
    let currentLevel = 1

    while (currentLevel < this.levels) {
      positions.push(...this.repeat(currentPosition, Direction.UP, 1))
      positions.push(...this.repeat(currentPosition, Direction.RIGHT, (2 * currentLevel) - 1))
      positions.push(...this.repeat(currentPosition, Direction.DOWN, (2 * currentLevel)))
      positions.push(...this.repeat(currentPosition, Direction.LEFT, (2 * currentLevel)))
      positions.push(...this.repeat(currentPosition, Direction.UP, (2 * currentLevel)))

      currentLevel++
    }

    return positions
  }

  private repeat(from: SerializablePosition, dir: Direction, amount: number): SerializablePosition[] {
    const positions: SerializablePosition[] = []

    for (let i = 0; i < amount; i++) {
      dir.move(from)
      positions.push(from.clone())
    }

    return positions
  }
}

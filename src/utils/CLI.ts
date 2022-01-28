import {findLowHpStructures} from "../creep/fsm/runner/common/Repairing";
import {NamedLogger} from "./Logger";

export const cli = {
  help,
  sellEnergy,
  checkTerminal,
  creeps: {
    body,
    life,
    spawn,
  },
  rooms: {
    visible,
    makePlan,
  },
  buildings: {
    hits,
    repair: {
      fortifications,
      wall,
      rampart,
      lowhp,
      hysteresis,
      findLowhp,
    }
  },
  log: {
    state,
  }
}

const log = new NamedLogger("CLI")

function help(): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return JSON.stringify(cli, (key, val) => (typeof val === 'function') ? 'f()' : val, 4);
}

function body(): string {
  return Object.values(Game.creeps)
  .map(c => `${c.name}: ${c.body.map(b => b.type)}`)
  .reduce((a, b) => a + "\n" + b);
}

function life(): string {
  return Object.values(Game.creeps)
  .map(c => `${c.name}: ${c.ticksToLive}`)
  .reduce((a, b) => a + "\n" + b);
}

function spawn(spawnName: string, bodyParts: string[], role: string): string {
  if (!bodyParts || bodyParts.length === 0 || !role) return `Spawns creep. Usage: spawn('Spawn1', ['move'], 'scout')`
  const structureSpawn = Game.spawns[spawnName]
  const result = structureSpawn.spawnCreep(bodyParts as BodyPartConstant[], `${Game.time}:${role}`, {
    memory: {
      role,
      room: structureSpawn.room.name
    }
  })
  switch (result) {
    case OK:
      return "ok"
  }
  return `something went wrong: ${result}`
}

function hits(): string {
  return Object.values(Game.rooms)
  .map(room => room.find(FIND_STRUCTURES))
  .reduce((a, b) => a.concat(b), [])
  .sort((s1, s2) => (s1.hits / s1.hitsMax) - (s2.hits / s2.hitsMax))
  .map(c => `[${c.room.name}] ${c.structureType}: ${c.hits}/${c.hitsMax} [${(c.hits / c.hitsMax).toFixed(2)}]`)
  .reduce((a, b) => a + "\n" + b, "Structures:\n");
}

function fortifications(setting?: boolean): string {
  if (!setting) return `Sets if fortifications will be repaired. Current setting: ${Memory.repair.fortifications}`

  Memory.repair.fortifications = setting
  return setting as unknown as string
}

function wall(setting?: number): string {
  if (!setting) return `Sets max hp to which wall will be repaired. Current setting: ${Memory.repair.wall}`

  Memory.repair.wall = setting
  return setting as unknown as string
}

function rampart(setting?: number): string {
  if (!setting) return `Sets max hp to which rampart will be repaired. Current setting: ${Memory.repair.rampart}`

  Memory.repair.rampart = setting
  return setting as unknown as string
}

function lowhp(setting?: number): string {
  if (!setting) return `Sets HP percentage which is considered low HP and should be repaired. Current setting: ${Memory.repair.lowHP}`

  Memory.repair.lowHP = setting
  return setting as unknown as string
}

function findLowhp(roomName?: string, repairFortification?: boolean): string {
  if (!roomName) return `Shows a list of low HP structures in room. Usage findLowhp(roomName:string, repairFortification: boolean)`
  if (!repairFortification) repairFortification = (Memory.repair.fortifications === true)

  return findLowHpStructures(Game.rooms[roomName], repairFortification)
  .sort((s1, s2) => (s1.hits / s1.hitsMax) - (s2.hits / s2.hitsMax))
  .map(c => `[${c.room.name}] ${c.structureType}: ${c.hits}/${c.hitsMax} [${(c.hits / c.hitsMax).toFixed(2)}]`)
  .reduce((a, b) => a + "\n" + b, "Damaged structures:\n");
}

function hysteresis(setting?: number): string {
  if (!setting) return `Sets HP repair hysteresis. Current setting: ${Memory.repair.hysteresis}`

  Memory.repair.hysteresis = setting
  return setting as unknown as string
}

function state(setting?: boolean): string {
  if (!setting) return `Sets whether to log creep state changes. Current setting: ${Memory.log.state}`

  Memory.log.state = setting
  return setting as unknown as string
}

function visible(): string {
  return `Visible rooms:\n` +
    Object.values(Game.rooms)
    .map(room => `[${room.name}] controller:${room.controller?.level} owner:${room.controller?.owner?.username}`)
    .join('\n')
}

function makePlan(roomName: string): string {
  if (!roomName) return `Schedules room planning`

  Memory.rooms[roomName] = Memory.rooms[roomName] || {links: [], plan: {}}
  const roomPlan = Memory.rooms[roomName].plan || {} as RoomPlanMemory
  roomPlan.isEligible = true
  return `Plan for room ${roomName} will be created when room will be visible`
}

function sellEnergy(amount: number, roomName: string, minGrossPrice: number): string {
  if (!amount || !roomName) return `Sells given amount of energy to best deal. sellEnergy(amount, roomName)`
  if (!minGrossPrice) {
    log.log(`No minimum gross price. You will sell for any price`)
    minGrossPrice = 0
  }

  let orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: RESOURCE_ENERGY})
  .map(o => ({...o, transactionAmount: Math.min(o.remainingAmount, amount)}))
  .map(o => ({...o, cost: Game.market.calcTransactionCost(o.transactionAmount, roomName, o.roomName as string)}))
  .map(o => ({...o, energySpent: o.transactionAmount + o.cost}))
  .map(o => ({...o, gain: o.transactionAmount * o.price}))
  .map(o => ({...o, grossPrice: o.gain / o.energySpent}))
  .map(o => ({...o, sortedBy: o.grossPrice}))
  .sort((o1, o2) => o2.sortedBy - o1.sortedBy)

  log.log(`Found ${orders.length} transactions on market`)
  orders = orders.filter(o => o.grossPrice >= minGrossPrice)
  log.log(`And ${orders.length} are matching your criteria of minimum gross price ${minGrossPrice}`)

  if (!orders.length) return "No matching orders on the market"

  const best = orders[0]

  log.log(`Trying to make a deal ${best.id}: ${best.transactionAmount} energy for ${best.price} and it will cost ${best.cost}...`)

  const result = Game.market.deal(best.id, best.transactionAmount, roomName)
  const terminal = Game.rooms[roomName].terminal

  switch (result) {
    case OK:
      return `You sold ${best.transactionAmount} of energy gaining ${best.gain} credits. Price ${best.price} (Gross price ${best.grossPrice}). Transaction energy fee ${best.cost}`
    case ERR_NOT_ENOUGH_RESOURCES:
      return `Not enough resources. There is ${terminal?.store.energy} energy left on terminal`
    case ERR_TIRED:
      return `Still cooling down. Will be ready at ${(terminal?.cooldown || 0) + Game.time}`
    case ERR_NOT_OWNER:
      return `No terminal in room ${roomName}`
    case ERR_FULL:
      return "To many deals in one tick"
  }

  return "This shouldn't happen"
}

function checkTerminal(roomName: string): string {
  if (!roomName) return `Checks resources in terminal: checkTerminal(roomName)`

  const terminal = Game.rooms[roomName].terminal;
  if (!terminal) return "No terminal in room"

  return (terminal.cooldown ? `Cooldown: \t\t${terminal.cooldown}\n` : "") + Object.entries(terminal.store)
  .map(([resource, amount]) => `${resource}:\t${amount}`)
  .join("\n")
}

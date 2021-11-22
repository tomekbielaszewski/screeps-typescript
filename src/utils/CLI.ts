import {findLowHpStructures} from "../creep/fsm/runner/common/Repairing";

export const cli = {
  help,
  sellEnergy,
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

function help(): string {
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
  if (setting === undefined) return `Sets if fortifications will be repaired. Current setting: ${Memory.repair.fortifications}`
  Memory.repair.fortifications = setting
  return setting as unknown as string
}

function wall(setting?: number): string {
  if (setting === undefined) return `Sets max hp to which wall will be repaired. Current setting: ${Memory.repair.wall}`
  Memory.repair.wall = setting
  return setting as unknown as string
}

function rampart(setting?: number): string {
  if (setting === undefined) return `Sets max hp to which rampart will be repaired. Current setting: ${Memory.repair.rampart}`
  Memory.repair.rampart = setting
  return setting as unknown as string
}

function lowhp(setting?: number): string {
  if (setting === undefined) return `Sets HP percentage which is considered low HP and should be repaired. Current setting: ${Memory.repair.lowHP}`
  Memory.repair.lowHP = setting
  return setting as unknown as string
}

function findLowhp(roomName?: string, repairFortification?: boolean): string {
  if (roomName === undefined) return `Shows a list of low HP structures in room. Usage findLowhp(roomName:string, repairFortification: boolean)`
  if (repairFortification === undefined) repairFortification = (Memory.repair.fortifications === true)
  return findLowHpStructures(Game.rooms[roomName], repairFortification)
  .sort((s1, s2) => (s1.hits / s1.hitsMax) - (s2.hits / s2.hitsMax))
  .map(c => `[${c.room.name}] ${c.structureType}: ${c.hits}/${c.hitsMax} [${(c.hits / c.hitsMax).toFixed(2)}]`)
  .reduce((a, b) => a + "\n" + b, "Damaged structures:\n");
}

function hysteresis(setting?: number): string {
  if (setting === undefined) return `Sets HP repair hysteresis. Current setting: ${Memory.repair.hysteresis}`
  Memory.repair.hysteresis = setting
  return setting as unknown as string
}

function state(setting?: boolean): string {
  if (setting === undefined) return `Sets whether to log creep state changes. Current setting: ${Memory.log.state}`
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
  if (roomName === undefined) return `Schedules room planning`
  Memory.rooms[roomName] = Memory.rooms[roomName] || {links: [], plan: {}}
  const roomPlan = Memory.rooms[roomName].plan || {} as RoomPlanMemory
  roomPlan.isEligible = true
  return `Plan for room ${roomName} will be created when room will be visible`
}

function sellEnergy(amount: number, roomName: string): string {
  if (amount === undefined) return `Sells given amount of energy to best deal. sellEnergy(amount, roomName)`

  const orders = Game.market.getAllOrders({type: ORDER_BUY, resourceType: RESOURCE_ENERGY})
  .filter(o => o.price < 10)
  .map(o => ({
    ...o,
    cost: Game.market.calcTransactionCost(Math.min(o.amount, amount), roomName, o.roomName as string)
  }))
  .map(o => ({...o, gain: Math.min(amount, o.amount) * o.price}))
  .sort((o1, o2) => o2.gain - (o2.cost * o2.price) - o1.gain - (o1.cost * o1.price))

  let count = 0
  let totalAmount = 0
  let totalCost = 0
  let totalGain = 0
  let additionalMessage = ""

  for (const order of orders) {
    count++
    const currentAmount = Math.min(amount - totalAmount, order.amount)
    const result = Game.market.deal(order.id, currentAmount, roomName)

    if (result === OK) {
      totalAmount += currentAmount
      totalCost += order.cost
      totalGain += order.gain
    } else {
      additionalMessage = `Transaction number ${count} resulted with error ${result}\n`
      break;
    }

    if (totalAmount >= amount) break;
    if (count >= 10) break
  }
  // const best = orders[0];
  // const result = Game.market.deal(best.id, amount, roomName)

  return additionalMessage + `You sold ${totalAmount} of energy gaining ${totalGain} credits in ${count} transactions. Avg price ${totalGain / totalAmount}. Transaction energy fee ${totalCost})`
  // else if(result === ERR_NOT_ENOUGH_RESOURCES)
  //   return `You don't have enough energy to cover transaction cost. Amount to sell ${amount} + transaction cost ${best.cost} = ${amount + best.cost}`
  // else
  //   return `Result from the deal was not successful: ${result}`
}

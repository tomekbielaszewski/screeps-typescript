import {cli} from "./CLI";

export function GlobalsInitialization() {
  global.legacy = false;
  global.cli = cli;

  Memory.features = Memory.features || {}
  Memory.repair = Memory.repair || {}
  Memory.containers = Memory.containers || {}
  Memory.log = Memory.log || {}
  Memory.rooms = Memory.rooms || {}
}

export function RoomMemoryInitialization(room: Room) {
  Memory.rooms[room.name] = Memory.rooms[room.name] || {
    links: {}
  }
}

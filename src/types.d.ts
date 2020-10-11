// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any
    legacy: boolean
    cli: any
  }
}

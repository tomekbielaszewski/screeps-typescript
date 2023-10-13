# TODO:

- room planner
    - stop placing CSites if all attempts lead to ERR_RCL_NOT_ENOUGH, wait for larger RCL
    - listen to building destroyed event - restart placing CSites
    - place CSites based on priorities - test the existing code
    - reset already placed CSites when RCL increases - may change which building has biggest priority

- creeper renew
    - test if this is actually economic (creep memory already has some stats)
    - renew available only for the top tier size of a creep - not worth doing that for small ones
    - implement into
        - upgrader
        - carrier
    - do not implement in can-miner - we will spawn new one just before the old dies. It has very little MOVE parts

- [ ] can miner
    - [x] state machine
    - [ ] remote support
    - [ ] tested

- scout
    - [ ] state machine
    - [ ] walking in nearby rooms
    - [ ] collecting intel
        - [ ] sources
        - [ ] roomtype
        - [ ] structures
        - [ ] creeps
        - [ ] room owner
        - [ ] mineral

- spawning
    - [ ] based on need
        - [ ] miners = sources amount
        - [ ] scouts = 1
        - [ ] harvesters = 1 (if no miners)
        - [ ] carriers = miners + 1 (for upgraders)
        - [ ] upgraders = RCL < 8 -> as many as possible, as big as possible, RCL 8 -> 1
        - [ ] builders = up to 2 based on need (damaged structures, csites)
        - [ ] cleaner = ruins, big tombstones, big dropped res
    - setting initial vars (miners source)



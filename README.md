# TODO:

- [] can miner
    - [x] state machine
    - [] remote support
    - [] tested

- scout
    - [] state machine
    - [] walking in nearby rooms
    - [] collecting intel
        - [] sources
        - [] roomtype
        - [] structures
        - [] creeps
        - [] room owner
        - [] mineral

- spawning
    - [] based on need
        - [] miners = sources amount
        - [] scouts = 1
        - [] harvesters = 1 (if no miners)
        - [] carriers = miners + 1 (for upgraders)
        - [] upgraders = RCL < 8 -> as many as possible, as big as possible, RCL 8 -> 1
        - [] builders = up to 2 based on need (damaged structures, csites)
        - [] cleaner = ruins, big tombstones, big dropped res
    - setting initial vars (miners source)



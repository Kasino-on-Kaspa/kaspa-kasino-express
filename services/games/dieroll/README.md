# Dieroll Game

## Game Overview
A dice rolling game where players bet on whether the result will be over or under a target number.

## Game Flow

1. **Session Initialization**
   - Player requests a new session
   - Server generates server seed for fairness

2. **Betting Phase**
   - Player places a bet
   - Player selects:
     - Condition: OVER or UNDER
     - Target number
   - Balance is deducted from player's account

3. **Game Phase**
   - Dice roll is determined using server seed + client seed
   - Result is calculated using SHA512 and SHA256 HMAC
   - Number range: 1-98
   - Win conditions:
     - OVER: Result must be higher than target
     - UNDER: Result must be lower than target

4. **Result Phase**
   If player wins:
   - Enters BET_SETTLE state
   - Winnings are calculated
   
   If player loses:
   - Moves to BET_FULFILLED state
   - Session ends

## Game States
- BETTING: Initial bet placement
- ROLLING: Dice roll in progress
- ENDED: Game conclusion

## Messages
### Server → Client
- `dieroll:game_state`: Current game state
- `dieroll:bet_placed`: Bet confirmation
- `dieroll:roll_result`: Dice roll outcome
- `dieroll:error`: Error notifications
- `dieroll:game_ended`: Game conclusion 
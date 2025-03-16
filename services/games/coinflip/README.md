# Coinflip Game

## Game Overview
A simple coin flip gambling game where players can bet on either HEADS or TAILS.

## Game Flow

1. **Session Initialization**
   - Player requests a new session
   - Server generates server seed and provides hash to client
   - Previous session is checked and restored if applicable

2. **Betting Phase**
   - Player places a bet with initial amount
   - Balance is deducted from player's account
   - Game enters GAME_SETTLE state

3. **Game Phase**
   - Player chooses HEADS or TAILS
   - Result is determined using server seed + client seed
   - Result is calculated using SHA512 and SHA256 HMAC for fairness

4. **Result Phase**
   If player wins:
   - Enters BET_SETTLE state
   - Player can choose to:
     - CASHOUT: Collect winnings
     - CONTINUE: Play another round with current winnings
   
   If player loses:
   - Game moves to BET_FULFILLED state
   - Session ends

5. **Special Cases**
   - If all sockets associated to a player disconnects during BET_SETTLE, game is marked as PENDING
   - Previous sessions can be restored when player reconnects

## Game States
- BETTING: Initial bet placement
- FLIPPING: Coin flip in progress
- ENDED: Game conclusion

## Messages
### Client → Server
- `coinflip:place_bet`: Place initial bet
- `coinflip:flip_coin`: Make HEADS/TAILS choice
- `coinflip:leave_game`: Exit the game

### Server → Client
- `coinflip:game_state`: Current game state updates
- `coinflip:bet_placed`: Bet confirmation
- `coinflip:flip_result`: Coin flip result
- `coinflip:error`: Error notifications
- `coinflip:game_ended`: Game conclusion 
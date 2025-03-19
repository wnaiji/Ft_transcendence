import time
import random
import asyncio
import json

from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from .state import keyboard, in_game, disconnected, locks
from .db_operations import (
    clear_one_v_one_tournament_db
)

# tournament_name
#   None => 1v1
#   uuid4 => tournament
async def start_game(self, p1_id, p2_id, tournament_name):
    p1 = await database_sync_to_async(get_user_model().objects.get)(id=p1_id)
    p2 = await database_sync_to_async(get_user_model().objects.get)(id=p2_id)
    # time forgiveness player for disconnection max 60sec before ending the game
    forgiveness_p1 = [60]
    forgiveness_p2 = [60]

    from transcendence_app.models import Game
    game = await database_sync_to_async(Game.objects.create)(player1=p1, player2=p2, tournament_name=tournament_name)

    channel_game = f"{p1_id}_{p2_id}"

    async with locks[p1_id]:
        in_game[p1_id] = channel_game
    async with locks[p2_id]:
        in_game[p2_id] = channel_game



    # add to the channel_game our two players
    await self.channel_layer.group_send(
        str(p1_id),
        {
            "type": "redirect_group_add_discard",
            "mode": 0,
            "name": channel_game
        })
    await self.channel_layer.group_send(
        str(p2_id),
        {
            "type": "redirect_group_add_discard",
            "mode": 0,
            "name": channel_game
        })
    
    await asyncio.sleep(2) # bad fix

    # to respect a rule of the subject 'warn users'
    if (tournament_name != None):
        await self.channel_layer.group_send(
            channel_game,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "TOAST",
                    "variant": "info",
                    "message": f"Tournament \"{tournament_name[:5]}...\": 1V1 Game \"{p1.username}\" vs \"{p2.username}\", will start in 10 seconds.",
                    "duration": 10000
                    }
            }
        )
        timestamp = int(time.time()) 
        await self.channel_layer.group_send(
            tournament_name,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "INFO",
                    "lobby": True,
                    "message": f"Tournament \"{tournament_name[:5]}...\": 1V1 Game Created \"{p1.username}\" vs \"{p2.username}\"",
                    "timestamp": timestamp
                    }
            }
        )
        await asyncio.sleep(10) # 10 sec to warn the user
    else:
        timestamp = int(time.time())
        await self.channel_layer.group_send(
            str(p1_id),
            {
                "type": "redirect_receive",
                "data": {
                    "key": "INFO",
                    "lobby": False,
                    "message": f"Classical 1V1 Game Created \"{p1.username}\" vs \"{p2.username}\"",
                    "timestamp": timestamp
                    }
            }
        )
        await self.channel_layer.group_send(
            str(p2_id),
            {
                "type": "redirect_receive",
                "data": {
                    "key": "INFO",
                    "lobby": False,
                    "message": f"Classical 1V1 Game Created \"{p1.username}\" vs \"{p2.username}\"",
                    "timestamp": timestamp
                    }
            }
        )

    
    await self.channel_layer.group_send(
        channel_game,
        {
            "type": "redirect_receive",
            "data": {
                "key": "REDIRECT",
                "page": 3 # 3 is game
            }
        })
    
    # here update everyone data in frontend
    results = calculate_elo(p1.elo, p2.elo)
    await self.channel_layer.group_send(
        str(p1_id),
        {
            "type": "redirect_receive",
            "data": {
                "key": "MODAL",
                "mode": 1,
                "tournament_name": tournament_name,
                "agains": p2.username,
                "elo_win_lose": results[:2], # get the two first
                "is_left": True
            }
        })
    await self.channel_layer.group_send(
        str(p2_id),
        {
            "type": "redirect_receive",
            "data": {
                "key": "MODAL",
                "mode": 1,
                "tournament_name": tournament_name,
                "agains": p1.username,
                "elo_win_lose": results[2:], # get the two last
                "is_left": False
            }
        })


    countdown = 30 # change back to 30 TODO TOSEE 
    for i in range(countdown, -1, -1):
        await self.channel_layer.group_send(
            channel_game,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "GAME_COUNTDOWN",
                    "value": i,
                    "mode" : 1
                }
            })
        await asyncio.sleep(1)


    # run the game
    # move game
    TICK_INTERVAL = 1.0 / 64.0
    CHECK_DISCONNECT = 0.5
    disconnection_check_timer = 0.0

    #game variables based on 4:3
    SCREEN_WIDTH = 4.0
    SCREEN_HEIGHT = 3.0
    # M/sec for 4M ref, this vector change with hits <4/<12/+
    VELOCITY_X = [1.04, 1.56, 2.12]
    # M/sec for 3M ref
    VELOCITY_Y = [0, 0.678, 1.39, 2.08]
    RANDOMNESS_VELOCITY = 0.1
    # based on LAWN_TENNIS ball height 262 but 240 visible so 3M (4/240 * SCREEN_HEIGHT)
    # for simplicity no calcul ball width
    BALL_SIZE = 0.05
    # 1/80 of SCREEN_WIDTH
    PADDLE_WIDTH = 0.05
    # 15 lines in 240 or 262 ? so (15 / 240 * SCREEN_HEIGHT 0.1875 or if 262 0.171 so approx 0.18) To small 0.3
    PADDLE_HEIGHT = 0.3
    PADDLE_VELOCITY_Y = 4 # test
    
    # Move the paddle a little right and left
    PADDLE_ALIGN = 0.3

    hits = 0
    points_l = 0
    points_r = 0

    ball_position_x = 2.0 # SCREEN_WIDTH / 2
    ball_position_y = 1.5 # SCREEN_HEIGHT / 2
    ball_velocity_x = VELOCITY_X[0] * random.choice([1, -1])
    ball_velocity_y = random.choice(VELOCITY_Y) * random.choice([1, -1]) #VELOCITY_Y[random.randint(0, 3)]
    paddle_left_y = 1.5 # SCREEN_HEIGHT / 2
    paddle_right_y = 1.5 # SCREEN_HEIGHT / 2

    def reset_ball():
        nonlocal hits, ball_position_x, ball_position_y, ball_velocity_x, ball_velocity_y, paddle_left_y, paddle_right_y
        hits = 0
        ball_position_x = 2.0 # SCREEN_WIDTH / 2
        ball_position_y = 1.5 # SCREEN_HEIGHT / 2
        ball_velocity_x = VELOCITY_X[0] * random.choice([1, -1]) # VELOCITY_X[0] depend on the version of game
        ball_velocity_y = random.choice(VELOCITY_Y) * random.choice([1, -1]) #VELOCITY_Y[random.randint(0, 3)]

    def adjust_ball_velocity(paddle_y):
        nonlocal hits, ball_position_y, ball_velocity_x

        relative_position = ball_position_y - (paddle_y - PADDLE_HEIGHT / 2)
        zone_height = PADDLE_HEIGHT / 8.0

        # print(f" hit {hits}  ZONE HIT {int(relative_position // zone_height)} with zone_height={zone_height}, "f"paddle_y={paddle_y}, ball_y={ball_position_y}")

        if relative_position < zone_height:
            # print("zone 1")
            new_velocity_y = VELOCITY_Y[3] * -1
        elif relative_position < zone_height * 2:
            # print("zone 2")
            new_velocity_y = VELOCITY_Y[2] * -1
        elif relative_position < zone_height * 3:
            # print("zone 3")
            new_velocity_y = VELOCITY_Y[1] * -1
        elif relative_position < zone_height * 5:
            # print("zone 4-5")
            new_velocity_y = VELOCITY_Y[0]
        elif relative_position < zone_height * 6:
            # print("zone 6")
            new_velocity_y = VELOCITY_Y[1]
        elif relative_position < zone_height * 7:
            # print("zone 7")
            new_velocity_y = VELOCITY_Y[2]
        else:
            # print("zone 8")
            new_velocity_y = VELOCITY_Y[3]

        # to avoid game lock
        new_velocity_y += random.uniform(-RANDOMNESS_VELOCITY, RANDOMNESS_VELOCITY)

        if hits < 4:
            new_velocity_x = VELOCITY_X[0]
            # print("speed 1")
        elif hits < 12:
            new_velocity_x = VELOCITY_X[1]
            # print("speed 2")
        else:
            new_velocity_x = VELOCITY_X[2]
            # print("speed 3")

        new_velocity_x *= (1 if ball_velocity_x < 0 else -1)

        return new_velocity_x, new_velocity_y
    
    last_time = time.perf_counter()
    while True:
        now = time.perf_counter()
        dt = now - last_time
        # last_time = now

        # check for disconnected player only every CHECK_DISCONNECT
        disconnection_check_timer += dt
        if disconnection_check_timer >= CHECK_DISCONNECT:
            # print(f"ball_velocity_x={ball_velocity_x} ball_velocity_y={ball_velocity_y}")
            disconnection_check_timer = 0.0
            game_tick_last_data = [
                ball_position_x,
                ball_position_y,
                paddle_left_y,
                paddle_right_y,
                points_l,
                points_r
            ]
            if await handle_player_disconnection(self, p1_id, forgiveness_p1, channel_game, game_tick_last_data):
                forgiveness_p1 = -42
                break
            if await handle_player_disconnection(self, p2_id, forgiveness_p2, channel_game, game_tick_last_data):
                forgiveness_p2 = -42
                break

        last_time = time.perf_counter()

        #game logic here
        ball_position_x += ball_velocity_x * dt
        ball_position_y += ball_velocity_y * dt

        # FF
        async with locks[p1_id]:
            if (keyboard[p1_id] != 0):
                paddle_left_y += keyboard[p1_id] * PADDLE_VELOCITY_Y * dt
        async with locks[p2_id]:
            if (keyboard[p2_id] != 0):
                paddle_right_y += keyboard[p2_id] * PADDLE_VELOCITY_Y * dt

        if (paddle_left_y < PADDLE_HEIGHT / 2):
            paddle_left_y = PADDLE_HEIGHT / 2
        elif (paddle_left_y > SCREEN_HEIGHT - (PADDLE_HEIGHT / 2)):
            paddle_left_y = SCREEN_HEIGHT - (PADDLE_HEIGHT / 2)
        if (paddle_right_y < PADDLE_HEIGHT / 2):
            paddle_right_y = PADDLE_HEIGHT / 2
        elif (paddle_right_y > SCREEN_HEIGHT - (PADDLE_HEIGHT / 2)):
            paddle_right_y = SCREEN_HEIGHT - (PADDLE_HEIGHT / 2)

        # Wall up/down
        if ((ball_position_y - BALL_SIZE / 2 <= 0) and ball_velocity_y < 0) or \
            ((ball_position_y + BALL_SIZE / 2 >= SCREEN_HEIGHT) and ball_velocity_y > 0):
            ball_velocity_y *= -1

        # Paddle collision detection (left paddle)
        
        elif (ball_position_x - BALL_SIZE / 2 <= PADDLE_WIDTH + PADDLE_ALIGN and ball_position_x >= PADDLE_ALIGN and paddle_left_y - PADDLE_HEIGHT / 2 <= ball_position_y <= paddle_left_y + PADDLE_HEIGHT / 2) and ball_velocity_x < 0:
            hits += 1
            ball_velocity_x, ball_velocity_y = adjust_ball_velocity(paddle_left_y)

        # Paddle collision detection (right paddle)
        elif (ball_position_x + BALL_SIZE / 2 >= SCREEN_WIDTH - PADDLE_WIDTH - PADDLE_ALIGN and ball_position_x <= SCREEN_WIDTH - PADDLE_ALIGN and paddle_right_y - PADDLE_HEIGHT / 2 <= ball_position_y <= paddle_right_y + PADDLE_HEIGHT / 2) and ball_velocity_x > 0:
            hits += 1
            ball_velocity_x, ball_velocity_y = adjust_ball_velocity(paddle_right_y)

        # Scoring logic (left or right edge)
        elif ball_position_x < 0:
            points_r += 1
            if (points_r >= 11):
                reset_ball()
                break
            else:
                reset_ball()
        elif ball_position_x > SCREEN_WIDTH:
            points_l += 1
            if (points_l >= 11):
                reset_ball()
                break
            else:
                reset_ball()

        await self.channel_layer.group_send(
            channel_game,
            {
            "type": "redirect_receive",
            "data": {
                "key": "GAME_TICK",
                "ball_position": [ball_position_x, ball_position_y],
                "paddle_left": paddle_left_y,
                "paddle_right": paddle_right_y,
                "points": [points_l, points_r]
            }
            })
        # end game logic
        await asyncio.sleep(TICK_INTERVAL)

    # game end update and save to db
    game.player1_score = points_l
    game.player2_score = points_r

    results_elo = calculate_elo(p1.elo, p2.elo)

    # when win by forgiveness -42 set the score of the winner to 11 (to be safe that the game end)?
    if (forgiveness_p2 == -42 or points_l >= 11):
        points_l = 11
        p1.won_games += 1
        old_elo1 = p1.elo
        old_elo2 = p2.elo
        p1.elo += results_elo[0]
        p2.lost_games += 1
        p2.elo += results_elo[3]
        game.winner = game.player1
        if (tournament_name == None):
            await self.channel_layer.group_send(
                str(p1_id),
                {
                    "type": "redirect_receive",
                    "data": {
                        "key": "MODAL",
                        "mode": 2,
                        "win": True,
                        "tournament_name": tournament_name,
                        "agains": p2.username,
                        "old_elo": old_elo1,
                        "elo": p1.elo,
                        "eloDiff": p1.elo - old_elo1
                    }
                })
            await self.channel_layer.group_send(
                str(p2_id),
                {
                    "type": "redirect_receive",
                    "data": {
                        "key": "MODAL",
                        "mode": 2,
                        "win": False,
                        "tournament_name": tournament_name,
                        "agains": p1.username,
                        "old_elo": old_elo2,
                        "elo": p2.elo,
                        "eloDiff": p2.elo - old_elo2
                    }
                })
    elif (forgiveness_p1 == -42 or points_r >= 11):
        points_r = 11
        p1.lost_games += 1
        old_elo1 = p1.elo
        old_elo2 = p2.elo
        p1.elo += results_elo[1]
        p2.won_games += 1
        p2.elo += results_elo[2]
        game.winner = game.player2
        if (tournament_name == None):
            await self.channel_layer.group_send(
                str(p1_id),
                {
                    "type": "redirect_receive",
                    "data": {
                        "key": "MODAL",
                        "mode": 2,
                        "win": False,
                        "tournament_name": tournament_name,
                        "agains": p2.username,
                        "old_elo": old_elo1,
                        "elo": p1.elo,
                        "eloDiff": p1.elo - old_elo1
                    }
                })
            await self.channel_layer.group_send(
                str(p2_id),
                {
                    "type": "redirect_receive",
                    "data": {
                        "key": "MODAL",
                        "mode": 2,
                        "win": True,
                        "tournament_name": tournament_name,
                        "agains": p1.username,
                        "old_elo": old_elo2,
                        "elo": p2.elo,
                        "eloDiff": p2.elo - old_elo2
                    }
                })
            
    p1_before_save = await database_sync_to_async(get_user_model().objects.get)(id=p1_id)
    p2_before_save = await database_sync_to_async(get_user_model().objects.get)(id=p2_id)

    if p1_before_save.is_anonymise:
        print("p1 is anonymized, skipping save.")
    else:
        await database_sync_to_async(p1.save)()
    if p2_before_save.is_anonymise:
        print("p2 is anonymized, skipping save.")
    else:
        await database_sync_to_async(p2.save)()

    await database_sync_to_async(game.save)()

    await self.channel_layer.group_send(
        "ALL",
        {
            "type": "redirect_receive",
            "data": {
                    "key": "UPDATE",
                    "id": p1_id
                }
        })
    await self.channel_layer.group_send(
        "ALL",
        {
            "type": "redirect_receive",
            "data": {
                    "key": "UPDATE",
                    "id": p2_id
                }
        })
    
    async with locks[p1_id]:
        in_game[p1_id] = ""
        disconnected[p1_id] = 0
    async with locks[p2_id]:
        in_game[p2_id] = ""
        disconnected[p2_id] = 0

    if (tournament_name == None):
        affected_user_ids = await clear_one_v_one_tournament_db(p1, 0)
        for id in affected_user_ids:
            await self.channel_layer.group_send(
                str(id),
                {
                    "type": "redirect_receive",
                    "data": {
                        "key": "UPDATE",
                        "id": -2
                    }
                }
            )
        timestamp = int(time.time()) 
        await self.channel_layer.group_send(
            channel_game,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "INFO",
                    "lobby": False,
                    "message": f"Classical 1V1 Game Finished \"{p1.username}\" vs \"{p2.username}\". The winner is \"{game.winner.username}\"",
                    "timestamp": timestamp
                    }
            }
        )

        await self.channel_layer.group_send(
            channel_game,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "REDIRECT",
                    "page": 1 # is home
                }
            })
        
    else:
        await self.channel_layer.group_send(
            channel_game,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "REDIRECT",
                    "page": 2 # 2 is lobby
                }
            })
        timestamp = int(time.time()) 
        await self.channel_layer.group_send(
            tournament_name,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "INFO",
                    "lobby": True,
                    "message": f"Tournament \"{tournament_name[:5]}...\": 1V1 Game Finished \"{p1.username}\" vs \"{p2.username}\", The winner is \"{game.winner.username}\"",
                    "timestamp": timestamp
                    }
            }
        )
        
    # remove from the channel_game our two players
    await self.channel_layer.group_send(
        channel_game,
        {
            "type": "redirect_group_add_discard",
            "mode": 1,
            "name": channel_game
        })
    
    return game.winner.id




async def handle_player_disconnection(self, player_id, forgiveness, channel_game, game_tick_last_data):
    player_reconnected = False
    async with locks[player_id]:
        if disconnected[player_id] == 0:
            return False
    
    if (forgiveness[0] <= 0):
        return True

    for i in range(forgiveness[0], -1, -1):
        async with locks[player_id]:
            if disconnected[player_id] == 0:
                player_reconnected = True
                break
        await self.channel_layer.group_send(
            channel_game,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "GAME_COUNTDOWN",
                    "value": i,
                    "mode": 2,
                    "text": "Disconnected"
                }
            }
        )
        await asyncio.sleep(1)

    if not player_reconnected:
        return True
    
    # GAME_COUNTDOWN value 0 disable isInCountdown.current in frontend make the GMAE_TICK work again 
    await self.channel_layer.group_send(
        channel_game,
        {
            "type": "redirect_receive",
            "data": {
                "key": "GAME_COUNTDOWN",
                "value": 0,
                "mode": 1
            }
        }
    )

    # await asyncio.sleep(1) # bad fix

    await self.channel_layer.group_send(
        channel_game,
        {
        "type": "redirect_receive",
        "data": {
            "key": "GAME_TICK",
            "ball_position": [game_tick_last_data[0], game_tick_last_data[1]],
            "paddle_left": game_tick_last_data[2],
            "paddle_right": game_tick_last_data[3],
            "points": [game_tick_last_data[4], game_tick_last_data[5]]
            }
        }
    )
    await asyncio.sleep(1) # bad fix
    await self.channel_layer.group_send(
        channel_game,
        {
        "type": "redirect_receive",
        "data": {
            "key": "GAME_TICK",
            "ball_position": [game_tick_last_data[0], game_tick_last_data[1]],
            "paddle_left": game_tick_last_data[2],
            "paddle_right": game_tick_last_data[3],
            "points": [game_tick_last_data[4], game_tick_last_data[5]]
            }
        }
    )
    
    forgiveness[0] -= 15

    await asyncio.sleep(1) # bad fix

    for i in range(5, -1, -1):
        await self.channel_layer.group_send(
            channel_game,
            {
                "type": "redirect_receive",
                "data": {
                    "key": "GAME_COUNTDOWN",
                    "value": i,
                    "mode": 1
                }
            }
        )
        await asyncio.sleep(1)
 
    return False




def calculate_elo(p1_elo, p2_elo):
    expected_p1 = 1 / (1 + 10 ** ((p2_elo - p1_elo) / 400))
    expected_p2 = 1 / (1 + 10 ** ((p1_elo - p2_elo) / 400))
    win_p1 = round(42 * (1 - expected_p1))
    lose_p1 = round(42 * (0 - expected_p1))
    win_p2 = round(42 * (1 - expected_p2))
    lose_p2 = round(42 * (0 - expected_p2))
    return ([win_p1, lose_p1, win_p2, lose_p2])

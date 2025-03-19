import time
import random
import asyncio
import json
import uuid
import math

from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from .state import in_tournament, locks
from .game import start_game
from .db_operations import (
    clear_one_v_one_tournament_db
)
from tournament_app.views import add_score, set_tournament
from rest_framework.test import APIRequestFactory

async def start_tournament(self):
    tournament_name = str(uuid.uuid4())

    # Retrieve participants
    leader_user = await database_sync_to_async(get_user_model().objects.get)(id=self.user_id)
    related_users = await database_sync_to_async(lambda: list(leader_user.tournament.all()))()
    all_users = [leader_user] + related_users

    players_state = []

    for user in all_users:
        # Initialize player state
        players_state.append({
            'user': user,
            'points': 0,
            'past_opponents': []
        })

        await self.channel_layer.group_send(
            str(user.id),
            {
                "type": "redirect_group_add_discard",
                "mode": 0,
                "name": tournament_name
            }
        )
        async with locks[user.id]:
            in_tournament[user.id] = tournament_name


    await asyncio.sleep(2) # bad fix redirect_group_add_discard

    # Calculate number of rounds (ceil of log2)
    total_rounds = math.ceil(math.log2(len(all_users)))

    timestamp = int(time.time()) # epoch time in sec

    await self.channel_layer.group_send(
        tournament_name,
        {
            "type": "redirect_receive",
            "data": {
                "key": "INFO",
                "lobby": True,
                "message": f"\n\nTournament \"{tournament_name[:5]}...\": Created with a total of {total_rounds} rounds",
                "timestamp": timestamp
                }
        }
    )

    # ###### Step 2: Round Processing Loop
    for round_num in range(total_rounds):
        if round_num == 0:
            # First round: Sort by Elo (higher first)
            sorted_players = sorted(players_state, key=lambda x: -x['user'].elo)
        else:
            # Subsequent rounds: Sort by points only
            sorted_players = sorted(players_state, key=lambda x: -x['points'])

        timestamp = int(time.time()) # epoch time in sec

        for rank, player in enumerate(sorted_players, start=1):
            await self.channel_layer.group_send(
                str(player['user'].id),
                {
                    "type": "redirect_receive",
                    "data": {
                        "key": "INFO",
                        "lobby": True,
                        "message": f"Tournament \"{tournament_name[:5]}...: Round {round_num + 1}\n | Place: {ordinal(rank)} | Elo: {player['user'].elo} | Points: {player['points']}",
                        "timestamp": timestamp
                        }
                }
            )

        # Generate pairings
        pairings = []
        remaining = sorted_players.copy()

        # Handle odd players
        if len(remaining) % 2 != 0:
            bye_player = remaining.pop()
            pairings.append({'p1': bye_player, 'p2': None})
            bye_player['points'] += 1  # Award bye point

        # Pair remaining players
        while len(remaining) > 1:
            p1 = remaining.pop(0)
            opponent_index = find_opponent(p1, remaining)
            p2 = remaining.pop(opponent_index) if opponent_index is not None else remaining.pop(0)
            pairings.append({'p1': p1, 'p2': p2})

        # ####### Step 3: Match Execution and Result Handling
        # Start matches
        match_tasks = []
        for pair in pairings:
            if pair['p2'] is None:  # Handle bye
                await self.channel_layer.group_send(
                    str(pair['p1']['user'].id),
                    {
                        "type": "redirect_receive",
                        "data": {
                            "key": "MODAL",
                            "mode": 3,
                        }
                    })
                await self.channel_layer.group_send(
                    str(pair['p1']['user'].id),
                    {
                        "type": "redirect_receive",
                        "data": {
                            "key": "INFO",
                            "lobby": True,
                            "message": f"Tournament \"{tournament_name[:5]}...: You're the bye player this round, so you automatically receive 1 point",
                            "timestamp": timestamp
                            }
                    }
                )
            else:
                task = asyncio.create_task(
                    start_game(self, pair['p1']['user'].id, pair['p2']['user'].id, tournament_name)
                )
                match_tasks.append((task, pair['p1'], pair['p2']))

        # Process results
        if match_tasks:
            await asyncio.gather(*[t[0] for t in match_tasks])
            for task, p1_state, p2_state in match_tasks:
                winner_id = task.result() 
                # here need to update the db Users
                # print(f"\033[31m before p1State {p1_state['user'].elo}     pair p1 {pair['p1']['user'].elo}\033[0m")
                await sync_to_async(p1_state['user'].refresh_from_db)()
                # print(f"\033[31m after p1State {p1_state['user'].elo}     pair p1 {pair['p1']['user'].elo}\033[0m")
                await sync_to_async(p2_state['user'].refresh_from_db)()
                update_standings(players_state, p1_state, p2_state, winner_id)
        
    # reloop here

    # Determine final rankings (flaw for 3 players it will use elo to fix bias of swiss system)
    final_ranking = sorted(players_state, 
                         key=lambda x: (-x['points'], -x['user'].elo))

    # Send final results
    factory = APIRequestFactory()
    """Name Tournament"""
    request = factory.post("/internal/set/", {"name": tournament_name}, format='json')
    await sync_to_async(set_tournament)(request)
    """End Name Tournament"""
    for idx, player in enumerate(final_ranking):
        await self.channel_layer.group_send(
            str(player['user'].id),
            {
                "type": "redirect_receive",
                "data": {
                    "key": "TOAST",
                    "variant": "success",
                    "message": f"Tournament end, Cleaning the Tournament lobby in 20 seconds.",
                    "duration": 16000
                }
            }
        )

        """Send result in blockchain"""
        request = factory.post("/internal/score/add/", {
            "tournament_name": tournament_name,
            "player_address": player['user'].id,
            "score": player['points']
            }, format='json')
        await sync_to_async(add_score)(request)
        """End send result in blockchain"""

        # await self.channel_layer.group_send(
        #     str(player['user'].id),
        #     {
        #         "type": "redirect_receive",
        #         "data": {
        #             "key": "TOAST",
        #             "variant": "success",
        #             "message": f"Final position: {idx+1} (Points: {player['points']})",
        #             "duration": 30000
        #         }
        #     }
        # )
        timestamp = int(time.time()) # epoch time in sec
        await self.channel_layer.group_send(
            str(player['user'].id),
            {
                "type": "redirect_receive",
                "data": {
                    "key": "INFO",
                    "lobby": True,
                    "message": f"Tournament \"{tournament_name[:5]}...\": Finished Final Place: {ordinal(idx + 1)} | Elo: {player['user'].elo} | Points: {player['points']}",
                    "timestamp": timestamp
                    }
            }
        )

    await asyncio.sleep(20)

    # Cleanup
    await self.channel_layer.group_send(
        tournament_name,
        {
            "type": "redirect_receive",
            "data": {
                "key": "REDIRECT",
                "page": 1 # 1 is home
            }
        }
    )
    affected_user_ids = await clear_one_v_one_tournament_db(leader_user, 1)
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

    # remove lobby messages before ending tournament
    await self.channel_layer.group_send(
        tournament_name,
        {
            "type": "redirect_receive",
            "data": {
                "key": "INFO_CLEAR",
            }
        }
    )

    # remove from the channel_game our two players
    await self.channel_layer.group_send(
        tournament_name,
        {
            "type": "redirect_group_add_discard",
            "mode": 1,
            "name": tournament_name
        })
    for user in all_users:
        async with locks[user.id]:
            in_tournament[user.id] = ""


# ####### Step 4 helper fucntions
def find_opponent(player, candidates):
    for i, candidate in enumerate(candidates):
        if candidate['user'].id not in player['past_opponents']:
            return i
    return None  # No available non-rematch opponent

def update_standings(players_state, p1, p2, winner_id):
    for player in players_state:
        if player['user'].id == winner_id:
            player['points'] += 1
        if player['user'].id == p1['user'].id:
            player['past_opponents'].append(p2['user'].id)
        elif player['user'].id == p2['user'].id:
            player['past_opponents'].append(p1['user'].id)

def ordinal(n):
    if 11 <= (n % 100) <= 13:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"
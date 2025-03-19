from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
import json
import time
import asyncio

from .db_operations import (
    is_in_lobby_to_db,
    update_user_is_login_to_db,
    block_target_in_db,
    unblock_target_in_db,
    is_target_self_blocked,
    add_self_to_target_incoming_friends_in_db,
    accept_deny_target_friend_in_db,
    remove_friend_in_db,
    is_add_self_to_target_incoming_one_v_one_tournament_in_db,
    arr_accept_deny_target_one_v_one_tournament_in_db,
    status_kick_one_or_two_in_db,
    tuple_cancel_in_db,
    is_set_ready_not_db,
    game_state_db,
)

from collections import defaultdict
pressed_keys = defaultdict(set) # only needed here
from .state import keyboard, in_game, in_tournament, disconnected, locks
from .game import start_game
from .tournament import start_tournament

class Consumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope["user"].id

        await self.channel_layer.group_send( 
            "ALL",
            {
                "type": "redirect_receive",
                "data": {
                    "key": "UPDATE",
                    "id": self.user_id
                }
            })
        
        await self.channel_layer.group_add(str(self.user_id), self.channel_name)
        await self.channel_layer.group_add("ALL", self.channel_name)

        await self.accept()


        
        async with locks[self.user_id]:
            # here resub to the tournament if in one
            if (in_tournament[self.user_id] != ""):
                await self.channel_layer.group_send(
                    str(self.user_id),
                    {
                        "type": "redirect_group_add_discard",
                        "mode": 0,
                        "name": in_tournament[self.user_id]
                    })
                await asyncio.sleep(1) # bad fix
            # TOSEE can add broadcast to know that im reconnected from lobby

            if (in_game[self.user_id] != ""):
                await self.channel_layer.group_send(
                    str(self.user_id),
                    {
                        "type": "redirect_group_add_discard",
                        "mode": 0,
                        "name": in_game[self.user_id]
                    })
                await asyncio.sleep(1) # bad fix
                await self.send(text_data=json.dumps({
                    "key": "TOAST",
                    "variant": "danger",
                    "message": "Disconnected from Game, reconnecting..."
                    }))
                await self.send(text_data=json.dumps({
                            "key": "REDIRECT",
                            "page": 3 # 3 is game
                        }))
                await asyncio.sleep(1) # bad fix
                disconnected[self.user_id] = 0
            else:
                in_lobby = await is_in_lobby_to_db(self)
                if (in_lobby):
                    await self.send(text_data=json.dumps({
                        "key": "TOAST",
                        "variant": "danger",
                        "message": "Disconnected from Lobby, reconnecting..."
                        }))
                    await self.send(text_data=json.dumps({
                                "key": "REDIRECT",
                                "page": 2 # 2 is lobby
                            }))





    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("ALL", self.channel_name)
        await self.channel_layer.group_discard(str(self.user_id), self.channel_name)

        await update_user_is_login_to_db(self, False)

        await self.channel_layer.group_send(
            "ALL",
            {
                "type": "redirect_receive",
                "data": {
                    "key": "UPDATE",
                    "id": self.user_id
                }
            })
        # IS DISCONNECTED DURING GAME
        async with locks[self.user_id]:
            if (in_game[self.user_id] != ""):
                disconnected[self.user_id] = 1

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data["key"] == "KEY_CHANGE":
                # print(f"\033[31m KEY_CHANGE CALL {data}\033[0m") # too many call
                async with locks[self.user_id]:
                    key = data["event"][0].lower()
                    down = data["event"][1]
                    if down:
                        pressed_keys[self.user_id].add(key)
                    else:
                        pressed_keys[self.user_id].discard(key)
                    if 'w' in pressed_keys[self.user_id] and 's' in pressed_keys[self.user_id]:
                        keyboard[self.user_id] = 0
                    elif 'w' in pressed_keys[self.user_id]:
                        keyboard[self.user_id] = -1
                    elif 's' in pressed_keys[self.user_id]:
                        keyboard[self.user_id] = 1
                    else:
                        keyboard[self.user_id] = 0


            elif data["key"] == "CHAT":
                print(f"\033[31m CHAT CALL {data}\033[0m")

                timestamp = int(time.time()) # epoch time in sec

                await self.send(text_data=json.dumps({
                    "key": "CHAT",
                    "sender_id": self.user_id,
                    "receiver_id": data["id"],
                    "message": data["message"],
                    "timestamp": timestamp
                    }))

                is_blocked = await is_target_self_blocked(self, data["id"], True)
                if (is_blocked):
                    print(f"\033[31m CHAT {self.user_id} is_blocked by {data["id"]}\033[0m")
                    return

                await self.channel_layer.group_send(
                    str(data["id"]),
                    {
                        "type": "redirect_receive",
                        "data": {
                            "key": "CHAT",
                            "sender_id": self.user_id,
                            "receiver_id": data["id"],
                            "message": data["message"],
                            "timestamp": timestamp
                        }
                    })

            elif data["key"] == "BLOCK_USER":
                print(f"\033[31m BLOCK_USER CALL {data}\033[0m")
                await block_target_in_db(self, data["id"])
                await self.send(text_data=json.dumps({
                    "key": "UPDATE",
                    "id": self.user_id,
                    }))
                await self.channel_layer.group_send(
                    str(data["id"]),
                    {
                        "type": "redirect_receive",
                        "data": {
                            "key": "UPDATE",
                            "id": data["id"]
                        }
                    })

            elif data["key"] == "UNBLOCK_USER":
                print(f"\033[31m UNBLOCK_USER CALL {data}\033[0m")
                await unblock_target_in_db(self, data["id"])
                await self.send(text_data=json.dumps({
                    "key": "UPDATE",
                    "id": self.user_id,
                    }))




            elif data["key"] == "SEND_FRIEND":
                print(f"\033[31m SEND_FRIEND CALL {data}\033[0m")
                self_blocked = await is_target_self_blocked(self, data["id"], False)
                target_blocked = await is_target_self_blocked(self, data["id"], True)
                if (self_blocked or target_blocked):
                    print(f"\033[31m CHAT {self.user_id} is_blocked by {data["id"]}\033[0m")
                    return

                await add_self_to_target_incoming_friends_in_db(self, data["id"])
                await self.channel_layer.group_send(
                    str(data["id"]),
                    {
                        "type": "redirect_receive",
                        "data": {
                            "key": "UPDATE",
                            "id": data["id"]
                        }
                    })
                
            # "value"
            # 0 deny
            # x accept
            elif data["key"] == "HANDLE_FRIEND":
                print(f"\033[31m HANDLE_FRIEND CALL {data}\033[0m")
                await accept_deny_target_friend_in_db(self, data["id"], data["value"])
                await self.send(text_data=json.dumps({
                        "key": "UPDATE",
                        "id": self.user_id,
                    }))
                await self.channel_layer.group_send(
                    str(data["id"]),
                    {
                        "type": "redirect_receive",
                        "data": {
                                "key": "UPDATE",
                                "id": data["id"]
                        }
                    })
            
            elif data["key"] == "REMOVE_FRIEND":
                print(f"\033[31m REMOVE_FRIEND CALL {data}\033[0m")
                await remove_friend_in_db(self, data["id"])
                await self.send(text_data=json.dumps({
                        "key": "UPDATE",
                        "id": self.user_id,
                    }))
                await self.channel_layer.group_send(
                    str(data["id"]),
                    {
                        "type": "redirect_receive",
                        "data": {
                                "key": "UPDATE",
                                "id": data["id"]
                        }
                    })




            # "mode"
            # 0 1v1
            # x tournament
            elif data["key"] == "SEND_GAME":
                print(f"\033[31m SEND_GAME CALL {data}\033[0m")

                self_blocked = await is_target_self_blocked(self, data["id"], False)
                target_blocked = await is_target_self_blocked(self, data["id"], True)
                if (self_blocked or target_blocked):
                    print(f"\033[31m SEND_GAME {self.user_id} is_blocked by {data["id"]}\033[0m")
                    return
                succeed = await is_add_self_to_target_incoming_one_v_one_tournament_in_db(self, data["id"], data["mode"])
                if (succeed):
                    print(f"\033[31m passhererereer\033[0m")
                    await self.channel_layer.group_send(
                        str(data["id"]),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": data["id"]
                            }
                        })
                    
            # "value"
            #   0 deny
            #   x accept
            # "mode"
            #   0 1v1
            #   x tournament
            elif data["key"] == "HANDLE_GAME":
                print(f"\033[31m HANDLE_GAME CALL {data}\033[0m")

                self_blocked = await is_target_self_blocked(self, data["id"], False)
                target_blocked = await is_target_self_blocked(self, data["id"], True)
                affected_ids = []
                if (self_blocked or target_blocked):
                    affected_ids = await arr_accept_deny_target_one_v_one_tournament_in_db(self, data["id"], 0, data["mode"]) # 0 will force deny
                else:
                    affected_ids = await arr_accept_deny_target_one_v_one_tournament_in_db(self, data["id"], data["value"], data["mode"])

                # always update myself
                await self.send(text_data=json.dumps({
                        "key": "UPDATE",
                        "id": self.user_id,
                    }))
                
                if (len(affected_ids) == 0 and data["value"] != 0):
                    await self.channel_layer.group_send(
                        str(self.user_id),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "TOAST",
                                "variant": "danger",
                                "message": "Cannot join, full or deleted lobby.",
                                "duration": 8000
                            }
                        })
                elif (data["value"] != 0): # if not deny
                    # the leader will update itself (he will get the new user that come)
                    await self.channel_layer.group_send(
                        str(data["id"]),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": data["id"]
                            }
                        })
                    # the user who accept update leader too (to know that he is the leader)
                    await self.channel_layer.group_send(
                        str(self.user_id),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": data["id"]
                            }
                        })
                    # all users of the tournament will update themself (they will get the new user that come)
                    for id in affected_ids:
                        await self.channel_layer.group_send(
                            str(id),
                            {
                                "type": "redirect_receive",
                                "data": {
                                    "key": "UPDATE",
                                    "id": id
                                }
                            })
                    await self.channel_layer.group_send(
                        str(data["id"]),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "REDIRECT",
                                "page": 2 # 2 is lobby
                            }
                        })
                    await self.send(text_data=json.dumps({
                            "key": "REDIRECT",
                            "page": 2 # 2 is lobby
                        }))
                    
            # "value" => id
            elif data["key"] == "GAME_KICK":
                print(f"\033[31m GAME_KICK CALL {data}\033[0m")
                status = await status_kick_one_or_two_in_db(self, data["value"])
                if status == 1:
                    # id -1 update themself
                    await self.channel_layer.group_send(
                        "ALL",
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": -1
                            }
                        })
                    # ugly fix like id -1/-2 (this update for everyone the user you go out and now not ready)
                    await self.channel_layer.group_send(
                        "ALL",
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": data["value"]
                            }
                        })
                    await self.channel_layer.group_send(
                        str(data["value"]),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "REDIRECT",
                                "page": 1 # 1 is home
                            }
                        })
                elif status == 2:
                    # id -1 update themself
                    await self.channel_layer.group_send(
                        "ALL",
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": -1
                            }
                        })
                    # ugly fix like id -1/-2 (this update for everyone the user you go out and now not ready)
                    await self.channel_layer.group_send(
                        "ALL",
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": data["value"]
                            }
                        })
                    # fix to know that user is not leader and not ready anymore ?
                    await self.channel_layer.group_send(
                        "ALL",
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": self.user_id
                            }
                        })
                    await self.channel_layer.group_send(
                        str(self.user_id),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "REDIRECT",
                                "page": 1 # 1 is home
                            }
                        })
                    await self.channel_layer.group_send(
                        str(data["value"]),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "REDIRECT",
                                "page": 1 # 1 is home
                            }
                        })
                    
            elif data["key"] == "GAME_CANCEL":
                print(f"\033[31m GAME_CANCEL CALL {data}\033[0m")
                refresh_redirect_list, refresh_list = await tuple_cancel_in_db(self)
                for user_id in refresh_redirect_list:
                    await self.channel_layer.group_send(
                        str(user_id),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": -2
                            }
                        }
                    )
                    await self.channel_layer.group_send(
                        str(user_id),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "REDIRECT",
                                "page": 1  # 1 is home
                            }
                        }
                    )
                # update users / me
                for user_id in refresh_list:
                    await self.channel_layer.group_send(
                        str(user_id),
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": -2
                            }
                        }
                    )

            # "value" => 0 or 1 ready not ready
            elif data["key"] == "GAME_READY":
                print(f"\033[31m GAME_READY CALL {data}\033[0m")
                success = await is_set_ready_not_db(self, data["value"])
                if (success):
                    await self.channel_layer.group_send(
                        "ALL",
                        {
                            "type": "redirect_receive",
                            "data": {
                                "key": "UPDATE",
                                "id": self.user_id
                            }
                        }
                    )
                else:
                    print("NOTHING TO DO GAME_READY")

            
            elif data["key"] == "GAME":
                print(f"\033[31m GAME CALL {data}\033[0m")
                state, affected_user_ids  = await game_state_db(self)
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
                if (state == 1):
                    p1_id = self.user_id
                    # can use aget instead of get, this go to one_v_one list and take the first elem it's a ManyToMany use as a OneToOne (for symetrical feature) 
                    p2_id = await database_sync_to_async(lambda: get_user_model().objects.get(id=self.user_id).one_v_one.first().id)()
                    asyncio.create_task(start_game(self, p1_id, p2_id, None)) # here a simple 1v1 is launch
                elif state == 2:
                    asyncio.create_task(start_tournament(self)) # here a tournament is launch
                else:
                    print("NOTHING TO DO GAME")





            else:
                raise ValueError("Invalid type")


        except Exception as e:
            print(f"\033[31m receive Error {str(e)}\033[0m")
            await self.send(text_data=json.dumps({
                "error": str(e)
            }))


    # data: {}
    async def redirect_receive(self, event):
        try:
            # print(f"\033[31m redirect_receive {event}\033[0m")

            await self.send(text_data=json.dumps(event["data"]))

        except Exception as e:
            print(f"\033[31m redirect_receive Error {str(e)}\033[0m")
            await self.send(text_data=json.dumps({
                "error": str(e)
            }))

    # mode: 0/x (add/discard)
    # name: "str"
    async def redirect_group_add_discard(self, event):
        try:
            print(f"\033[31m redirect_group_add_discard {event}\033[0m")

            if (event["mode"] == 0):
                await self.channel_layer.group_add(event["name"], self.channel_name)
            else:
                await self.channel_layer.group_discard(event["name"], self.channel_name)

        except Exception as e:
            print(f"\033[31m redirect_receive Error {str(e)}\033[0m")
            await self.send(text_data=json.dumps({
                "error": str(e)
            }))
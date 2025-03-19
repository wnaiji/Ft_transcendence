from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

@database_sync_to_async
def is_in_lobby_to_db(self):
    user = get_user_model().objects.get(id=self.user_id)
    if (user.one_v_one.exists() or user.tournament.exists()):
        return True
    return False

# for login
@database_sync_to_async
def update_user_is_login_to_db(self, is_login):
    user = get_user_model().objects.get(id=self.user_id)
    user.is_login = is_login
    user.save()


# for blocked
@database_sync_to_async
def block_target_in_db(self, target_id):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        target_user = get_user_model().objects.get(id=target_id)

        # first remove incoming_friends request for both user
        if user.incoming_friends.filter(id=target_id).exists():
            user.incoming_friends.remove(target_user)
        if target_user.incoming_friends.filter(id=self.user_id).exists():
            target_user.incoming_friends.remove(user)
            target_user.save()

        # also remove all incomming invitation to 1v1 and tournament game
        # remove all incomming game invitation from target user
        if user.incoming_one_v_one.filter(id=target_id).exists():
            user.incoming_one_v_one.remove(target_user)
        if user.incoming_tournament.filter(id=target_id).exists():
            user.incoming_tournament.remove(target_user)
        # do not remove incomming game invitation send to target_id because it give hint about the blocked

        user.blocked_users.add(target_user)

        # then after blocked remove friendship if exists
        # symmetrical=True so one remove for both
        if user.friends.filter(id=target_id).exists():
            user.friends.remove(target_user)

        user.save()

    except Exception as e:
        print(f"\033[31m block_target_in_db Error {str(e)}\033[0m")
        pass

@database_sync_to_async
def unblock_target_in_db(self, target_id):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        target_user = get_user_model().objects.get(id=target_id)

        if user.blocked_users.filter(id=target_id).exists():
            user.blocked_users.remove(target_user)
            user.save()
    except Exception as e:
        print(f"\033[31m unblock_target_in_db Error {str(e)}\033[0m")
        pass

@database_sync_to_async
# mode False => target in user.blocked_users present
# mode True  => user in target.blocked_users present
def is_target_self_blocked(self, target_id, mode):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        target = get_user_model().objects.get(id=target_id)
        if (mode):
            return user in target.blocked_users.all()
        return target in user.blocked_users.all()
    except Exception as e:
        print(f"\033[31m is_target_self_blocked Error {str(e)}\033[0m")
        return False




# for friend
@database_sync_to_async
def add_self_to_target_incoming_friends_in_db(self, target_id):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        target_user = get_user_model().objects.get(id=target_id)
        target_user.incoming_friends.add(user)
        target_user.save()
    except Exception as e:
        print(f"\033[31m add_self_to_target_incoming_friends_in_db Error {str(e)}\033[0m")
        pass

@database_sync_to_async
def accept_deny_target_friend_in_db(self, target_id, value):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        target_user = get_user_model().objects.get(id=target_id)

        if user.incoming_friends.filter(id=target_id).exists():
            user.incoming_friends.remove(target_user)
            if value: # accept
                user.friends.add(target_user) # just need one because symmetrical
                target_user.save()
            user.save()
        else:
            print(f"\033[31m accept_deny_target_friend_in_db Warning cannot accept a non incoming_friends\033[0m")
    except Exception as e:
        print(f"\033[31m accept_deny_target_friend_in_db Error {str(e)}\033[0m")
        pass

@database_sync_to_async
def remove_friend_in_db(self, target_id):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        target_user = get_user_model().objects.get(id=target_id)

        if (user.friends.filter(id=target_id).exists()):
            user.friends.remove(target_user)
            user.save()
            target_user.save()

    except Exception as e:
        print(f"\033[31m remove_friend_in_db Error {str(e)}\033[0m")
        pass




# for 1v1/tournament
@database_sync_to_async
def is_add_self_to_target_incoming_one_v_one_tournament_in_db(self, target_id, mode):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        target_user = get_user_model().objects.get(id=target_id)

        # in a game or tournament don't send new invitation
        if target_user.one_v_one.exists() or target_user.tournament.exists():
            return False
        
        if (mode == 0):
            target_user.incoming_one_v_one.add(user)
        else:
            target_user.incoming_tournament.add(user)
        target_user.save()
        return True
    except Exception as e:
        print(f"\033[31m add_self_to_target_incoming_one_v_one_tournament_in_db Error {str(e)}\033[0m")
        pass

@database_sync_to_async
# "value"
#   0 deny
#   x accept
# "mode"
#   0 1v1
#   x tournament
def arr_accept_deny_target_one_v_one_tournament_in_db(self, target_id, value, mode):
    try:
        affected_user_ids = []
        user = get_user_model().objects.get(id=self.user_id)
        target_user = get_user_model().objects.get(id=target_id)

        # if in a game or tournament stop
        if user.one_v_one.exists() or user.tournament.exists():
            return affected_user_ids

        if ((mode == 0 and user.incoming_one_v_one.filter(id=target_id).exists()) or
            (mode != 0 and user.incoming_tournament.filter(id=target_id).exists())):
            if (mode == 0):
                user.incoming_one_v_one.remove(target_user)
            else:
                user.incoming_tournament.remove(target_user)


            if mode == 0 and target_user.one_v_one.exists(): # 1v1 mode already full
                print(f"\033[31m target_user already have one_v_one match. Cannot join.\033[0m")
                return affected_user_ids
            elif value: # accept
                # remove all incomming invitation in me
                if user.incoming_one_v_one.exists():
                    user.incoming_one_v_one.clear()
                if user.incoming_tournament.exists():
                    user.incoming_tournament.clear()
                # remove all incomming invitation in target too
                if target_user.incoming_one_v_one.exists():
                    target_user.incoming_one_v_one.clear()
                if target_user.incoming_tournament.exists():
                    target_user.incoming_tournament.clear()
                # remove all incomming invitation that i send to others or target send to others (FF)
                all_users = get_user_model().objects.exclude(id=user.id)
                for user_for in all_users:
                    # self
                    affected = False
                    if user_for.incoming_one_v_one.filter(id=user.id).exists() and mode == 1:
                        user_for.incoming_one_v_one.remove(user)
                        affected = True
                    if user_for.incoming_tournament.filter(id=user.id).exists() and mode == 0:
                        user_for.incoming_tournament.remove(user)
                        affected = True
                    # target
                    if user_for.incoming_one_v_one.filter(id=target_user.id).exists() and mode == 1:
                        user_for.incoming_one_v_one.remove(target_user)
                        affected = True
                    if user_for.incoming_tournament.filter(id=target_user.id).exists() and mode == 0:
                        user_for.incoming_tournament.remove(target_user)
                        affected = True

                    # here if mode is tournament and user user_for in the same lobby set it in affected list
                    if mode and user_for.tournament.filter(id=target_user.id).exists():
                        user_for.tournament.add(user) # BIG FF
                        affected = True

                    if (affected):
                        user_for.save()
                        affected_user_ids.append(user_for.id)

                # now that all incomming invitation are clear can join the lobby
                if (mode == 0):
                    user.one_v_one.add(target_user) # just need one because symmetrical
                else:
                    user.tournament.add(target_user) # just need one because symmetrical
                affected_user_ids.append(target_user.id)
                target_user.leader = True
                target_user.save()
                print(f"pass target_user save {target_user.id}")
            user.save()
        else:
            print(f"\033[31m accept_deny_target_one_v_one_in_db Warning cannot accept a non incoming_one_v_one\033[0m")

        return affected_user_ids
    except Exception as e:
        print(f"\033[31m accept_deny_target_one_v_one_in_db Error {str(e)}\033[0m")
        pass


@database_sync_to_async
# return a tuple the first update Users/Me and go to menu, the second just update Users/Me
def tuple_cancel_in_db(self):
    try:
        user = get_user_model().objects.get(id=self.user_id)
        if user.one_v_one.exists():
            if user.leader == True:
                if user.lock == True:
                    print(f"\033[31m cannot cancel if game lock\033[0m")
                    return ([], [])
                user.leader = False
                # user.lock = False
                the_other = user.one_v_one.first()
                the_other.lock = False
                user.one_v_one.clear() # symmetrical
                user.save()
                the_other.save()
                return ([user.id, the_other.id], [])
            else:
                the_other = user.one_v_one.first()
                if the_other.lock == True:
                    print(f"\033[31m cannot go out if game lock\033[0m")
                    return ([], [])
                user.lock = False
                the_other.leader = False
                user.one_v_one.clear() # symmetrical
                user.save()
                the_other.save()
                return ([user.id, the_other.id], [])
        elif user.tournament.exists():
            affected_user_ids = []
            if user.leader == True:
                if user.lock == True:
                    print(f"\033[31m cannot cancel if tournament lock\033[0m")
                    return ([], [])
                user.leader = False
                user.lock = False
                affected_user_ids.append(user.id)
                tournament_users = user.tournament.all()
                # clear the tournament like clear_one_v_one_tournament_db
                for tournament_user in tournament_users:
                    if tournament_user.tournament.exists(): # always true
                        tournament_user.lock = False
                        tournament_user.tournament.clear() # this clear also user.tournament elem symmetrical
                        affected_user_ids.append(tournament_user.id)
                        tournament_user.save()
                user.save()
                return (affected_user_ids, [])
            else:
                tournament_leader = user.tournament.filter(leader=True).first()
                if not tournament_leader:
                    print(f"\033[31m No tournament leader found ?\033[0m")
                    return ([], [])
                
                if tournament_leader.lock == True:
                    print(f"\033[31m cannot go out if tournament lock\033[0m")
                    return ([], [])
                
                user.lock = False

                # when 1 it's need to move the leader to menu too and remove leader
                if (tournament_leader.tournament.count() <= 1):
                    tournament_leader.leader = False
                    user.tournament.clear() # symmetrical
                    user.save()
                    tournament_leader.save()
                    return ([user.id, tournament_leader.id], [])

                tournament_users = user.tournament.all()
                for tournament_user in tournament_users:
                    affected_user_ids.append(tournament_user.id)
                user.tournament.clear() # symmetrical
                user.save()
                return ([user.id], affected_user_ids)
        else:
            print(f"\033[31m the user is not is a 1v1 or tournament\033[0m")
            return ([], [])
    except Exception as e:
        print(f"\033[31m arr_ready_cancel_one_v_one_tournament_in_db Error {str(e)}\033[0m")
        pass

# need to check if in game cannot call kick_one_or_two ?
@database_sync_to_async
# "value" => id
def status_kick_one_or_two_in_db(self, value):
    try:
        user = get_user_model().objects.get(id=self.user_id)

        # if im not in a game or tournament stop
        if (user.leader == False and user.tournament.exists() == False) or (user.one_v_one.exists() == True):
            print(f"\033[31m not leader or not in a tournament\033[0m")
            return 0
        elif user.tournament.filter(id=value).exists():
            user_to_kick = user.tournament.get(id=value)
            user_to_kick.lock = False
            # when 1 it's need to move the leader to menu too and remove leader
            if (user.tournament.count() <= 1):
                user.leader = False
                user_to_kick.lock = False
                user.tournament.clear() # symmetrical
                user_to_kick.save()
                user.save()
                return 2 # in this case go back to menu both
            user_to_kick.tournament.clear() # this clear the user from tournament to everyone symmetrical
            user_to_kick.save()
            return 1
        else:
            print(f"\033[31m the user don't exist in the tournament cannot be kick\033[0m")
            return 0
    except Exception as e:
        print(f"\033[31m arr_ready_cancel_one_v_one_tournament_in_db Error {str(e)}\033[0m")
        pass


@database_sync_to_async
# "value"
# 0 not ready
# 1 ready
# return a tuple the first is the user to update, the second is who will update this users + user to update
def is_set_ready_not_db(self, value):
    user = get_user_model().objects.get(id=self.user_id)
    if (user.leader == True or (user.lock == False and value == 0) or (user.lock == True and value == 1)):
        print(f"\033[31m set_ready_not_db leader or already set \033[0m")
        return False
    elif (user.one_v_one.exists()):
        if (value == 1):
            user.lock = True
        else:
            user.lock = False
        user.save()
        return True
    elif (user.tournament.exists()):
        if (value == 1):
            user.lock = True
        else:
            user.lock = False
        user.save()
        return True
    print(f"\033[31m set_ready_not_db error \033[0m")
    return False

@database_sync_to_async
# return a tuple first status 0/1(1v1)/2(tournament) and also an arr for simplicity update Users/Me
def game_state_db(self):
    user = get_user_model().objects.get(id=self.user_id)
    if (user.leader == True and user.lock == False and user.one_v_one.exists()):
        the_other = user.one_v_one.first()
        if (the_other.lock == False):
            return (0, []) # the other player is not ready
        user.lock = True

        # to clean the other invite but not mandatory
        # all_users = get_user_model().objects.exclude(id=user.id)
        # for user_for in all_users:
        #     if user_for.incoming_one_v_one.filter(id=user.id).exists():
        #         user_for.incoming_one_v_one.remove(user)
        #         user_for.save()

        user.save()
        return (1, [user.id, the_other.id])
    elif (user.leader == True and user.lock == False and user.tournament.count() >= 2):
        affected_user_ids = []
        tournament_users = user.tournament.all()
        for tournament_user in tournament_users:
            # tournament_user.id != user.id should not quick fix
            if tournament_user.tournament.exists() and tournament_user.lock == False and tournament_user.id != user.id:
                return 0 # one other user not ready
            affected_user_ids.append(tournament_user.id)
        # Append the current user's maybe two time not a real problem
        affected_user_ids.append(user.id)
        user.lock = True

        # to clean the other invite but not mandatory
        # all_users = get_user_model().objects.exclude(id=user.id)
        # for user_for in all_users:
        #     if user_for.incoming_tournament.filter(id=user.id).exists():
        #         user_for.incoming_tournament.remove(user)
        #         user_for.save()

        user.save()
        return (2, affected_user_ids)
    return (0, [])

@database_sync_to_async
# return arr to update Me/Users
def clear_one_v_one_tournament_db(target_user, mode):
    affected_user_ids = []
    user = get_user_model().objects.get(id=target_user.id)
    if (mode == 0):
        the_other = user.one_v_one.first()
        the_other.lock = False
        the_other.one_v_one.clear()
        the_other.save()
        affected_user_ids.append(user.id)
        affected_user_ids.append(the_other.id)
    elif user.tournament.exists():
        tournament_users = user.tournament.all()
        for tournament_user in tournament_users:
            if tournament_user.tournament.exists(): # always true
                tournament_user.lock = False
                tournament_user.tournament.clear() # this clear also user.tournament elem symmetrical
                tournament_user.save()
            affected_user_ids.append(tournament_user.id)
        affected_user_ids.append(user.id)
    user.lock = False
    user.leader = False
    user.save()
    return affected_user_ids

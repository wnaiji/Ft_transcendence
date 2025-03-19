# serializers.HyperlinkedModelSerializer ?
from django.contrib.auth import get_user_model
from django.db import models
from rest_framework import serializers
from transcendence_app.models import Game

class UserSerializer(serializers.ModelSerializer):
    games = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ['username', 'avatar', 'id', 'is_login', 'elo', 'won_games', 'lost_games', 'games', 'leader', 'lock']

    def get_games(self, obj):
            games = Game.objects.filter(models.Q(player1=obj) | models.Q(player2=obj))

            return [
                {
                    'game_id': game.id,
                    'date': game.created_at,
                    'player1_id': game.player1.id,
                    'player2_id': game.player2.id,
                    'winner_id': game.winner.id if game.winner else None,
                    'player1_score': game.player1_score,
                    'player2_score': game.player2_score,
                    'tournament_name': game.tournament_name
                }
                for game in games
            ]

class UserMeSerializer(serializers.ModelSerializer):
    friends = serializers.SerializerMethodField()
    incoming_friends = serializers.SerializerMethodField()
    blocked = serializers.SerializerMethodField()

    game_mode = serializers.SerializerMethodField() # 0/1/None
    in_lobby = serializers.SerializerMethodField()
    incoming_one_v_one = serializers.SerializerMethodField()
    incoming_tournament = serializers.SerializerMethodField()

    games = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ['username', 'avatar', 'id', 'email', 'is_anonymise', 'agree_to_terms', 'is_login', 'elo', 'won_games', 'lost_games', 'friends', 'incoming_friends', 'blocked', 'game_mode', 'in_lobby', 'incoming_one_v_one', 'incoming_tournament', 'leader', 'games', 'lock']

    def get_friends(self, obj):
        return obj.friends.values_list('id', flat=True)

    def get_incoming_friends(self, obj):
        return obj.incoming_friends.values_list('id', flat=True)

    def get_blocked(self, obj):
        return obj.blocked_users.values_list('id', flat=True)


    def get_game_mode(self, obj):
        if obj.one_v_one.exists():
            return 1
        elif obj.tournament.exists():
            return 2
        return 0
    def get_in_lobby(self, obj):
        if obj.one_v_one.exists():
            return obj.one_v_one.values_list('id', flat=True)
        elif obj.tournament.exists():
            return obj.tournament.values_list('id', flat=True)
        return []

    def get_incoming_one_v_one(self, obj):
        return obj.incoming_one_v_one.values_list('id', flat=True)
    def get_incoming_tournament(self, obj):
        return obj.incoming_tournament.values_list('id', flat=True)
    
    # the player1_username and player2_username was at the time of the game others players can take those name afterward
    def get_games(self, obj):
            games = Game.objects.filter(models.Q(player1=obj) | models.Q(player2=obj))

            return [
                {
                    'game_id': game.id,
                    'date': game.created_at,
                    'player1_username': game.player1.username,
                    'player2_username': game.player2.username,
                    'winner_id': game.winner.id if game.winner else None,
                    'player1_score': game.player1_score,
                    'player2_score': game.player2_score,
                    'tournament_name': game.tournament_name
                }
                for game in games
            ]

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    agree_to_terms = serializers.BooleanField(write_only=True, required=True)

    def create(self, validated_data):
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']
        agree_to_terms = validated_data['agree_to_terms']
        user = get_user_model().objects.create_user(
            username=username,
            email=email,
            password=password,
            agree_to_terms=agree_to_terms,
        )
        return user

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'agree_to_terms', 'password', 'groups']
        extra_kwargs = { # to see add security ?
            'password': {'write_only': True},  # Ensure password is write-only
            'agree_to_terms': {'write_only': True},  # Ensure agree_to_terms is write-only
        }

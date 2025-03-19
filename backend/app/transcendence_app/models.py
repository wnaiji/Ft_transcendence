from django.db import models
from django.conf import settings

class Game(models.Model):
    id = models.AutoField(primary_key=True)
    # Players in the game
    created_at = models.DateTimeField(auto_now_add=True)

    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='games_as_player1'
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='games_as_player2'
    )
    
    tournament_name = models.CharField(max_length=100, null=True, blank=True)
    
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='games_won'
    )
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    
    def __str__(self):
        return f"Game {self.id} - {self.player1.username} vs {self.player2.username}"
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .blockchain import BlockchainService
from rest_framework import status, permissions
from rest_framework.views import APIView
from django.conf import settings
from rest_framework_simplejwt.tokens import AccessToken

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def set_tournament(request):
    blockchain = BlockchainService.get_instance()
    name = request.data.get("name")

    if not name:
        return Response({"error": "Tournament name is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        tx_hash = blockchain.set_tournament_name(name)
        return Response({"message": "Tournament name updated", "tx_hash": tx_hash}, status=status.HTTP_200_OK)
    except Exception:
        return Response({"error": "Unable to update tournament name."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def add_score(request):
    blockchain = BlockchainService.get_instance()
    tournament_name = request.data.get("tournament_name")
    player = request.data.get("player_address")
    score = request.data.get("score")

    print(f"\033[31m vava ssssss {tournament_name} {player} {score}\033[0m")

    if not all([tournament_name, player]):
        print(f"\033[31m PASSSD ssssss\033[0m")
        return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        score = int(score)
        tx_hash = blockchain.set_score(tournament_name, player, score)
        return Response({"message": "Score updated", "tx_hash": tx_hash}, status=status.HTTP_200_OK)
    except ValueError:
        return Response({"error": "Score must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ScoreUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

            decoded_data_access_token = AccessToken(access_token)
            user_id = decoded_data_access_token.payload.get("user_id")

            blockchain = BlockchainService.get_instance()
            tournament_name = request.data.get('tournament_name')

        
            score = blockchain.get_score(tournament_name, user_id)
            return Response({
                "tournament_name": score[0],
                "player": str(score[1]),
                "score": str(score[2]),
                "rank": str(score[3]),
                "nbr_players": str(score[4])
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# from rest_framework.response import Response
# from rest_framework.decorators import api_view, permission_classes
# from .blockchain import BlockchainService
# from rest_framework import status, permissions
# from rest_framework.views import APIView
# from django.conf import settings
# from rest_framework_simplejwt.tokens import AccessToken

# @api_view(["POST"])
# @permission_classes([permissions.AllowAny])
# def set_tournament(request):
#     blockchain = BlockchainService.get_instance()
#     name = request.data.get("name")
#     tx_hash = blockchain.set_tournament_name(name)
#     return Response({
#         "message": "Tournament name updated",
#         "tx_hash": tx_hash
#         })

# @api_view(["POST"])
# @permission_classes([permissions.AllowAny])
# def add_score(request):
#     blockchain = BlockchainService.get_instance()

#     tournament_name = request.data.get("tournament_name")
#     player = request.data.get("player_address")
#     score = int(request.data.get("score"))

#     print(f"\033[31m vava ssssss {tournament_name} {player} {score}\033[0m")

#     tx_hash = blockchain.set_score(tournament_name, player, score)
#     return Response({
#         "message": "Score updated",
#         "tx_hash": tx_hash
#     })

# class ScoreUserView(APIView):
#    permission_classes = [permissions.IsAuthenticated]

#    def get(self, request):
#         access_token = request.COOKIES.get(settings.AUTH_COOKIE_ACCESS)

#         decoded_data_access_token = AccessToken(access_token)
#         user_id = decoded_data_access_token.payload.get("user_id")

#         blockchain = BlockchainService.get_instance()
#         tournament_name = request.data.get('tournament_name')
#         score = blockchain.get_score(tournament_name, user_id)
#         return Response({
#             "tournament_name": score[0],
#             "player": str(score[1]),
#             "score": str(score[2]),
#             "rank": str(score[3]),
#             "nbr_players": str(score[4])
#         }, status=status.HTTP_200_OK)




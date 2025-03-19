from collections import defaultdict
import asyncio

locks = defaultdict(asyncio.Lock)

keyboard = defaultdict(int) # this is mandatory ?

in_tournament = defaultdict(str) # this is not mandatory but faster that using db ?
in_game = defaultdict(str) # this is not mandatory but faster that using db ?
disconnected = defaultdict(int) # this is not mandatory but faster that using db ?
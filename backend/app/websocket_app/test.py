from collections import defaultdict
import asyncio

# Global shared data store (like Redis, but in-memory)
class SharedData:
    def __init__(self):
        self.shared_data = defaultdict(lambda: defaultdict(list))  # Nested defaultdict for lists
        self.locks = defaultdict(asyncio.Lock)

    async def append_data(self, key, sub_key, value):
        async with self.locks[key]:
            self.shared_data[key][sub_key].append(value)  # Append value to the list

    async def set_data(self, key, sub_key, value):
        async with self.locks[key]:
            self.shared_data[key][sub_key] = value  # Directly set value

    async def get_data(self, key, sub_key):
        async with self.locks[key]:
            return self.shared_data[key].get(sub_key, None)

    async def remove_data(self, key, sub_key):
        async with self.locks[key]:
            if sub_key in self.shared_data[key]:
                del self.shared_data[key][sub_key]

    async def get_all_data(self, key):
        """Retrieve all sub-keys and their values for a given main key."""
        async with self.locks[key]:
            return dict(self.shared_data[key])  # Return a copy of the nested dict

# Example usage
async def main():
    shared_data = SharedData()

    await shared_data.append_data("user1", "messages", "Hello")
    await shared_data.append_data("user1", "messages", "How are you?")
    await shared_data.set_data("user1", "status", "online")

    all_data = await shared_data.get_all_data("user1")
    print(all_data)  # Output: {'messages': ['Hello', 'How are you?'], 'status': 'online'}

asyncio.run(main())

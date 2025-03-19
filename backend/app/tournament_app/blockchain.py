from web3 import Web3
import json
from django.conf import settings
from web3.exceptions import ContractLogicError
from rest_framework.exceptions import NotFound

class BlockchainService:
    _instance = None

    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER))

        with open("../../crypto_volume/TournamentScore.json") as f:
            contract_abi = json.load(f)['abi']

        self.contract_address = settings.CONTRACT_ADDRESS
        self.contract = self.w3.eth.contract(
            address=self.contract_address,
            abi=contract_abi
            )
        self.owner_address = self.w3.eth.accounts[0]
        self.private_key = settings.ETHEREUM_PRIVATE_KEY

    @classmethod
    def get_instance(cls):
        if not cls._instance:
            cls._instance = BlockchainService()
        return cls._instance

    def set_tournament_name(self, name):
        nonce = self.w3.eth.get_transaction_count(self.owner_address)
        try:
            tx = self.contract.functions.setTournamentName(name).build_transaction({
                "from": self.owner_address,
                # "gas": 100000,
                "gasPrice": self.w3.eth.gas_price,
                "nonce": nonce
            })

            print(f"\033[31m set_tournament_name start \033[0m")
            estimated_gas = self.w3.eth.estimate_gas(tx)
            tx["gas"] = int(estimated_gas * 1.2)  # Adding 20% buffer

            print(f"\033[31m set_tournament_name end \033[0m")
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return tx_hash.hex()
        except Exception as e:
            raise Exception("Transaction failed: Possible out of gas. Try again with a higher gas limit.")

        
    def set_score(self, tournamentName, player_address, score):
        nonce = self.w3.eth.get_transaction_count(self.owner_address)
        try:
            tx = self.contract.functions.setScore(tournamentName, int(player_address), score).build_transaction({
                "from": self.owner_address,
                # "gas": 200000,
                "gasPrice": self.w3.eth.gas_price,
                "nonce": nonce
            })

            # Estimate gas dynamically
            print(f"\033[31m gaz_estimate set_score\033[0m")
            estimated_gas = self.w3.eth.estimate_gas(tx)
            tx["gas"] = int(estimated_gas * 1.2)  # Adding 20% buffer
            print(f"\033[31m gaz_estimate set_score end\033[0m")

            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            return tx_hash.hex()
        except Exception as e:
            raise Exception("Transaction failed: Possible out of gas. Try again with a higher gas limit.")


    def get_score(self, tournamentName, player_address):
        try:
            score = self.contract.functions.getScore(tournamentName, int(player_address)).call()
            print(f"\033[31m Pass in get_score\033[0m")
            return score
        except ContractLogicError as e:
            raise NotFound(detail="Player does not exist in this tournament.", code=400)

    # def get_top_players(self, tournamentName, n):
        # return self.contract.functions.getTopPlayers(tournamentName, n).call()

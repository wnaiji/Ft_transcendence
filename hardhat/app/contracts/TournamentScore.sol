// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract TournamentScore {
    struct Score {
        uint    playerId;
        uint    scoreValue;
        uint    rank;
        bool    exists;
    }

    struct Tournament {
        string                  name;
        mapping(uint => Score)  scores;
        uint[]                  players;
        uint                    playerCount;
    }

    address                     owner;

    mapping(string => Tournament) tournament;

    event ScoreAdded(uint player, uint scoreValue);
    event ScoreUpdated(uint player, uint newScore);
    event RankUpdated(uint player, uint newRank);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    function setTournamentName(string memory _tournamentName) public onlyOwner {
        tournament[_tournamentName].name = _tournamentName;
    }

    function setScore(string memory _tournamentName, uint _player, uint _scoreValue) public onlyOwner {
        if (!tournament[_tournamentName].scores[_player].exists) {
            tournament[_tournamentName].players.push(_player);
            tournament[_tournamentName].scores[_player] = Score({
                playerId: tournament[_tournamentName].playerCount++,
                scoreValue: _scoreValue,
                rank: 0,
                exists: true
            });
            emit ScoreAdded(_player, _scoreValue);
        }
        else {
            tournament[_tournamentName].scores[_player].scoreValue = _scoreValue;
            emit ScoreUpdated(_player, _scoreValue);
        }
        updateRankings(_tournamentName);
    }

    function getScore(string memory _tournamentName, uint _player)
    public
    view
    returns(string memory, uint, uint, uint, uint) {
        Tournament storage tournamentData = tournament[_tournamentName];
        require(tournamentData.scores[_player].exists, "This player doesn't exist");

        Score storage playerScore = tournamentData.scores[_player];
        return(
            tournamentData.name,
            playerScore.playerId,
            playerScore.scoreValue,
            playerScore.rank,
            tournamentData.playerCount
        );
    }

    function updateRankings(string memory _tournamentName) internal {
        uint    n = tournament[_tournamentName].players.length;

        for (uint i = 0; i < n - 1; i++) {
            for (uint j = 0; j < n - 1; j++) {
                if (tournament[_tournamentName].scores[tournament[_tournamentName].players[j]].scoreValue < tournament[_tournamentName].scores[tournament[_tournamentName].players[j + 1]].scoreValue) {
                    uint tmp = tournament[_tournamentName].players[j];
                    tournament[_tournamentName].players[j] = tournament[_tournamentName].players[j + 1];
                    tournament[_tournamentName].players[j + 1] = tmp;
                }
            }
        }

        for (uint i = 0; i < tournament[_tournamentName].players.length; i++) {
            tournament[_tournamentName].scores[tournament[_tournamentName].players[i]].rank = i + 1;
            emit RankUpdated(tournament[_tournamentName].players[i], i + 1);
        }
    }
}

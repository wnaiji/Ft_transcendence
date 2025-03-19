// const hre = require("hardhat")

// async function main() {
//     const TournamentScore = await hre.ethers.getContractFactory("TournamentScore");
//     const tournamentScore = await TournamentScore.deploy();
//     await tournamentScore.waitForDeployment();

//     console.log("TournamentScore deployed to:", await tournamentScore.getAddress());
// }

// main()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     });

const { buildModule } = require("@nomicfoundation/ignition-core");

module.exports = buildModule("TournamentModule", (m) => {
  const tournamentScore = m.contract("TournamentScore");

  return { tournamentScore };
});


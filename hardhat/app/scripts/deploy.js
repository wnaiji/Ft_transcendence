const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Déploiement du contrat TournamentScore
  const TournamentScore = await hre.ethers.getContractFactory("TournamentScore");
  const tournamentScore = await TournamentScore.deploy();

  // Attendre le déploiement complet
  await tournamentScore.waitForDeployment();
  accounts = await ethers.getSigners()

  console.log("✅ PongTournament deployed at:", tournamentScore.target);

  // Sauvegarde des informations du contrat
  const deploymentInfo = {
    address: tournamentScore.target,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  // Créer le dossier deployments s'il n'existe pas
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Sauvegarde dans le volume partagé
  fs.writeFileSync(
    path.join(__dirname, '../../../crypto_volume/AddressContract.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Envoie de abi au backend
  const sourcePath = path.join(__dirname, '../artifacts/contracts/TournamentScore.sol/TournamentScore.json');
  const destPath = path.join(__dirname, '../../../crypto_volume/TournamentScore.json')

  try {
    fs.copyFileSync(sourcePath, destPath);
    console.log('✅ File successfully copied!');
  } catch (error) {
    console.error('❌ Error copying file :', error);
  }

  console.log("✅ Contract information successfully saved");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment error :", error);
    process.exit(1);
  });
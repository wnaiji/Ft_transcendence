#!/bin/sh

set -e

until nc -z ganache 8545; do
  echo "Waiting for Ganache to be ready..."
  sleep 2
done

echo " ✅ Ganache is ready! Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost
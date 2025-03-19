require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "http://ganache:8545",
      accounts: process.env.HARDHAT_PRIVATE_KEY ? [process.env.HARDHAT_PRIVATE_KEY] : [],
    },
    localhost: {
      url: "http://ganache:8545",
      accounts: process.env.HARDHAT_PRIVATE_KEY ? [process.env.HARDHAT_PRIVATE_KEY] : [],
    },
  }
};
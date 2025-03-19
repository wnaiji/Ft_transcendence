FROM node:18.17.1-alpine

WORKDIR /app

# Installation des dépendances
COPY /app/package*.json ./
RUN npm install
RUN apk update && apk add --no-cache bash curl

# Copie des fichiers de configuration et des contrats
# COPY /app/hardhat.config.js ./
# COPY /app/contracts ./contracts
# COPY /app/scripts ./scripts

COPY app/ .

# Compiler les contrats
RUN npx hardhat compile

# Script pour attendre que Ganache soit prêt et déployer
COPY /app/wait-for-ganache.sh ./
RUN chmod +x /app/wait-for-ganache.sh

CMD ["sh", "./wait-for-ganache.sh"]

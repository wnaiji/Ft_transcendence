FROM	node:22.12-alpine3.21

ENV     NODE_ENV=development 

WORKDIR	/app

COPY	app/package*.json ./

RUN		npm install

COPY    app ./

# RUN		npm run lint

EXPOSE	5173
# EXPOSE	4173

# CMD		["sh"]
CMD		["npm", "run", "dev"]
# CMD		["npm", "run", "build"]
# CMD		["npm", "run", "preview"]

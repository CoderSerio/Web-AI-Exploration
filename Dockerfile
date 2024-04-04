FROM node:latest as builder

WORKDIR /app

COPY . /app
RUN echo "Project Github: https://github.com/CoderSerio/Web-AI-Masterpiece"
RUN npm install pnpm -g && pnpm i
RUN apt-get update && apt-get install -y python3 python3-pip && pip3 install -r requirements.txt

COPY start.js /app/scripts/start.js
CMD ["node", "start.js"]
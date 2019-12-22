FROM node:12.14.0-alpine
ENV docker=true
WORKDIR /home/mench
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD [ "npm", "start" ]
FROM node:10.16.0-alpine
ENV docker=true
WORKDIR /home/app
COPY package.json /home/app
RUN npm install
COPY . /home/app
EXPOSE 3001
CMD [ "npm", "start" ]
FROM node:12.14.0-alpine
ENV docker=true
WORKDIR /home/app
COPY package.json /home/app
RUN npm install
COPY . /home/app
EXPOSE 3002
CMD [ "npm", "start" ]
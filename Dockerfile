#Build Steps
FROM node:alpine3.10 as build-step

RUN mkdir /app
WORKDIR /app

COPY package.json /app
RUN npm install
COPY . /app

RUN npm run build

#Run Steps
FROM bitnami/nginx:latest  
COPY --from=build-step /app/build /usr/share/nginx/html

#RUN chgrp -R 0 /var/cache/nginx /var/run
#RUN chmod g+rwX /var/cache/nginx /var/run

#EXPOSE 8080

#Useful for testing:
#RUN npm install -g serve
#CMD ["serve","-p","8080","build/"

#Emulate an anonynous uid
#USER 9999:0

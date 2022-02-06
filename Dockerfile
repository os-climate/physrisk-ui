#Build Steps
FROM node:alpine3.10 as build-step

RUN mkdir /appwork
WORKDIR /appwork

COPY package.json /appwork
RUN npm install
COPY . /appwork

RUN npm run build

#Run Steps
FROM bitnami/nginx:latest  
COPY --from=build-step /appwork/build /app

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

#COPY --from=build-step /app/build /usr/share/nginx/html

#RUN chgrp -R 0 /usr/share/nginx/html
#RUN chmod g+rwX /usr/share/nginx/html

#RUN chgrp -R 0 /var/cache/nginx /var/run
#RUN chmod g+rwX /var/cache/nginx /var/run

#EXPOSE 8080

#Useful for testing:
#RUN npm install -g serve
#CMD ["serve","-p","8080","build/"

#Emulate an anonynous uid
#USER 9999:0

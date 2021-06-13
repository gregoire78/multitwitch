# Stage 1 - the build process
FROM node:lts-alpine as build-deps
LABEL maintainer="gregoire@joncour.dev"

WORKDIR /usr/src/app
ENV NODE_ENV=production

ARG DOMAIN
ARG TWITCH_CLIENTID
ARG GTAG_ID
ENV TWITCH_CLIENTID=${TWITCH_CLIENTID}
ENV REACT_APP_GTAG_ID=${GTAG_ID}

COPY package*.json ./
RUN npm install --silent
COPY . .
RUN npm run build

# Stage 2 - the production environment
FROM nginx:alpine
LABEL maintainer="gregoire@joncour.dev"

COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
RUN echo 'server_tokens off;' > /etc/nginx/conf.d/server_tokens.conf
RUN echo $'server {\n\
    listen 80;\n\
    location / { \n\
    root /usr/share/nginx/html;\n\
    index index.html index.htm;\n\
    try_files $uri $uri/ /index.html; \n\
    }\n\
    }'\
    > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
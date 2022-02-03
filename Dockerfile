# Stage 1 - the build process
FROM node:lts-alpine as build-deps
LABEL maintainer="gregoire@joncour.dev"

WORKDIR /usr/src/app
RUN apk add --no-cache git

ARG TWITCH_CLIENTID
ARG MATOMO_URL
ARG MATOMO_ID
ARG TOUAPI
ENV TWITCH_CLIENTID=${TWITCH_CLIENTID}
ENV MATOMO_URL=${MATOMO_URL}
ENV MATOMO_ID=${MATOMO_ID}
ENV TOUAPI=${TOUAPI}

COPY package*.json ./
RUN npm install --silent
COPY . .
RUN npm run build-prod

# Stage 2 - the production environment
FROM nginx:alpine
LABEL maintainer="gregoire@joncour.dev"

COPY --from=build-deps /usr/src/app/dist /usr/share/nginx/html
RUN echo 'server_tokens off;' > /etc/nginx/conf.d/server_tokens.conf
RUN echo $'server {\n\
    gzip on; \n\
    gzip_static on; \n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html index.htm;\n\
    location ~* \.(?:css|js|png|json|svg)$ { \n\
    expires 1y;\n\
    add_header Cache-Control "public"; \n\
    }\n\
    location / { \n\
    try_files $uri $uri/ /index.html; \n\
    }\n\
    }'\
    > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# Stage 1 - the build process
FROM node:lts-alpine as build-deps
LABEL maintainer="gregoire@joncour.tech"

WORKDIR /usr/src/app
ENV NODE_ENV=production

ARG DOMAIN
ARG TWITCH_CLIENTID
ARG GTAG_ID
ENV REACT_APP_DOMAIN=${DOMAIN}
ENV REACT_APP_TWITCH_URI="https://${DOMAIN}/"
ENV REACT_APP_TWITCH_CLIENTID=${TWITCH_CLIENTID}
ENV REACT_APP_GTAG_ID=${GTAG_ID}

COPY package*.json ./
RUN npm install --silent
COPY . .
RUN npm run build

# Stage 2 - the production environment
FROM nginx:alpine
LABEL maintainer="gregoire@joncour.tech"

COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
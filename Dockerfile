# Stage 1 - the build process
FROM node:lts-alpine AS build-deps
LABEL maintainer="gregoire@joncour.dev"

WORKDIR /usr/src/app
RUN apk add --no-cache git

ARG TWITCH_CLIENTID
ARG COUNTER_URL
ARG COUNTER_ID
ARG COUNTER_UTCOFFSET
ARG TOUAPI
ENV TWITCH_CLIENTID=${TWITCH_CLIENTID}
ENV COUNTER_URL=${COUNTER_URL}
ENV COUNTER_ID=${COUNTER_ID}
ENV COUNTER_UTCOFFSET=${COUNTER_UTCOFFSET}
ENV TOUAPI=${TOUAPI}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build-prod

# Stage 2 - the production environment with Caddy
FROM caddy:alpine
LABEL maintainer="gregoire@joncour.dev"

# Copy built files to Caddy's web root
COPY --from=build-deps /usr/src/app/dist /usr/share/caddy

# Provide a basic Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

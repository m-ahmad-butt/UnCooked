FROM node:22-alpine AS build
WORKDIR /app
# hadolint ignore=DL3018
RUN apk upgrade --no-cache
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# nginx/nginx-unprivileged:1.28.3-alpine does not exist on Hub.
# 1.31.7-alpine is current mainline with newer nginx package fixes.
FROM nginx/nginx-unprivileged:1.31.7-alpine
USER root
# hadolint ignore=DL3018
RUN apk upgrade --no-cache
USER nginx
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

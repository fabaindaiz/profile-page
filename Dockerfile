FROM node:latest as node
WORKDIR /app
COPY . .

RUN npm install
RUN npm run build --prod
RUN npm run scully

FROM nginx:alpine
COPY --from=node /app/dist/profile-page /usr/share/nginx/html
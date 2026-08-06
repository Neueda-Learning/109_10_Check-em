FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8082
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG NITRO_PRESET=node-server
ENV NITRO_PRESET=$NITRO_PRESET

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

COPY --from=build /app/.output ./.output

EXPOSE 80

CMD ["node", ".output/server/index.mjs"]

FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN NITRO_PRESET=node-server npm run build


FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.output /app/.output

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", "/app/.output/server/index.mjs"]

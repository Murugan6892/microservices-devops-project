FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY app.js ./
ENV NODE_ENV=production
EXPOSE 3002
USER node
CMD ["npm", "start"]

FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
ENV VITE_API_BASE_URL=/api
RUN npm install
COPY . .

RUN npm run build

CMD ["npm", "run", "preview" ]
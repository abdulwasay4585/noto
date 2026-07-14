FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Default command will just keep the container alive
# so we can run one-off commands against it via 'docker compose run'
CMD ["tail", "-f", "/dev/null"]

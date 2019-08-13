FROM node:10

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies using package-lock.json
RUN npm ci

# Copy source
COPY . .

EXPOSE 443
EXPOSE 80

CMD [ "node", "phillip.js" ]

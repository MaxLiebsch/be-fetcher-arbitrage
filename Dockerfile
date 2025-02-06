FROM node:20 AS build

ARG environment=development
ENV PATH=$PATH:/app/node_modules/.bin
ENV ENVIRONMENT=$environment
ENV NODE_ENV=${ENVIRONMENT}
ARG CHROME_VERSION=133.0.6943.53
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN --mount=type=secret,id=ssh_key \
mkdir -p /root/.ssh && \
cp /run/secrets/ssh_key /root/.ssh/id_clr_pkg && \
sed 's/\r$//' /root/.ssh/id_clr_pkg /root/.ssh/id_clr_pkg && \
chmod 600 /root/.ssh/id_clr_pkg  && \
echo "Host github.com\n\tStrictHostKeyChecking no\n" >> /root/.ssh/config && \
eval "$(ssh-agent -s)" && \
ssh-add /root/.ssh/id_clr_pkg && \
git clone git@github.com:MaxLiebsch/clr-pkg.git && \
rm /root/.ssh/id_clr_pkg


# Install global dependencies
RUN yarn global add gulp-cli

WORKDIR /clr-pkg
# Install dependencies and build the package
RUN yarn install && yarn build && yarn link

WORKDIR /app

COPY . .

COPY [".env.production", "/app"]
COPY [".env.development", "/app"]
COPY ["proxy/.env.production", "/app/proxy/"]
COPY ["proxy/.env.development", "/app/proxy/"]
COPY [".env", "/app"]


WORKDIR /app/proxy
RUN yarn link "@dipmaxtech/clr-pkg" && yarn install

WORKDIR /app
RUN yarn link "@dipmaxtech/clr-pkg" && yarn install && yarn compile

FROM node:20 AS puppeteer-base

# Puppeteer dependencies
RUN wget --no-verbose -O /usr/bin/dumb-init.deb https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_amd64.deb \
&& apt install -y /usr/bin/dumb-init.deb

RUN apt update -y && \
apt-get install -y libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 \
libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 \
libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libnss3 libxtst6 fonts-liberation libu2f-udev \
libvulkan1 xdg-utils && \
rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libxkbcommon0 \
    && rm -rf /var/lib/apt/lists/*

# Add Google Chrome repository key and install Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

RUN apt-get update \
&& apt-get install -y vim

# Set the locale
RUN apt-get install -y locales locales-all && rm -rf /var/lib/apt/lists/* \
&& locale-gen "de_DE.UTF-8" && update-locale LANG=de_DE.UTF-8
ENV LANG=de_DE.UTF-8 \
LANGUAGE=de_DE:de \
LC_ALL=de_DE.UTF-8


# Production stage
FROM puppeteer-base AS prod

ARG environment=production
ENV NODE_ENV=$environment
ENV PATH=$PATH:/usr/local/share/.config/yarn/global/node_modules/.bin:/app/node_modules/.bin

# RUN ls -ah /root

# Install PM2 globally
RUN yarn global add pm2


# Install only production dependencies
COPY --from=build /clr-pkg/package.json /clr-pkg/package.json
# Copy the built files from the build stage
COPY --from=build /clr-pkg/lib /clr-pkg/lib
COPY --from=build /clr-pkg/node_modules /clr-pkg/node_modules

RUN yarn --cwd /clr-pkg link

# App directory
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/.env /app/.env
COPY --from=build /app/.env.production /app/.env.production
COPY --from=build /app/.env.development /app/.env.development 
COPY --from=build /app/dist /app/dist
COPY --from=build /app/scheduler.pm2.config.cjs /app/

# Proxy directory
COPY --from=build /app/proxy/package.json /app/proxy/package.json
COPY --from=build /app/proxy/node_modules /app/proxy/node_modules
COPY --from=build /app/proxy/.env.production /app/proxy/.env.production
COPY --from=build /app/proxy/.env.development /app/proxy/.env.development
COPY --from=build /app/proxy/dist /app/proxy/dist
RUN yarn --cwd /app/proxy link "@dipmaxtech/clr-pkg"


# Set the working directory to /app
WORKDIR /app
RUN apt-get update && apt-get install -y cron jq

RUN yarn link "@dipmaxtech/clr-pkg"

RUN mkdir -p /app/data/shop/debug/

RUN chmod +x /usr/bin/dumb-init

COPY start.sh /app/start.sh

RUN chmod +x /app/start.sh

# Add health check script
COPY health-check.sh /app/health-check.sh

RUN chmod +x /app/health-check.sh

COPY app-cron /etc/cron.d/app-cron
RUN chmod 0644 /etc/cron.d/app-cron

ENTRYPOINT ["/app/start.sh"] 
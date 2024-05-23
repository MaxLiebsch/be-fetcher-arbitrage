FROM node:20 as build

ARG environment=development
ENV PATH $PATH:/app/node_modules/.bin
ENV ENVIRONMENT=$environment
ENV NODE_ENV=${ENVIRONMENT}
ARG CHROME_VERSION=122.0.6261.94


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

WORKDIR /clr-pkg
RUN yarn && yarn build

FROM node:20 as puppeteer-base

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

# RUN wget --no-verbose -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_122.0.6261.94-1_amd64.deb \
#     && apt install -y /tmp/chrome.deb \
#     && rm /tmp/chrome.deb

RUN apt-get update \
&& apt-get install -y vim

# Set the locale
RUN apt-get install -y locales locales-all && rm -rf /var/lib/apt/lists/* \
&& locale-gen "de_DE.UTF-8" && update-locale LANG=de_DE.UTF-8
ENV LANG=de_DE.UTF-8 \
LANGUAGE=de_DE:de \
LC_ALL=de_DE.UTF-8


# Production stage
FROM puppeteer-base as prod

ENV NODE_ENV=${ENVIRONMENT}
ENV PATH $PATH:/usr/local/share/.config/yarn/global/node_modules/.bin:/app/node_modules/.bin

# Install PM2 globally
RUN yarn global add pm2

COPY --from=build /clr-pkg/node_modules /clr-pkg/node_modules
COPY --from=build /clr-pkg/lib /clr-pkg/lib
COPY --from=build /clr-pkg/package.json /clr-pkg/package.json

WORKDIR /clr-pkg
RUN yarn link

COPY . /app
WORKDIR /app

RUN mkdir -p /app/data/shop/debug/

# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN yarn link "@dipmaxtech/clr-pkg"
RUN yarn --cwd /clr-pkg install
RUN yarn

RUN chmod +x /usr/bin/dumb-init

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENTRYPOINT ["/app/start.sh"]
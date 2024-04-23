FROM node:20 as build

ARG environment=development
ENV PATH $PATH:/app/node_modules/.bin
ENV ENVIRONMENT=$environment
ENV NODE_ENV=${ENVIRONMENT}

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

FROM node:20-slim as puppeteer-base

# Puppeteer dependencies
RUN apt-get update -y && \
        apt-get install -y chromium-driver \
        libx11-xcb1 libxcomposite1 libasound2 libatk1.0-0 libatk-bridge2.0-0 \
        libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 \
        libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
        libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 && \
        rm -rf /var/lib/apt/lists/*

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

RUN yarn link "@dipmaxtech/clr-pkg"
RUN yarn


ENTRYPOINT ["pm2-runtime", "start", "scheduler.pm2.config.cjs"]
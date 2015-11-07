FROM philcockfield/node-pm2

# Install NPM modules.
#
# NOTE: This is done prior to copying the working folder to prevent a rebuild
#       of the modules on each file change (uses cache instead).
#
# See: http://bitjudo.com/blog/2014/03/13/building-efficient-dockerfiles-node-dot-js/
#
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

# Copy working files.
WORKDIR /opt/app
COPY . /opt/app

EXPOSE 80

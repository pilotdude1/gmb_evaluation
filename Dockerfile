FROM node:20-bookworm

# Install additional development tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        git \
        curl \
        wget \
        vim \
        nano \
        htop \
        tree \
        jq \
        unzip \
        zip \
        sudo \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for development (using different UID/GID)
RUN groupadd --gid 1001 nodeuser \
    && useradd --uid 1001 --gid 1001 -m nodeuser

# Configure npm for faster installation
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 3 \
    && npm config set fetch-retry-mintimeout 5000 \
    && npm config set fetch-retry-maxtimeout 60000

# Install global npm packages with optimizations
RUN npm install -g --no-optional --production=false \
    @sveltejs/kit \
    svelte-check \
    prettier \
    eslint \
    typescript \
    ts-node \
    nodemon

# Set up Git configuration
RUN git config --global init.defaultBranch main

# Set up shell aliases
RUN echo 'alias ll="ls -la"' >> /home/nodeuser/.bashrc \
    && echo 'alias dev="npm run dev"' >> /home/nodeuser/.bashrc \
    && echo 'alias build="npm run build"' >> /home/nodeuser/.bashrc \
    && echo 'alias preview="npm run preview"' >> /home/nodeuser/.bashrc \
    && echo 'alias test-templates="npm run dev -- --host 0.0.0.0 --port 5173"' >> /home/nodeuser/.bashrc

# Create module templates directory structure
RUN mkdir -p /workspaces/module_base/src/lib/modules/templates \
    && mkdir -p /workspaces/module_base/src/routes/test-templates

# Set working directory
WORKDIR /workspaces/module_base

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Set environment variables for development
ENV NODE_ENV=development
ENV VITE_SUPABASE_URL=""
ENV VITE_SUPABASE_ANON_KEY=""

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5173 || exit 1

# Switch to non-root user
USER nodeuser 
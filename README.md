# Photobooth

A photobooth application with an Electron frontend and TanStack Start web backend.

## Project Structure

- `apps/frontend` - Electron desktop application for photo capture and user interaction
- `apps/web` - TanStack Start web application with API endpoints and Supabase integration

## Tech Stack

- **Language**: TypeScript
- **Frontend**: Electron, React, React Router, Tailwind CSS
- **Backend**: TanStack Start, Supabase, Resend, Cloudflare

## Prerequisites

- Node.js >= 24.10
- pnpm 10.18.2

## Development

### Setup

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables:
   - Copy `apps/frontend/env.sample` to `apps/frontend/.env`
   - Copy `apps/web/env.sample` to `apps/web/.env`
   - Fill in the required values

3. Link Supabase Project:

```bash
pnpm wb exec -- supabase login
pnpm wb exec -- supabase link # choose your supabase project
```

### Run

1. Start Supabase:

```bash
pnpm wb exec -- supabase start # will pull docker images on first run
```

2. Start development:

```bash
pnpm start
```

This runs both the frontend Electron app and the web server.

### Operation

- Preview Emails:

```bash
pnpm wb dev:email
```

- Pull Supabase Migrations:

```bash
pnpm wb exec -- supabase db pull
```

- Reset & Apply Supabase Migrations:

```bash
pnpm wb exec -- supabase db reset # !!will delete & recreate local db!!
```

- Update Schemas then create migrations:

```bash
pnpm wb exec -- supabase db diff -f <migration-name>
```

- Deploy Migration:

```bash
pnpm wb exec -- supabase db push
```

Read more: https://supabase.com/docs/guides/local-development/overview

## Available Scripts

- `pnpm start` - Start both frontend and web apps
- `pnpm lint` - Lint all apps
- `pnpm lint:fix` - Fix linting issues
- `pnpm fe <command>` - Run commands in frontend app
- `pnpm wb <command>` - Run commands in web app

## Deployment

### Web

```bash
pnpm wb run build
pnpm wb run start
```

### Frontend

Prepare:

1. Use .env.prod

2. For non-Windows platforms:

   ```bash
   # Wine for win32 platform
   # https://gitlab.winehq.org/wine/wine/-/wikis/Download
   # For Ubuntu 24.04, use noble repository:
   sudo mkdir -pm755 /etc/apt/keyrings
   wget -O - https://dl.winehq.org/wine-builds/winehq.key | sudo gpg --dearmor -o /etc/apt/keyrings/winehq-archive.key -
   sudo dpkg --add-architecture i386
   sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/noble/winehq-noble.sources
   sudo apt update
   sudo apt install --install-recommends winehq-stable
   # Mono for win32 platform
   # https://www.mono-project.com/download/stable
   # Ubuntu 20.04 and later:
   sudo apt install ca-certificates gnupg
   sudo gpg --homedir /tmp --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/mono-official-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
   sudo chmod +r /usr/share/keyrings/mono-official-archive-keyring.gpg
   echo "deb [signed-by=/usr/share/keyrings/mono-official-archive-keyring.gpg] https://download.mono-project.com/repo/ubuntu stable-focal main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
   sudo apt update
   sudo apt install mono-devel
   ```

Create installer:

```bash
pnpm fe package # create executable
pnpm fe make --platform=linux --arch=x64 # create installer
pnpm fe make --platform=darwin --arch=x64 # create installer
pnpm fe make --platform=darwin --arch=arm64 # create installer
pnpm fe make --platform=win32 --arch=x64 # create installer
```

Publish:

```bash
pnpm fe publish # publish to distribution platform
```

Read more: https://www.electronforge.io/core-concepts/build-lifecycle

# The Atlas Board

A task management application built with React, TypeScript, and Supabase.

## Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Docker (for local Supabase)
- Supabase CLI

## Local Development Setup

### 1. Install Dependencies

```bash
# Install project dependencies
pnpm install

# Install Supabase CLI globally
npm install -g supabase
```

### 2. Local Supabase Setup

1. Start Docker on your machine

2. Initialize Supabase locally:

```bash
supabase init
```

3. Start local Supabase:

```bash
supabase start
```

This will create a local Supabase instance with:

- Database: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio URL: `http://localhost:54323`
- API URL: `http://localhost:54321`
- JWT secret: `super-secret-jwt-token-with-at-least-32-characters-long`

4. Apply migrations:

```bash
supabase migration up
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key>
```

You can find your local anon key in the output after running `supabase start`.

### 4. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:5173` to see the application.

## Development Environments

### Setting up Development Environment

1. Create a new Supabase project for development:

   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project for development
   - Name it something like "atlas-board-dev"

2. Create a `.env.development` file:

```env
VITE_SUPABASE_URL=<your-dev-project-url>
VITE_SUPABASE_ANON_KEY=<your-dev-project-anon-key>
```

3. Push schema to development database:

```bash
supabase db push --db-url="postgres://<dev-database-connection-string>"
```

### Environment Switching

To switch between environments:

1. Local development:

```bash
pnpm dev
```

2. Development environment:

```bash
pnpm dev --mode development
```

3. Production environment:

```bash
pnpm dev --mode production
```

## Database Migrations

1. Create a new migration:

```bash
supabase migration new <migration-name>
```

2. Apply migrations:

```bash
supabase migration up
```

3. Reset database (caution: this will clear all data):

```bash
supabase db reset
```

## Testing

Before pushing to production, test your changes in the development environment:

1. Create test users in the development environment
2. Run the application against the development database
3. Verify features work as expected
4. Check for any security policy issues

## Useful Commands

```bash
# Start Supabase locally
supabase start

# Stop Supabase locally
supabase stop

# View Supabase logs
supabase logs

# Generate types from your database schema
supabase gen types typescript --local > src/types/database.ts

# Link to your remote project
supabase link --project-ref <project-id>
```

## Project Structure

- `/src` - Application source code
- `/supabase` - Supabase configuration and migrations
  - `/migrations` - Database migrations
  - `/seed.sql` - Seed data for development
- `/src/api` - API integration layer
- `/src/components` - React components
- `/src/contexts` - React contexts
- `/src/hooks` - Custom React hooks
- `/src/types` - TypeScript type definitions

## Contributing

1. Create a new branch for your feature
2. Make changes and test locally
3. Push changes to development environment for testing
4. Create a pull request
5. After review, changes will be merged to main and deployed to production

## Common Issues

1. If Supabase CLI commands fail, ensure Docker is running
2. If migrations fail, check the order of migrations and any potential conflicts
3. For authentication issues, verify your environment variables are correct
4. For database connection issues, ensure your Supabase instance is running

# Installation Prerequisites

1. Node.js 20 or higher

   ```bash
   # Using nvm (recommended)
   nvm install 20
   nvm use 20
   ```

2. pnpm (Package Manager)

   ```bash
   # Install pnpm globally
   curl -fsSL https://get.pnpm.io/install.sh | sh -
   # Or on Windows (using PowerShell)
   iwr https://get.pnpm.io/install.ps1 -useb | iex
   ```

3. Docker Desktop
   Download and install from: https://www.docker.com/products/docker-desktop

# Getting Started

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/the-atlas-board.git
   cd the-atlas-board
   ```

2. Setup the project (this will install dependencies and set up Supabase CLI)

   ```bash
   pnpm setup
   ```

3. Start the development server
   ```bash
   pnpm dev
   ```

# Common Issues

1. If you see package manager errors:

   ```bash
   # Clean the project
   pnpm clean

   # Reinstall dependencies
   pnpm install
   ```

2. If Supabase CLI installation fails:
   - Windows users should follow the manual installation steps shown during setup
   - Mac/Linux users can try installing manually:
     ```bash
     curl -fsSL https://get.supabase.io/install.sh | sh
     ```

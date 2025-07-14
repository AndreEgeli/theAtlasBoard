
# Gemini README

This document outlines the conventions and preferences for the Atlas Board project, as understood by Gemini.

## Project Overview

The Atlas Board is a task management application built with React, TypeScript, and Supabase. It uses `pnpm` as the package manager and has a well-defined development workflow with local, development, and production environments.

## Key Technologies and Libraries

- **Frontend:** React, TypeScript, Vite
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Data Fetching & State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS
- **Linting:** ESLint

## Development Conventions

### Package Manager

- **`pnpm` is the required package manager.** The `preinstall` script in `package.json` enforces this.

### Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Builds the application for production.
- `pnpm lint`: Lints the codebase using ESLint.
- `pnpm setup`: Installs dependencies and sets up the Supabase CLI.

### Supabase

- **Migrations:** Database changes are managed through migration files in the `supabase/migrations` directory.
- **Row Level Security (RLS):** RLS is enabled on all tables to ensure data privacy and security. Policies are defined in the migration files.
- **Authentication:** Supabase Auth is used for user authentication.

### Code Style and Structure

- **Service-Repository Pattern:** The project follows a service-repository pattern for data access. The `src/api` directory contains files that act as repositories for different data entities (e.g., `boards.ts`, `tasks.ts`). These files export functions for interacting with the Supabase backend.
- **React Query:** TanStack Query is used for data fetching, caching, and state management. This is the preferred method for managing server state.
- **TypeScript:** The project is written in TypeScript, and type definitions should be used consistently.
- **ESLint:** ESLint is used for code linting. Adherence to the configured rules is expected.

## Gemini's Role

As an AI assistant, I will adhere to the following principles when working on this project:

- **Follow Existing Conventions:** I will follow the established conventions for code style, project structure, and development workflow.
- **Use React Query:** I will use TanStack Query for all data fetching and state management tasks.
- **Respect the Service-Repository Pattern:** I will use the existing service-repository pattern for all data access, creating new services in the `src/api` directory as needed.
- **Maintain Code Quality:** I will ensure that all code I write adheres to the project's linting rules and TypeScript standards.
- **Communicate Clearly:** I will communicate any questions or suggestions I have clearly and concisely.

# GoCMS Technical Documentation

## Table of Contents

1. **[Project Overview](./01-project-overview.md)** - Current state, architecture, and technology stack
2. **[Setup and Installation](./02-setup-installation.md)** - Getting started with GoCMS development
3. **[Database Schema](./03-database-schema.md)** - Prisma models and database structure
4. **[Authentication System](./04-authentication.md)** - JWT-based authentication flow
5. **[API Documentation](./05-api-documentation.md)** - Available endpoints and usage
6. **[Admin Panel](./06-admin-panel.md)** - Administration interface components and features
7. **[UI Components](./07-ui-components.md)** - ShadCN/UI component library usage
8. **[Page Rendering System](./08-page-rendering.md)** - Template-based content rendering
9. **[Development Workflow](./09-development-workflow.md)** - Guidelines and best practices

## Quick Start

For immediate setup, see [Setup and Installation](./02-setup-installation.md).

## Architecture Overview

GoCMS is a Next.js-based content management system with the following key features:

- **Template-based content management** - Developers control layout, clients control content
- **Block-based architecture** - Modular content blocks with configurable fields
- **JWT authentication** - Secure session management without external providers
- **SQLite database** - Simple development setup with Prisma ORM
- **Modern UI** - ShadCN/UI components with Tailwind CSS
- **TypeScript-first** - Strict type safety throughout the application

## Core Philosophy

GoCMS follows a "controlled design" philosophy where:
- Developers/agencies maintain full control over site structure and styling
- Clients can only modify content through predefined, safe interfaces
- Performance and maintainability are prioritized over flexibility
- No complex page builders or structural editing capabilities for end users
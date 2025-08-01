# Overview

This is an admin panel application for LimpeJá, a Brazilian home cleaning services platform. The application provides administrators with tools to manage the platform's core operations including provider verification, user management, financial oversight, and analytics. Built as a modern web application with a React frontend and Express backend, it serves as the central control hub for platform administration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and developer experience
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Radix UI components with shadcn/ui design system for consistent, accessible interface
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for full-stack type safety
- **API Design**: RESTful API with clear resource-based endpoints
- **Data Storage**: In-memory storage implementation with interface abstraction for future database integration
- **Development**: Hot reloading with Vite middleware integration

## Database Design
- **ORM**: Drizzle ORM configured for PostgreSQL with type-safe schema definitions
- **Schema**: Comprehensive data model including users, providers, services, bookings, activities, and verification workflows
- **Migrations**: Managed through Drizzle Kit for schema evolution
- **Provider Verification**: Complex workflow supporting document upload, OCR processing, liveness detection, and manual review states

## Key Features
- **Dashboard Analytics**: Real-time metrics for active users, approved providers, revenue tracking, and service bookings
- **Provider Management**: Complete lifecycle management from registration through verification to ongoing monitoring
- **Verification Queue**: Streamlined interface for processing provider document verification with support for approval, rejection, and blocking actions
- **Financial Oversight**: Transaction monitoring and revenue analytics with commission tracking
- **Activity Monitoring**: Real-time activity feed for platform events and user actions

## Development Environment
- **Package Management**: npm with lock file for consistent dependency resolution
- **Development Server**: Integrated Vite dev server with Express API proxy
- **TypeScript Configuration**: Strict type checking with path aliases for clean imports
- **Code Quality**: ESLint and Prettier configuration for consistent code formatting

# External Dependencies

## UI and Styling
- **Radix UI**: Comprehensive primitive components for accessible UI development
- **Tailwind CSS**: Utility-first CSS framework with PostCSS processing
- **shadcn/ui**: Pre-built component library based on Radix UI primitives
- **Framer Motion**: Animation library for enhanced user interactions
- **Lucide React**: Icon library for consistent iconography

## Data and State Management
- **TanStack Query**: Server state management with intelligent caching and synchronization
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL support
- **Zod**: Runtime type validation and schema parsing
- **React Hook Form**: Form management with validation integration

## Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **ESBuild**: Fast bundling for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Database
- **PostgreSQL**: Primary database (configured via DATABASE_URL environment variable)
- **Neon Database**: Serverless PostgreSQL provider for cloud deployment
- **Drizzle Kit**: Database migration and schema management toolkit

## Charts and Visualization
- **Recharts**: Composable charting library for revenue analytics and data visualization

## Deployment and Production
- **Express.js**: Production server framework
- **Connect-pg-simple**: PostgreSQL session store for production deployments
- **Date-fns**: Date manipulation and formatting utilities
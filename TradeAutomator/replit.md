# XAUUSD Trading Application

## Overview

This is a full-stack trading application focused on XAU/USD (Gold/US Dollar) trading. The application provides a modern web interface for placing trades, monitoring positions, and managing trading activities with real-time market data integration. Features a professional TradingView-style candlestick chart with multiple timeframes, automated partial closing functionality, and live OANDA API integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Overall Architecture
The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React-based SPA using Vite for development and build tooling
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component system
- **State Management**: TanStack Query for server state management
- **Authentication**: Simple username/password authentication with localStorage persistence
- **External Integration**: OANDA API for live market data and trade execution

### Directory Structure
```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configuration
├── server/                 # Express.js backend
│   ├── services/           # Business logic services
│   └── routes.ts           # API route definitions
├── shared/                 # Shared types and schemas
└── migrations/             # Database migration files
```

## Key Components

### Frontend Components
- **Market Data Display**: Real-time XAU/USD price display with bid/ask spreads
- **Trade Form**: Interface for placing buy/sell orders with TP/SL configuration
- **Candlestick Chart**: Professional TradingView-style chart with multiple timeframes (1M, 5M, 15M, 1H, 4H, 1D)
- **Positions Panel**: Live monitoring of open positions with P&L tracking
- **Trade History**: Historical trade performance and analytics
- **Authentication System**: Simple hardcoded login (trader/password123) for single-user access

### Backend Services
- **OANDA Service**: Integration with OANDA API for market data and trade execution
- **Trade Monitor**: Background service for monitoring open positions and managing risk
- **Storage Layer**: Abstracted data access layer with in-memory implementation for development

### Database Schema
- **Users**: Authentication and user management
- **Trades**: Complete trade lifecycle tracking with entry/exit points
- **Account**: Account balance and margin tracking

## Data Flow

### Trade Execution Flow
1. User submits trade via TradeForm component
2. Frontend validates input and sends POST request to `/api/trades`
3. Backend processes trade data and integrates with OANDA API
4. Trade is stored in database with initial status
5. Trade Monitor service begins monitoring position
6. Real-time updates flow back to frontend via polling

### Market Data Flow
1. Frontend polls `/api/market/xauusd` endpoint every 2 seconds
2. Backend fetches live data from OANDA API
3. Price updates are displayed in MarketData component
4. Trade Monitor uses same data for position management

### Risk Management Flow
1. Trade Monitor runs every 5 seconds checking all active positions
2. Current prices are compared against TP1, TP2, and SL levels
3. When TP1 is hit, partial close is executed and SL moved to breakeven
4. Position updates are reflected in database and frontend

## External Dependencies

### Core Dependencies
- **React 18**: Frontend framework with hooks and modern patterns
- **Express.js**: Backend web framework
- **Drizzle ORM**: Type-safe database operations
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI primitives

### External Services
- **OANDA API**: Live forex market data and trade execution
- **Neon Database**: Serverless PostgreSQL hosting (configured for production)

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Zod**: Runtime type validation and schema generation

## Deployment Strategy

### Development Environment
- Uses Vite dev server with HMR for frontend development
- Express server runs with tsx for TypeScript execution
- In-memory storage for rapid development iteration
- Environment variables for OANDA API configuration

### Production Build
- Frontend built with Vite to static assets
- Backend bundled with esbuild for Node.js deployment
- Database migrations handled via Drizzle Kit
- Serves static frontend files from Express server

### Render Deployment Configuration
- **Root Directory**: `.` (project root)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 20.x
- **Required Environment Variables**:
  - `OANDA_API_KEY`: Your OANDA API key
  - `OANDA_ACCOUNT_ID`: Your OANDA account ID
  - `DATABASE_URL`: PostgreSQL connection string (optional for production)
  - `NODE_ENV`: production

### Database Strategy
- Drizzle ORM with PostgreSQL dialect
- Schema-first approach with shared types
- Migration-based database evolution
- Connection pooling via Neon's serverless architecture

### Configuration Management
- Environment variables for API keys and database URLs
- Separate development and production configurations
- Type-safe configuration validation

## Key Architectural Decisions

### Database Choice
**Problem**: Need reliable data persistence with strong consistency for financial data
**Solution**: PostgreSQL with Drizzle ORM
**Rationale**: PostgreSQL provides ACID compliance crucial for financial applications, while Drizzle offers type safety and excellent developer experience

### Real-time Updates
**Problem**: Need to show live market data and position updates
**Solution**: Polling-based approach with TanStack Query
**Rationale**: Simpler than WebSockets for this use case, with built-in caching and error handling

### State Management
**Problem**: Complex server state synchronization between components
**Solution**: TanStack Query for server state, local React state for UI state
**Rationale**: Eliminates need for global state management while providing excellent caching and synchronization

### Authentication Strategy
**Problem**: Simple authentication for single-user trading application
**Solution**: Basic username/password with localStorage persistence
**Rationale**: Appropriate for the scope while maintaining simplicity; easily upgradeable to JWT or OAuth later

### Component Architecture
**Problem**: Need consistent, accessible UI components
**Solution**: shadcn/ui component system built on Radix UI
**Rationale**: Provides accessibility, theming, and consistency while remaining customizable

### Risk Management
**Problem**: Automated position monitoring and risk management
**Solution**: Background service polling positions every 5 seconds
**Rationale**: Ensures consistent risk management without complex event systems
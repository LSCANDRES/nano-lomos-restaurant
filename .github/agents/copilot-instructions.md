# restaurante Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-08

## Active Technologies

**Languages**: 
- Node.js 18+ (JavaScript/ES6+)
- React 18+ (JavaScript/JSX)

**Backend Stack**:
- Express.js (REST API framework)
- PostgreSQL 14+ (database)
- socket.io (WebSocket/real-time)
- jsonwebtoken (JWT auth)
- bcrypt (password hashing)
- pg (PostgreSQL client)

**Frontend Stack**:
- React Router (navigation)
- axios (HTTP client)
- socket.io-client (WebSocket client)
- Material-UI or Tailwind CSS (styling)

**Testing**:
- Jest (unit tests)
- Supertest (API integration tests)
- React Testing Library (component tests)

**Database**: PostgreSQL 14+ at 192.168.100.35:5433



## Project Structure

```text
backend/
├── src/
│   ├── models/          # Database models (orders, users, menu, etc.)
│   ├── services/        # Business logic (orderService, kitchenService, etc.)
│   ├── routes/          # API endpoints (REST)
│   ├── middleware/      # Auth, validation, error handling
│   ├── database/        # Migrations, seeds, connection
│   ├── websocket/       # Socket.io handlers
│   └── server.js        # Express app entry point
└── tests/               # Backend tests

frontend/
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/           # Page views (OrderTaker, Cook, Manager)
│   ├── services/        # API service layer
│   ├── context/         # React Context (auth, orders)
│   ├── hooks/           # Custom hooks
│   └── App.jsx          # React app entry point
└── tests/               # Frontend tests

specs/
└── 001-restaurant-system/
    ├── spec.md          # Feature specification
    ├── plan.md          # Implementation plan
    ├── data-model.md    # Database schema
    ├── contracts/       # OpenAPI spec
    ├── research.md      # Technical decisions
    └── quickstart.md    # Developer guide
```

## Commands

```bash
# Backend
npm run dev          # Start dev server with nodemon
npm test             # Run tests
npm run migrate      # Run database migrations
npm run seed         # Seed initial data

# Frontend  
npm start            # Start React dev server
npm test             # Run component tests
npm run build        # Production build
``` 

## Code Style

**General**: 
- Follow JavaScript Standard Style
- Use ES6+ features (async/await, destructuring, arrow functions)
- Prefer functional patterns over classes where appropriate

**Backend**:
- RESTful API design patterns
- Async/await for database operations
- Express middleware for cross-cutting concerns
- Services layer for business logic
- Structured error responses: `{ error: { message, code, details } }`

**Frontend**:
- Functional React components with hooks
- Component composition
- Context for global state
- Custom hooks for reusable logic
- Consistent naming: PascalCase for components, camelCase for functions

**Database**:
- Use migrations for schema changes
- Transactions for critical operations
- Named indexes for performance
- Foreign key constraints for referential integrity

## Recent Changes

**2026-02-08**: Initial feature planning completed
- Spec finalized with 29 functional requirements
- Architecture: Node.js + React + PostgreSQL
- Real-time updates via Socket.io
- JWT authentication with role-based access (manager, cook, order_taker)
- Real-time inventory tracking with automatic stock deduction



<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

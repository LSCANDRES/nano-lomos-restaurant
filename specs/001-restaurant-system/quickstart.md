# Quickstart Guide: Sistema de Gestión de Restaurante

**Feature**: 001-restaurant-system  
**Last Updated**: 2026-02-08

Esta guía te ayudará a configurar y ejecutar el sistema localmente para desarrollo.

## Prerequisites

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 18+ ([descargar](https://nodejs.org/))
- **npm** 9+ (viene con Node.js)
- **PostgreSQL** 14+ 
- **Git** para clonar el repositorio
- Editor de código (VS Code recomendado)

## Quick Setup (5 minutos)

### Step 1: Clone e Install

```bash
# Clone el repositorio
git clone <repository-url>
cd restaurante

# Checkout feature branch
git checkout 001-restaurant-system

# Install dependencies - Backend
cd backend
npm install

# Install dependencies - Frontend
cd ../frontend
npm install
```

### Step 2: Database Setup

```bash
# Crear base de datos (si no existe)
# En terminal de PostgreSQL o pgAdmin:
CREATE DATABASE restaurant_system;

# O usar comando SQL directo
psql -U postgres -h 192.168.100.35 -p 5433 -c "CREATE DATABASE restaurant_system;"
```

### Step 3: Environment Configuration

Crear archivo `.env` en `backend/` con:

```bash
# backend/.env
PORT=3002
DB_HOST=192.168.100.35
DB_PORT=5433
DB_USER=postgres
DB_PASS=dev1234
DB_NAME=restaurant_system
JWT_SECRET=your_jwt_secret_key_change_in_production
NODE_ENV=development
```

Crear archivo `.env` en `frontend/` con:

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:3002/api
REACT_APP_WS_URL=http://localhost:3002
```

### Step 4: Run Migrations & Seeds

```bash
cd backend

# Run database migrations
npm run migrate

# Seed initial data (users, menu, ingredients)
npm run seed
```

### Step 5: Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm start
```

✅ **Done!** 
- Backend running at: http://localhost:3002
- Frontend running at: http://localhost:3000
- API Docs: http://localhost:3002/api-docs (Swagger UI)

## Default Users for Testing

Después de ejecutar seeds, puedes login con:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| gerente | password123 | manager | Acceso completo al dashboard gerencial |
| cocinero1 | password123 | cook | Vista de cocina y pedidos asignados |
| pedidos1 | password123 | order_taker | Crear y gestionar pedidos |

## Project Structure

```
restaurante/
├── backend/
│   ├── src/
│   │   ├── models/          # Sequelize models
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation
│   │   ├── database/        # Migrations, seeds
│   │   └── server.js        # Entry point
│   ├── tests/               # Backend tests
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page views by role
│   │   ├── services/        # API calls
│   │   ├── context/         # React Context
│   │   └── App.jsx
│   ├── package.json
│   └── .env
│
└── specs/
    └── 001-restaurant-system/
        ├── spec.md          # Feature specification
        ├── plan.md          # Implementation plan
        ├── data-model.md    # Database schema
        └── contracts/       # API contracts
```

## Common Development Tasks

### Running Tests

```bash
# Backend unit tests
cd backend
npm test

# Backend with coverage
npm run test:coverage

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```bash
cd backend

# Create new migration
npm run migrate:create <migration-name>

# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:down
```

### API Testing

Use included Postman collection or Swagger UI:

```bash
# Import to Postman:
specs/001-restaurant-system/contracts/postman_collection.json

# Or visit Swagger UI:
http://localhost:3002/api-docs
```

### Linting & Formatting

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format
```

## Development Workflow

### 1. Make Changes

Edit files in `backend/src/` or `frontend/src/`

Hot reload está habilitado:
- Backend: nodemon recarga automáticamente
- Frontend: React dev server recarga automáticamente

### 2. Test Changes

```bash
# Run affected tests
npm test -- --watch

# Or test specific file
npm test -- services/orderService.test.js
```

### 3. Commit Changes

```bash
git add .
git commit -m "feat: descripción del cambio"
git push origin 001-restaurant-system
```

## Troubleshooting

### Database Connection Errors

**Error**: `ECONNREFUSED` o timeout

**Solutions**:
1. Verificar que PostgreSQL esté corriendo: `pg_isready -h 192.168.100.35 -p 5433`
2. Verificar credenciales en `.env`
3. Verificar firewall no bloquea puerto 5433
4. Test connection: `psql -U postgres -h 192.168.100.35 -p 5433`

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3002`

**Solutions**:
```bash
# Encontrar proceso usando el puerto
lsof -i :3002       # macOS/Linux
netstat -ano | findstr :3002  # Windows

# Matar el proceso
kill -9 <PID>       # macOS/Linux
taskkill /PID <PID> /F  # Windows

# O cambiar puerto en .env
PORT=3003
```

### Frontend Can't Connect to Backend

**Error**: `Network Error` en browser console

**Solutions**:
1. Verificar backend está corriendo: `curl http://localhost:3002/api/health`
2. Verificar `REACT_APP_API_URL` en frontend/.env
3. Verificar CORS está habilitado en backend
4. Check browser console para detalles del error

### Migration Errors

**Error**: `relation "users" already exists`

**Solutions**:
```bash
# Verificar estado de migraciones
npm run migrate:status

# Rollback all
npm run migrate:down:all

# Re-run migrations
npm run migrate
```

### Module Not Found

**Error**: `Cannot find module 'express'`

**Solutions**:
```bash
# Reinstalar dependencies
rm -rf node_modules package-lock.json
npm install

# O limpiar cache
npm cache clean --force
npm install
```

## Environment-Specific Setup

### Production Deployment (LAN Server)

1. **Build frontend**:
```bash
cd frontend
npm run build
# Output en frontend/build/
```

2. **Configure production .env**:
```bash
# backend/.env
NODE_ENV=production
PORT=3002
# ... otras vars
```

3. **Run with PM2**:
```bash
cd backend
npm install -g pm2
pm2 start src/server.js --name restaurant-api
pm2 startup
pm2 save
```

4. **Serve frontend with nginx** o Express static:
```bash
# En backend/server.js agregar:
app.use(express.static('../frontend/build'));
```

### Testing Environment

```bash
# backend/.env.test
NODE_ENV=test
DB_NAME=restaurant_system_test
PORT=3003
```

Run tests:
```bash
NODE_ENV=test npm test
```

## Next Steps

### For Backend Development

1. Review [data-model.md](./data-model.md) para entender schema
2. Review [contracts/openapi.yaml](./contracts/openapi.yaml) para API spec
3. Implement services en `backend/src/services/`
4. Add tests en `backend/tests/`

### For Frontend Development

1. Review [spec.md](./spec.md) para entender user stories
2. Implement components en `frontend/src/components/`
3. Create pages en `frontend/src/pages/` por rol
4. Connect to API en `frontend/src/services/`

### For Database Work

1. Review [data-model.md](./data-model.md) para schema completo
2. Create migrations: `npm run migrate:create`
3. Implement triggers y stored procedures si es necesario
4. Add indexes para performance

## Resources

- **Specification**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/openapi.yaml](./contracts/openapi.yaml)
- **Research & Decisions**: [research.md](./research.md)

## Getting Help

Si encuentras problemas:

1. Check [plan.md](./plan.md) para detalles técnicos
2. Review [research.md](./research.md) para decisiones de arquitectura
3. Check GitHub Issues
4. Ask in team chat

## Quick Commands Reference

```bash
# Backend
npm run dev          # Start dev server
npm test             # Run tests
npm run migrate      # Run migrations
npm run seed         # Seed database
npm run lint         # Lint code

# Frontend
npm start            # Start dev server
npm test             # Run tests
npm run build        # Build for production
npm run lint         # Lint code

# Database
npm run migrate      # Run migrations
npm run migrate:down # Rollback last
npm run migrate:status # Check status
npm run seed         # Run seeds
```

---

**Happy coding! 🚀**

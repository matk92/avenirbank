# AVENIR Bank - Development Constraints & Rules

## 🎯 Project Requirements Enforcement

This document defines strict constraints to ensure all development respects the pedagogical requirements from `/sujet`.

### CRITICAL: Clean Architecture Layers

**RULE 1: Strict Layer Separation**
- ✅ `@domain/*` - Pure business logic, NO framework dependencies
- ✅ `@application/*` - Use cases & services, NO HTTP/database specifics
- ✅ `@interface/*` - Controllers/Routes, HTTP concerns only
- ✅ `@infrastructure/*` - Database, external services, framework-specific

**VIOLATION EXAMPLES (FORBIDDEN):**
- ❌ Importing `@nestjs/common` in domain layer
- ❌ Importing database entities in application layer
- ❌ Business logic in controllers
- ❌ HTTP decorators in services

### CRITICAL: TypeScript Strictness

**RULE 2: No 'any' Types**
- All variables, parameters, return types MUST be explicitly typed
- Use `unknown` if type is truly unknown, then narrow it
- Strict mode enabled in tsconfig.json

**VIOLATION EXAMPLES:**
- ❌ `const x: any = ...`
- ❌ `function foo(param) { ... }` (missing type)
- ❌ `return result;` (missing return type annotation)

### CRITICAL: Feature Completeness

**RULE 3: Implement All Required Features**

From Sujet-5-1.md (Clean Architecture):
- [ ] **Client Features:**
  - Authentication (registration + email confirmation)
  - Account management (create, delete, rename, IBAN generation)
  - Operations (transfers between own accounts)
  - Savings accounts (daily interest accrual)
  - Investments (stock trading with order book)

- [ ] **Director Features:**
  - Authentication
  - Account management (create, modify, delete, ban)
  - Savings rate management + client notifications
  - Stock management

- [ ] **Advisor Features:**
  - Authentication
  - Loan management (amortization calculation)
  - Client messaging (WebSocket)
  - Activity creation (SSE feed)
  - Notifications

From projet_web_temps_reel.md (Real-time):
- [ ] WebSocket chat (client-advisor, advisor-director)
- [ ] SSE feed/notifications
- [ ] Fixtures/seed data

From Sujet-4-1.md (Frontend):
- [ ] Atomic Design components
- [ ] React Hook Form + Zod validation
- [ ] French & English i18n
- [ ] 404 & 500 error pages
- [ ] Sitemap.xml
- [ ] SEO metadata
- [ ] Server-side rendering
- [ ] Application caching

### CRITICAL: Database Adapters

**RULE 4: Two Database Implementations Required**
- Primary: PostgreSQL (TypeORM)
- Secondary: In-memory repository (for testing) OR MongoDB

Both must implement the same repository interface.

**Implementation Pattern:**
```typescript
// interface (framework-agnostic)
interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// PostgreSQL adapter
@Injectable()
export class PostgresUserRepository implements IUserRepository { }

// In-memory adapter
@Injectable()
export class InMemoryUserRepository implements IUserRepository { }
```

### CRITICAL: Framework Diversity

**RULE 5: Two Backend Frameworks**
- Primary: NestJS (with TypeORM)
- Secondary: Express (with same domain/application layers)

Both must share the same domain and application layers.

### CRITICAL: Real-time Implementation

**RULE 6: Real-time Technologies**
- **WebSocket**: socket.io for chat (client-advisor, advisor-director)
- **SSE**: Native Node.js response streaming for feed/notifications
- **NOT** WebSocket for everything (SSE is required for feed)

### CRITICAL: IBAN Generation

**RULE 7: Valid IBAN Generation**
- Each account MUST have a unique, mathematically valid IBAN
- IBAN format: FR + 2 check digits + 5 bank code + 5 branch code + 11 account number
- Implement IBAN checksum validation (mod-97)

### CRITICAL: Savings Interest Calculation

**RULE 8: Daily Interest Accrual**
- Interest calculated daily at admin-set rate
- Applied to savings account balance
- Formula: `daily_interest = balance * (annual_rate / 365)`
- Must handle rate changes (retroactive or prospective per requirements)

### CRITICAL: Stock Trading

**RULE 9: Order Book & Price Calculation**
- Price = equilibrium between bid/ask prices
- 1€ fee per transaction (buy AND sell)
- Stocks defined by director only
- Real-time price updates via SSE

### CRITICAL: Loan Amortization

**RULE 10: Constant Monthly Payment**
- Method: Amortization with constant monthly payment
- Components: Principal + Interest + Insurance
- Insurance: Calculated on total loan amount, deducted from monthly payment
- Interest: Calculated on remaining capital each month

### CRITICAL: Authentication & Authorization

**RULE 11: Role-Based Access Control (RBAC)**
- Three roles: CLIENT, ADVISOR, DIRECTOR
- JWT tokens with role claims
- Every endpoint must validate user role
- No cross-role access without explicit authorization

### CRITICAL: Internationalization

**RULE 12: French & English Support**
- Frontend: i18n for all user-facing text
- Backend: Error messages in both languages
- Database: Support for language preference per user

### CRITICAL: Testing & Fixtures

**RULE 13: Seed Data Required**
- Create fixtures for all entities
- Provide test accounts:
  - 1 client account with sample data
  - 1 advisor account
  - 1 director account
- Document credentials in README

### CRITICAL: Documentation

**RULE 14: README Requirements**
- Team member names, surnames, class
- Installation instructions
- Launch instructions
- Data seeding instructions
- Test account credentials
- API endpoint documentation
- Database schema documentation

---

## ⚠️ Common Violations to Avoid

1. **Mixing concerns**: Business logic in controllers
2. **Framework leakage**: NestJS decorators in domain entities
3. **Weak typing**: Using `any` or missing type annotations
4. **Incomplete features**: Skipping required functionality
5. **Missing tests**: No unit/integration tests
6. **No fixtures**: Can't test without seed data
7. **Single database**: Only PostgreSQL, no adapter pattern
8. **Single framework**: Only NestJS, no Express implementation
9. **Wrong real-time tech**: WebSocket for feed instead of SSE
10. **Invalid IBANs**: Not validating IBAN checksums

---

## 🔍 Pre-commit Checklist

Before committing code:
- [ ] No `any` types in code
- [ ] All functions have return type annotations
- [ ] Domain layer has zero framework imports
- [ ] Application layer has zero HTTP/database imports
- [ ] All required features are implemented
- [ ] Tests pass
- [ ] Fixtures exist and work
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Documentation is up-to-date

---

## 📋 Feature Checklist

Use this to track implementation:

### Authentication
- [ ] Client registration with email confirmation
- [ ] Client login
- [ ] Advisor authentication
- [ ] Director authentication
- [ ] JWT token generation & validation
- [ ] Role-based access control

### Accounts
- [ ] Create account
- [ ] Delete account
- [ ] Rename account
- [ ] IBAN generation (valid, unique)
- [ ] List user accounts
- [ ] Get account details

### Transactions
- [ ] Transfer between own accounts
- [ ] Balance calculation
- [ ] Transaction history
- [ ] Real-time balance updates

### Savings
- [ ] Create savings account
- [ ] Daily interest accrual
- [ ] Interest rate changes
- [ ] Client notifications on rate change

### Investments
- [ ] Create stock (director only)
- [ ] Buy stock order
- [ ] Sell stock order
- [ ] Order book management
- [ ] Price calculation (bid/ask equilibrium)
- [ ] Real-time price updates (SSE)

### Loans
- [ ] Create loan (advisor only)
- [ ] Calculate monthly payment
- [ ] Calculate insurance
- [ ] Amortization schedule
- [ ] Monthly payment processing

### Messaging
- [ ] Client-Advisor chat (WebSocket)
- [ ] Advisor-Director chat (WebSocket)
- [ ] Message persistence
- [ ] Typing indicator (bonus)

### Feed & Notifications
- [ ] Activity feed (SSE)
- [ ] Notifications (SSE)
- [ ] Rate change notifications
- [ ] Push notifications (bonus)

---

## 🚀 Deployment Checklist

- [ ] Docker Compose works
- [ ] Environment variables documented
- [ ] Database migrations run
- [ ] Fixtures load
- [ ] Frontend connects to backend
- [ ] Real-time features work
- [ ] All tests pass
- [ ] README complete

# AVENIR Bank - Quick Reference Guide

## 🎯 Before You Code

**ALWAYS CHECK:**
1. Is this in the right layer? (domain/application/interface/infrastructure)
2. Does it have explicit types? (no `any`)
3. Does it respect the constraint rules? (see constraints.md)
4. Is it in the feature checklist? (see constraints.md)

## 📁 File Structure

```
backend/
├── src/
│   ├── domain/
│   │   ├── entities/           # User, Account, Transaction, etc.
│   │   ├── value-objects/      # IBAN, Money, Email, etc.
│   │   └── repositories/       # Interfaces (IUserRepository, etc.)
│   ├── application/
│   │   ├── use-cases/          # RegisterUserUseCase, CreateAccountUseCase, etc.
│   │   ├── services/           # ApplicationService, etc.
│   │   └── dto/                # Data transfer objects
│   ├── interface/
│   │   ├── auth/               # AuthController, AuthGuard
│   │   ├── users/              # UsersController
│   │   ├── accounts/           # AccountsController
│   │   ├── transactions/       # TransactionsController
│   │   ├── savings/            # SavingsController
│   │   ├── stocks/             # StocksController
│   │   ├── loans/              # LoansController
│   │   ├── messaging/          # MessagingController, WebSocket
│   │   └── notifications/      # NotificationsController, SSE
│   └── infrastructure/
│       ├── database/
│       │   ├── postgres/       # PostgreSQL adapter
│       │   ├── in-memory/      # In-memory adapter
│       │   ├── entities/       # TypeORM entities
│       │   ├── migrations/     # Database migrations
│       │   └── seeds/          # Seed data
│       ├── cache/              # Redis integration
│       └── email/              # Email service
```

## 🔑 Key Patterns

### Repository Pattern
```typescript
// Domain: Define interface
export interface IUserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// Infrastructure: Implement for PostgreSQL
@Injectable()
export class PostgresUserRepository implements IUserRepository {
  // Implementation
}

// Infrastructure: Implement for In-Memory
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  // Implementation
}
```

### Use Case Pattern
```typescript
// Application layer
@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<User> {
    // Business logic here (no framework code)
  }
}
```

### Controller Pattern
```typescript
// Interface layer (NestJS)
@Controller('users')
export class UsersController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @Post('register')
  async register(@Body() dto: RegisterUserDto): Promise<UserDto> {
    const user = await this.registerUserUseCase.execute(dto);
    return UserMapper.toPersistence(user);
  }
}
```

## ✅ Checklist Before Commit

- [ ] No `any` types
- [ ] All functions have return types
- [ ] Domain layer has ZERO framework imports
- [ ] Application layer has ZERO HTTP/database imports
- [ ] Tests pass: `npm run test`
- [ ] Lint passes: `npm run lint`
- [ ] TypeScript compiles: `npm run build`
- [ ] Feature is in the requirements checklist

## 🚀 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run lint            # Check code style
npm run test            # Run tests
npm run test:watch     # Run tests in watch mode

# Database
npm run migration:generate -- src/infrastructure/database/migrations/Name
npm run migration:run   # Run migrations
npm run migration:revert # Revert last migration
npm run seed            # Load seed data

# Docker
docker-compose up --build    # Start all services
docker-compose down          # Stop all services
```

## 🔒 Constraint Violations (DON'T DO THIS)

### ❌ Framework in Domain
```typescript
// WRONG
import { Injectable } from '@nestjs/common';
export class User {
  @Column() name: string;  // TypeORM decorator
}
```

### ✅ Correct
```typescript
// RIGHT
export class User {
  name: string;
}
```

### ❌ Business Logic in Controller
```typescript
// WRONG
@Post('transfer')
async transfer(@Body() dto: TransferDto) {
  const balance = account.balance - amount;
  if (balance < 0) throw new Error('Insufficient funds');
  // ...
}
```

### ✅ Correct
```typescript
// RIGHT - Business logic in domain
export class Account {
  debit(amount: number): void {
    if (this.balance < amount) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
  }
}

// Controller just calls use case
@Post('transfer')
async transfer(@Body() dto: TransferDto) {
  return this.transferUseCase.execute(dto);
}
```

### ❌ Any Types
```typescript
// WRONG
const user: any = {};
function process(data) { }
```

### ✅ Correct
```typescript
// RIGHT
const user: User = new User(...);
function process(data: string): void { }
```

## 📊 Feature Implementation Order

1. **Authentication** (foundation for everything)
   - User registration
   - Email confirmation
   - Login/JWT
   - RBAC

2. **Accounts** (core feature)
   - Create account with IBAN
   - List accounts
   - Account management

3. **Transactions** (core feature)
   - Transfer between accounts
   - Transaction history
   - Balance calculation

4. **Savings** (business logic)
   - Create savings account
   - Interest accrual
   - Rate management

5. **Stocks** (complex business logic)
   - Stock management
   - Order book
   - Trading

6. **Loans** (complex business logic)
   - Loan creation
   - Amortization calculation
   - Monthly payments

7. **Real-time** (WebSocket + SSE)
   - Chat (WebSocket)
   - Feed (SSE)
   - Notifications (SSE)

## 🧪 Testing Strategy

```typescript
// Unit test (domain layer - no dependencies)
describe('Account', () => {
  it('should debit amount', () => {
    const account = new Account('1', 'user1', 'FR...', 'Main', AccountType.CHECKING);
    account.credit(100);
    account.debit(50);
    expect(account.balance).toBe(50);
  });
});

// Integration test (use case with mocked repository)
describe('RegisterUserUseCase', () => {
  it('should register user', async () => {
    const mockRepository = mock(IUserRepository);
    const useCase = new RegisterUserUseCase(mockRepository);
    // Test
  });
});
```

## 📚 Documentation Links

- Full constraints: `.windsurf/constraints.md`
- Project context: `adam.txt`
- Backend setup: `backend/README.md`
- Architecture: `backend/docs/ARCHITECTURE.md` (create as needed)

## 🆘 Need Help?

1. Check constraints.md for rules
2. Check feature checklist in constraints.md
3. Review existing code patterns
4. Check test examples
5. Read backend/README.md

---

**Remember:** Clean Architecture is about making the code flexible, testable, and independent of frameworks. Keep layers separated!

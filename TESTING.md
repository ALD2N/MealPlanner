# DnDMeal Testing Guide

This document describes the testing setup and structure for the DnDMeal application.

## Overview

The DnDMeal project includes a comprehensive test suite covering:
- **Frontend**: Component tests and context tests using Vitest + React Testing Library
- **Backend**: Service tests and route tests using Jest
- **Test coverage**: Unit tests, integration tests, and key business logic

## Frontend Testing

### Framework
- **Test Runner**: Vitest (configured in `client/vitest.config.ts`)
- **Testing Library**: @testing-library/react
- **User Interaction**: @testing-library/user-event

### Running Tests

```bash
cd client

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm test -- --coverage
```

### Test Files Structure

```
client/src/
├── components/
│   ├── __tests__/
│   │   ├── RecipeCard.test.tsx
│   │   ├── FilterPills.test.tsx
│   │   ├── RecipeModal.test.tsx
│   │   └── ...
│   ├── RecipeCard.tsx
│   ├── FilterPills.tsx
│   ├── RecipeModal.tsx
│   └── ...
├── contexts/
│   ├── __tests__/
│   │   ├── ToastContext.test.tsx
│   │   └── ...
│   ├── ToastContext.tsx
│   └── ...
└── test/
    └── setup.ts
```

### Frontend Test Coverage

#### Components
- **RecipeCard**: Tests for title, author, ratings, badges, click handlers
- **FilterPills**: Tests for active state, click handlers, styling
- **RecipeModal**: Tests for modal visibility, form submissions, rating functionality

#### Contexts
- **ToastContext**: Tests for toast creation, auto-removal, manual removal, persistence

### Writing Frontend Tests

Example test structure:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(/* assertion */);
  });
});
```

## Backend Testing

### Framework
- **Test Runner**: Jest (configured in `server/jest.config.js`)
- **Language**: TypeScript (via ts-jest)
- **Mocking**: Built-in Jest mocks and vitest for service tests

### Running Tests

```bash
cd server

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- AuthService.test.ts
```

### Test Files Structure

```
server/src/
├── services/
│   ├── __tests__/
│   │   ├── AuthService.test.ts
│   │   ├── RecipeService.test.ts
│   │   └── ...
│   ├── AuthService.ts
│   ├── RecipeService.ts
│   └── ...
├── routes/
│   ├── __tests__/
│   │   ├── recipes.test.ts
│   │   └── ...
│   ├── recipes.ts
│   └── ...
└── test/
    └── setup.ts
```

### Backend Test Coverage

#### Services
- **AuthService**: Password hashing, token generation/verification, user conversion
- **RecipeService**: CRUD operations, rating management, authorization checks

#### Routes
- **Recipe Routes**: GET (list, single), POST (create), PATCH (update, rate), DELETE
- **Validation**: Required fields, rating bounds, user authorization
- **WebSocket broadcasts**: Event emissions on recipe changes

### Writing Backend Tests

Example test structure:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '../MyService';

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('performs operation correctly', async () => {
    const result = await MyService.myMethod('input');
    expect(result).toEqual(expectedOutput);
  });

  it('handles errors gracefully', async () => {
    await expect(MyService.myMethod('bad')).rejects.toThrow();
  });
});
```

## Test Best Practices

### General
1. **One assertion per test** (when possible) - keeps tests focused
2. **Clear test names** - describe what is being tested and the expected behavior
3. **Arrange-Act-Assert pattern** - organize test logic clearly
4. **Mock external dependencies** - keep tests isolated and fast
5. **Test behavior, not implementation** - focus on what users/systems experience

### Frontend
1. **Use userEvent over fireEvent** - userEvent is more realistic
2. **Avoid implementation details** - query by role, label, text (not className)
3. **Test async operations** - use async/await in test functions
4. **Clean up after tests** - use afterEach hooks for cleanup

### Backend
1. **Mock database calls** - use mocked models for unit tests
2. **Test error cases** - verify error handling and messages
3. **Test authorization** - ensure permission checks work
4. **Test validation** - verify input validation for all routes

## Coverage Goals

- **Components**: 80%+ coverage
- **Services**: 90%+ coverage
- **Routes**: 75%+ coverage (especially validation and authorization)
- **Overall**: Aim for 85%+ overall coverage

## Continuous Integration

Tests should be run automatically:
1. Before committing (pre-commit hooks)
2. On pull requests (CI/CD pipeline)
3. Before deployment (build stage)

## Debugging Tests

### Frontend
```bash
# Debug in Node
node --inspect-brk ./node_modules/vitest/vitest.mjs

# Run specific test
npm test -- RecipeCard.test.tsx

# Run tests matching pattern
npm test -- --grep "renders"
```

### Backend
```bash
# Debug Jest
node --inspect-brk node_modules/.bin/jest

# Run specific test
npm test -- AuthService.test.ts

# Run tests matching pattern
npm test -- -t "hashes"
```

## Adding New Tests

1. Create test file in `__tests__` directory next to source file
2. Name test file: `ComponentName.test.tsx` or `ServiceName.test.ts`
3. Import necessary testing utilities
4. Write tests following project conventions
5. Run tests to verify: `npm test`
6. Maintain or improve coverage levels

## Common Testing Patterns

### Testing React Components with Context

```typescript
const renderWithContext = (component: React.ReactElement) => {
  return render(
    <ContextProvider>
      {component}
    </ContextProvider>
  );
};

describe('MyComponent', () => {
  it('uses context value', () => {
    renderWithContext(<MyComponent />);
    // assertions
  });
});
```

### Testing Async Service Methods

```typescript
it('handles async operation', async () => {
  const result = await service.asyncMethod();
  expect(result).toBeDefined();
});

it('handles service errors', async () => {
  vi.spyOn(service, 'asyncMethod').mockRejectedValue(new Error('Failed'));
  await expect(service.asyncMethod()).rejects.toThrow();
});
```

### Testing Timer-Based Code

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it('triggers after timeout', () => {
  // ... code
  vi.advanceTimersByTime(5000);
  // ... assertions
});
```

## Troubleshooting

### Tests not running
- Check that test files match pattern: `*.test.ts` or `*.test.tsx`
- Verify dependencies installed: `npm install`
- Clear cache: `npm test -- --clearCache`

### Module not found errors
- Check import paths are relative or use aliases
- Verify tsconfig.json includes necessary paths
- Check that files exist at specified paths

### Timeout errors
- Increase timeout: `it('test', async () => { ... }, 10000)`
- Check for missing async/await or promise handling
- Look for infinite loops or unresolved promises

### Assertion failures
- Use `screen.debug()` to inspect rendered output
- Check that selectors match actual content
- Verify test data matches component expectations

## Resources

- [Vitest Documentation](https://vitest.dev)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Documentation](https://jestjs.io)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

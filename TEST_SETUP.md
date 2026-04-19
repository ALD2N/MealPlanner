# Test Suite Setup & Execution Guide

## Quick Start

### Frontend Tests
```bash
cd client
npm install
npm test
```

### Backend Tests
```bash
cd server
npm install
npm test
```

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Frontend Dependencies
The client/package.json includes:
- **vitest** - Lightning-fast unit test framework
- **@testing-library/react** - React component testing utilities
- **@testing-library/user-event** - Realistic user interaction simulation
- **@vitest/ui** - Visual test runner interface
- **@testing-library/jest-dom** - Custom matchers for DOM assertions

### Backend Dependencies
The server/package.json includes:
- **jest** - Mature testing framework with excellent TypeScript support
- **ts-jest** - TypeScript support for Jest
- **@types/jest** - TypeScript types for Jest

## Running Tests

### Frontend

#### Run all tests
```bash
cd client
npm test
```

#### Run tests in watch mode (auto-rerun on file changes)
```bash
npm test -- --watch
```

#### Run specific test file
```bash
npm test -- RecipeCard.test.tsx
```

#### Run tests matching pattern
```bash
npm test -- --grep "renders"
```

#### Run with UI (visual test runner)
```bash
npm run test:ui
```

#### Generate coverage report
```bash
npm test -- --coverage
```

### Backend

#### Run all tests
```bash
cd server
npm test
```

#### Run tests in watch mode
```bash
npm test -- --watch
```

#### Run specific test file
```bash
npm test -- AuthService.test.ts
```

#### Run tests matching pattern
```bash
npm test -- -t "hashes"
```

#### Generate coverage report
```bash
npm test -- --coverage
```

## Test File Organization

### Frontend Structure
```
client/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── RecipeCard.test.tsx
│   │   │   ├── FilterPills.test.tsx
│   │   │   └── RecipeModal.test.tsx
│   │   ├── RecipeCard.tsx
│   │   ├── FilterPills.tsx
│   │   └── RecipeModal.tsx
│   ├── contexts/
│   │   ├── __tests__/
│   │   │   └── ToastContext.test.tsx
│   │   └── ToastContext.tsx
│   └── test/
│       └── setup.ts
└── vitest.config.ts
```

### Backend Structure
```
server/
├── src/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── AuthService.test.ts
│   │   │   └── RecipeService.test.ts
│   │   ├── AuthService.ts
│   │   └── RecipeService.ts
│   ├── routes/
│   │   ├── __tests__/
│   │   │   └── recipes.test.ts
│   │   └── recipes.ts
│   └── test/
│       └── setup.ts
└── jest.config.js
```

## Configuration Details

### Frontend Configuration (vitest.config.ts)
```typescript
- Environment: jsdom (browser-like environment)
- Globals: true (global test functions)
- Setup files: ./src/test/setup.ts
- Coverage: v8 reporter
- Path alias: @ → ./src
```

### Backend Configuration (jest.config.js)
```javascript
- Preset: ts-jest
- Environment: node
- Setup files: ./src/test/setup.ts
- Coverage providers: v8
```

## Available Test Commands

### Frontend
```bash
npm test                    # Run all tests
npm run test:ui            # Run with visual UI
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage report
npm test -- RecipeCard     # Specific file
npm test -- --grep "renders" # Pattern matching
```

### Backend
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage report
npm test -- AuthService    # Specific file
npm test -- -t "hashes"    # Pattern matching
npm test -- --listTests    # List all tests
```

## Expected Test Counts

### Frontend
- RecipeCard.test.tsx: 13 tests
- FilterPills.test.tsx: 10 tests
- RecipeModal.test.tsx: 13 tests
- ToastContext.test.tsx: 11 tests
- **Total: 47 tests**

### Backend
- AuthService.test.ts: 18 tests
- RecipeService.test.ts: 19 tests
- recipes.test.ts: 19 tests
- **Total: 56 tests**

### Combined
- **Total: 103 tests**

## Continuous Integration

### Pre-commit Hook (Recommended)
```bash
# In .git/hooks/pre-commit
npm test --prefix client || exit 1
npm test --prefix server || exit 1
```

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Client Tests
        run: cd client && npm install && npm test
      
      - name: Server Tests
        run: cd server && npm install && npm test
```

## Troubleshooting

### Frontend Issues

**Tests not found**
- Ensure test files end with `.test.tsx`
- Check file is in `__tests__` directory
- Run: `npm test -- --listTests`

**Module import errors**
- Verify import paths are correct
- Check `vitest.config.ts` aliases match tsconfig
- Clear cache: `npm test -- --clearCache`

**Timeout errors**
- Increase timeout: `it('test', async () => {...}, 10000)`
- Check for unresolved promises
- Verify timers are properly managed

**React rendering issues**
- Wrap components with necessary providers in tests
- Use `renderWithProvider` helper function
- Check mock implementations

### Backend Issues

**Cannot find module**
- Verify module paths
- Check ts-jest configuration
- Ensure TypeScript paths are set up

**Async test failures**
- Use `async/await` in test functions
- Verify promises are properly resolved
- Check for missing error handling

**Mock not working**
- Verify mock path matches import
- Clear Jest cache: `npm test -- --clearCache`
- Check mock is defined before test runs

## Coverage Goals

- **Components**: 80%+ line coverage
- **Services**: 90%+ line coverage
- **Routes**: 75%+ line coverage
- **Overall**: 85%+ line coverage

## Debugging

### Frontend Debug
```bash
# Run tests with debugging info
npm test -- --reporter=verbose

# Use node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Add console.log in tests
screen.debug()  // See rendered output
```

### Backend Debug
```bash
# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Verbose output
npm test -- --verbose

# No coverage (faster)
npm test -- --no-coverage
```

## Adding New Tests

1. Create test file next to source file
2. Name: `ComponentName.test.tsx` or `ServiceName.test.ts`
3. Follow existing patterns:
   ```typescript
   import { describe, it, expect } from 'vitest';
   
   describe('ComponentName', () => {
     it('does something', () => {
       expect(true).toBe(true);
     });
   });
   ```
4. Run tests to verify: `npm test`
5. Keep coverage at project standards

## Performance Tips

- Use `--watch` for development to avoid re-running all tests
- Run `--no-coverage` during development (add coverage on CI only)
- Keep tests isolated and independent
- Mock external dependencies efficiently
- Use `beforeEach` for setup instead of duplicating code

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Support

For test-related questions:
1. Check TESTING.md for comprehensive guide
2. Review existing test examples
3. Check configuration files
4. See troubleshooting section above

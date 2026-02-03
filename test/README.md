# Triva Tests

This directory contains all tests and examples for the Triva framework.

## Structure

```
test/
├── examples/          # Usage examples (runnable code)
├── unit/             # Unit tests
└── integration/      # Integration tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific test file
npx mocha test/unit/cache.test.js
```

## Running Examples

Each example demonstrates a specific feature or use case:

```bash
# Basic usage example
npm run example:basic

# MongoDB caching example
npm run example:mongodb

# Redis caching example
npm run example:redis

# PostgreSQL example
npm run example:postgresql

# Full enterprise configuration
npm run example:enterprise
```

## Examples

### Basic Example (`examples/basic.js`)
- GET/POST/PUT/DELETE routes
- Route parameters
- Error handling
- Minimal configuration

### MongoDB Example (`examples/mongodb.js`)
- MongoDB cache configuration
- Caching patterns
- Cache invalidation

### Redis Example (`examples/redis.js`)
- Redis cache configuration
- High-performance caching
- Session-like caching

### PostgreSQL Example (`examples/postgresql.js`)
- PostgreSQL cache configuration
- Complex query caching
- User preferences caching

### Enterprise Example (`examples/enterprise.js`)
- Full production configuration
- Advanced throttling policies
- Error tracking integration
- Request logging
- Cookie authentication
- Admin endpoints

## Unit Tests

Unit tests cover individual modules in isolation:

- `cache.test.js` - Cache module tests
- `routing.test.js` - Routing functionality tests
- `throttle.test.js` - Rate limiting tests

## Integration Tests

Integration tests verify that components work together correctly:

- `full-app.test.js` - Complete application workflow tests

## Writing Tests

When adding new tests, follow these guidelines:

1. **Use descriptive names** - Test names should explain what is being tested
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test edge cases** - Don't just test the happy path
4. **Mock external dependencies** - Unit tests should be isolated
5. **Keep tests focused** - One test should verify one thing

Example:

```javascript
describe('Feature Name', () => {
  describe('specific functionality', () => {
    it('should do something specific', async () => {
      // Arrange - set up test data
      const input = 'test value';
      
      // Act - execute the code being tested
      const result = await someFunction(input);
      
      // Assert - verify the result
      assert.strictEqual(result, expected);
    });
  });
});
```

## Test Requirements

All contributions must include tests:

- New features require unit tests
- Bug fixes should include regression tests
- Breaking changes need migration tests
- Aim for >80% code coverage

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every commit to main branch
- Before releases

Make sure all tests pass before submitting a PR!

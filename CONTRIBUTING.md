# Contributing to Triva

Thank you for your interest in contributing to Triva! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/triva.git`
3. Add upstream remote: `git remote add upstream https://github.com/ORIGINAL/triva.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

```bash
# Install dependencies
npm install

# Install dev dependencies
npm install --save-dev mocha chai

# Run tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration

# Generate documentation
npm run docs
```

## Making Changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications

Examples:
- `feature/add-mysql-adapter`
- `fix/cache-memory-leak`
- `docs/update-api-reference`

### Commit Messages

Follow the conventional commits specification:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(cache): add Redis adapter support

Implement Redis cache adapter with connection pooling
and automatic reconnection on failure.

Closes #123
```

```
fix(throttle): resolve rate limit memory leak

Fixed memory leak in rate limit tracking that occurred
when handling high request volumes.

Fixes #456
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run specific test file
npx mocha test/unit/cache.test.js
```

### Writing Tests

All new features must include tests. Follow these guidelines:

1. **Unit Tests** - Test individual functions/modules in isolation
2. **Integration Tests** - Test how components work together
3. **Use descriptive test names** - Test names should describe what is being tested
4. **Follow AAA pattern** - Arrange, Act, Assert

Example:

```javascript
describe('Cache Module', () => {
  describe('set and get', () => {
    it('should store and retrieve string values', async () => {
      // Arrange
      const key = 'test:string';
      const value = 'hello world';

      // Act
      await cache.set(key, value);
      const result = await cache.get(key);

      // Assert
      assert.strictEqual(result, value);
    });
  });
});
```

### Test Coverage

- Aim for >80% code coverage
- All public APIs must be tested
- Edge cases should be covered
- Error conditions should be tested

## Submitting Changes

### Pull Request Process

1. Update documentation for any changed functionality
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md with your changes
5. Push your changes to your fork
6. Create a Pull Request

### Pull Request Template

```markdown
## Description
[Describe what this PR does]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or clearly documented)

## Related Issues
Closes #[issue number]
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Delete your branch after merge

## Coding Standards

### JavaScript Style

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use async/await for async operations
- Use destructuring where appropriate
- Use template literals for string interpolation

### File Organization

```
lib/
  ├── index.js          # Main exports
  ├── cache.js          # Cache module
  ├── middleware.js     # Middleware
  └── ...

test/
  ├── unit/            # Unit tests
  ├── integration/     # Integration tests
  └── examples/        # Example code

scripts/
  ├── test.js          # Test runner
  ├── release.js       # Release automation
  └── ...
```

### Documentation

- Use JSDoc for function/class documentation
- Include examples in documentation
- Update README.md for user-facing changes
- Keep CHANGELOG.md updated

Example JSDoc:

```javascript
/**
 * Set a value in the cache
 *
 * @param {string} key - The cache key
 * @param {any} value - The value to cache
 * @param {number} [ttl] - Time to live in milliseconds
 * @returns {Promise<void>}
 *
 * @example
 * await cache.set('user:123', { name: 'John' }, 3600000);
 */
async function set(key, value, ttl) {
  // ...
}
```

## Additional Resources

- [Issue Tracker](https://github.com/TrivaJS/triva/issues)
- [Discussions](https://github.com/orgs/TrivaJS/discussions)

## Questions?

Feel free to:
- Open an issue for bugs or feature requests
- Start a discussion for questions
- Join our Discord community (if available)

Thank you for contributing to Triva! 🎉

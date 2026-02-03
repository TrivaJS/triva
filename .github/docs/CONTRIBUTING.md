# Contributing to Triva

Thank you for your interest in contributing to Triva! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/triva.git
   cd triva
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Run Example**
   ```bash
   npm run example
   ```

## Project Structure

```
triva/
├── triva.js           # Main server framework
├── middleware.js      # Middleware and throttling system
├── cache.js          # Cache management
├── triva.log.js      # Logging system
├── example.js        # Example application
├── test.js           # Test suite
├── index.d.ts        # TypeScript definitions
└── README.md         # Documentation
```

## Code Style

- Use ES6+ features
- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- JSDoc comments for public APIs

Run the linter:
```bash
npm run lint
```

## Testing

- All new features should include tests
- Run `npm test` before submitting
- Aim for high code coverage
- Test both success and failure cases

## Adding Features

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update README if needed

3. **Test Your Changes**
   ```bash
   npm test
   npm run example
   ```

4. **Commit**
   ```bash
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build/tooling changes

## Areas for Contribution

### High Priority
- [ ] Additional cache backends (Redis, Memcached)
- [ ] WebSocket support
- [ ] Clustering support
- [ ] Request/response compression
- [ ] HTTPS support
- [ ] File upload handling

### Medium Priority
- [ ] Cookie parsing
- [ ] Session management
- [ ] Static file serving
- [ ] Template engine integration
- [ ] GraphQL support
- [ ] OpenAPI/Swagger integration

### Low Priority
- [ ] CLI tool for scaffolding
- [ ] Dashboard UI for monitoring
- [ ] Metrics export (Prometheus, etc.)
- [ ] Plugin system
- [ ] Hot reload support

## TypeScript Migration

We plan to migrate to TypeScript in the future. If you'd like to help:

1. Start with type definitions (`index.d.ts`)
2. Gradually convert modules one by one
3. Maintain backward compatibility
4. Update documentation

## Documentation

- Keep README.md up to date
- Add JSDoc comments for public APIs
- Include code examples in documentation
- Update CHANGELOG.md for releases

## Questions?

Feel free to:
- Open an issue for discussion
- Join our community chat (coming soon)
- Email the maintainers

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

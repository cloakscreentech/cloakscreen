# Contributing to Cloakscreen

Thank you for your interest in contributing to Cloakscreen! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Security](#security)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager
- Git

### Development Setup

1. **Fork and clone the repository**

   ```bash
   git clone https://github.com/your-username/cloakscreen.git
   cd cloakscreen
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your PallyCon credentials
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Run tests**

   ```bash
   npm test
   ```

6. **Build the library**
   ```bash
   npm run build
   ```

## Contributing Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style (ESLint configuration)
- Write meaningful commit messages
- Add JSDoc comments for public APIs
- Include tests for new features

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:

```
feat(core): add support for custom DRM providers
fix(adapters): resolve CodeMirror synchronization issue
docs(readme): update installation instructions
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test across different browsers when possible

### Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Update TypeScript definitions
- Include examples for new functionality

## Pull Request Process

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**

   ```bash
   npm test
   npm run lint
   npm run type-check
   npm run build
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a clear, descriptive title
   - Provide detailed description of changes
   - Reference any related issues
   - Include screenshots/demos if applicable

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No breaking changes (or clearly documented)
- [ ] Commit messages follow convention

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Environment**: Browser, OS, Node.js version
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Code samples**: Minimal reproduction case
- **Screenshots**: If applicable

### Feature Requests

For feature requests, please include:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives**: Other solutions considered
- **Examples**: Code examples or mockups

### Security Issues

Please do not report security vulnerabilities in public issues. Instead, email security@cloakscreen.com with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Development Guidelines

### Architecture

Cloakscreen follows a modular architecture:

```
src/
├── core/           # Core library functionality
├── adapters/       # Content type adapters
├── providers/      # DRM provider implementations
├── utils/          # Utility functions
└── types/          # TypeScript definitions
```

### Adding New Content Adapters

1. Extend the `ContentAdapter` base class
2. Implement required abstract methods
3. Add TypeScript definitions
4. Write comprehensive tests
5. Update documentation

### Adding New DRM Providers

1. Extend the `DRMProvider` base class
2. Implement the `DRMImplementation` interface
3. Add configuration types
4. Test with actual DRM service
5. Document integration steps

### Performance Considerations

- Minimize DOM manipulations
- Use efficient event handling
- Optimize for mobile devices
- Consider memory usage
- Profile performance impact

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release PR
4. Tag release after merge
5. Publish to npm
6. Update documentation

## Getting Help

- **Documentation**: Check the docs first
- **Issues**: Search existing issues
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord server
- **Email**: Contact maintainers directly

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation
- Annual contributor highlights

Thank you for contributing to Cloakscreen!

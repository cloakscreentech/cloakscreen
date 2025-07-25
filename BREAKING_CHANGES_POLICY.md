# Breaking Changes Policy

## Overview

This document outlines Cloakscreen's policy for handling breaking changes, API versioning, and backward compatibility to ensure a smooth developer experience while allowing the library to evolve.

## Semantic Versioning

Cloakscreen follows [Semantic Versioning (SemVer)](https://semver.org/) with the format `MAJOR.MINOR.PATCH`:

- **MAJOR**: Breaking changes that require code modifications
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and internal improvements

## API Versioning Strategy

### Version Headers

All API interactions include version information:

- `X-Cloakscreen-Version`: Library version (e.g., "1.2.3")
- `X-Cloakscreen-API-Version`: API version (e.g., "1.0")

### Supported Versions

- **Current API Version**: 1.0
- **Minimum Supported**: 1.0
- **Support Window**: 2 major versions

## Breaking Change Guidelines

### What Constitutes a Breaking Change

**Major Breaking Changes** (require MAJOR version bump):

- Removing public APIs or exports
- Changing function signatures (parameters, return types)
- Changing default behavior that affects existing functionality
- Removing or renaming configuration options
- Changing error types or error handling behavior

**Minor Breaking Changes** (may be included in MINOR with deprecation):

- Adding required parameters with reasonable defaults
- Changing internal implementation that might affect edge cases
- Updating peer dependency requirements

### What is NOT a Breaking Change

- Adding new optional parameters
- Adding new exports or APIs
- Internal refactoring that doesn't affect public APIs
- Bug fixes that restore intended behavior
- Performance improvements
- Documentation updates

## Deprecation Process

### 1. Deprecation Warning Phase

- Feature marked as deprecated with `@deprecated` decorator
- Deprecation warnings logged when feature is used
- Alternative solutions provided in documentation
- Minimum 1 minor version before removal

### 2. Migration Period

- Migration guides published
- Automated migration tools provided when possible
- Community support for migration questions
- Minimum 6 months before removal in major version

### 3. Removal

- Feature removed in next major version
- Clear migration path documented
- Breaking change clearly noted in changelog

## Version Support Policy

### Long-Term Support (LTS)

- Major versions receive LTS designation
- LTS versions supported for 18 months
- Security updates and critical bug fixes only
- No new features added to LTS versions

### Regular Versions

- Supported until next major version
- Bug fixes and security updates
- New features in minor versions

### End of Life (EOL)

- 6-month notice before EOL
- Final security update released
- Migration guide to supported version

## Communication Strategy

### Advance Notice

- **Major versions**: 3 months advance notice
- **Breaking changes**: Announced in previous minor version
- **Deprecations**: Immediate warning, 6-month removal timeline

### Channels

- GitHub releases with detailed changelogs
- Documentation updates
- Migration guides
- Community announcements

### Changelog Format

```markdown
## [2.0.0] - 2024-XX-XX

### BREAKING CHANGES

- **providers**: Removed legacy `Providers.PallyCon()` method
  - **Migration**: Use `createProvider({ name: 'pallycon', ... })` instead
  - **Reason**: Simplified API surface and improved type safety

### Added

- New feature descriptions

### Changed

- Non-breaking changes

### Deprecated

- Features marked for removal

### Removed

- Previously deprecated features

### Fixed

- Bug fixes

### Security

- Security improvements
```

## Migration Support

### Automated Migration

- Codemods provided for common migration patterns
- CLI tools for configuration updates
- TypeScript type checking to catch breaking changes

### Documentation

- Step-by-step migration guides
- Before/after code examples
- Common pitfalls and solutions
- FAQ for migration questions

### Community Support

- GitHub Discussions for migration help
- Example repositories showing migration
- Community-contributed migration tools

## Compatibility Layer

### Backward Compatibility

- Compatibility layer for 1 major version
- Configurable compatibility mode
- Runtime warnings for deprecated usage
- Gradual migration path

### Forward Compatibility

- Feature detection APIs
- Graceful degradation for missing features
- Version-aware configuration

## Exception Handling

### Security Issues

- Security fixes may introduce breaking changes
- Immediate release with clear security advisory
- Migration assistance prioritized

### Critical Bugs

- Critical bug fixes may require breaking changes
- Thorough impact assessment
- Alternative solutions explored first

### Ecosystem Changes

- Breaking changes due to ecosystem updates (Node.js, TypeScript, etc.)
- Advance notice when possible
- Clear upgrade path provided

## Version Planning

### Release Schedule

- **Major versions**: Annually (or as needed for breaking changes)
- **Minor versions**: Monthly (feature releases)
- **Patch versions**: As needed (bug fixes)

### Feature Planning

- Public roadmap for major features
- Community input on breaking changes
- Beta releases for major versions

## Examples

### Good Breaking Change

```typescript
// v1.x - Deprecated
const cloak = new Cloakscreen(element, config); // Deprecated in 1.5.0

// v2.x - New API
const cloak = new Cloakscreen({ element, ...config }); // Required in 2.0.0
```

### Bad Breaking Change

```typescript
// v1.x
cloak.protect(); // Returns Promise<void>

// v2.x - BAD: Silent behavior change
cloak.protect(); // Now returns Promise<ProtectionResult> - breaks existing code
```

## Compliance

This policy is reviewed quarterly and updated as needed. All breaking changes must be approved by the core team and follow this policy.

**Last Updated**: $(date)
**Policy Version**: 1.0
**Next Review**: $(date +3 months)

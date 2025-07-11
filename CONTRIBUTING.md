# Contributing to Hoppity

Thank you for your interest in contributing to Hoppity! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install dependencies**: `pnpm install`
4. **Build the project**: `pnpm build`
5. **Run tests**: `pnpm test`

## Development Workflow

### Making Changes

1. **Create a feature branch** from `main`
2. **Make your changes** following the coding standards
3. **Add tests** for new functionality
4. **Run the test suite**: `pnpm test`
5. **Run linting**: `pnpm lint`
6. **Build the project**: `pnpm build`

### Code Standards

- **TypeScript**: All code should be written in TypeScript
- **Linting**: Code must pass ESLint checks (`pnpm lint`)
- **Testing**: New features should include tests
- **Documentation**: Update documentation as needed
- **Commits**: Use conventional commit messages

### Testing

- Run tests: `pnpm test`
- Run tests in watch mode: `pnpm test:watch`
- Run tests for a specific package: `cd packages/hoppity && pnpm test`

### Building

- Build all packages: `pnpm build`
- Build a specific package: `cd packages/hoppity && pnpm build`

## Submitting Changes

1. **Create a changeset** for your changes:

    ```bash
    pnpm changeset
    ```

2. **Commit your changes** with a descriptive message

3. **Push to your fork** and create a pull request

4. **Wait for review** and address any feedback

## Pull Request Guidelines

- **Title**: Clear, descriptive title
- **Description**: Explain what the PR does and why
- **Tests**: Include tests for new functionality
- **Documentation**: Update docs if needed
- **Breaking Changes**: Clearly mark and explain breaking changes

## Versioning and Publishing

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

- **Creating changesets**: `pnpm changeset`
- **Versioning packages**: `pnpm version-packages`
- **Publishing**: `pnpm release`

## Questions or Issues?

- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Security**: Report security issues privately to the maintainers

## License

By contributing to Hoppity, you agree that your contributions will be licensed under the ISC License.

---

For detailed development setup and workflows, see [DEVELOP.md](./DEVELOP.md).

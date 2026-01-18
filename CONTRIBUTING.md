# Contributing to Apex

Thank you for your interest in contributing to Apex! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Set up environment variables (see [DEVELOPER.md](DEVELOPER.md))

## 📝 Development Workflow

### Code Standards

- **TypeScript**: Use strict typing, avoid `any` types
- **Components**: Functional components with hooks only
- **Styling**: Tailwind CSS classes, no inline styles
- **Animations**: Use shared variants from `src/lib/animations.ts`
- **State**: Zustand for global state, React Query for server state

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with commitlint.

Format: `<type>(<scope>): <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(garage): add bike deletion confirmation
fix(dashboard): resolve maintenance alert calculation
docs(readme): update installation instructions
```

### Pre-commit Hooks

Husky is configured to run:
- ESLint checks
- Commit message validation

Make sure your code passes linting before committing.

## 🎨 UI/UX Guidelines

### Design System
- **Background**: Always use `bg-apex-black` (#0A0A0A)
- **Text**: `text-apex-white` for primary text
- **Accents**: `text-apex-green` (#00FF41) for telemetry and highlights
- **Fonts**: `font-mono` (JetBrains Mono) for numbers/telemetry

### Component Standards
- All cards must use gradient backgrounds and border hover effects
- All buttons must use `{...buttonHoverProps}` from animations library
- All pages must use staggered entry animations
- Toast notifications required for all mutations

### Animation Rules
- **MANDATORY**: Import from `src/lib/animations.ts`
- **MANDATORY**: Use `containerVariants` for page wrappers
- **MANDATORY**: Use `itemVariants` for list items
- **MANDATORY**: Use `{...buttonHoverProps}` for buttons
- **MANDATORY**: Use `{...cardHoverProps}` for cards

See `.cursor/rules/300-ux-polish.mdc` for detailed animation standards.

## 🧪 Testing

Before submitting a PR, ensure:
- [ ] Code passes ESLint (`npm run lint`)
- [ ] No TypeScript errors
- [ ] UI follows design system guidelines
- [ ] Animations use shared library variants
- [ ] Toast notifications are implemented for mutations

## 📦 Pull Request Process

1. Update documentation if needed
2. Ensure all checks pass
3. Write clear PR description
4. Reference any related issues
5. Request review from maintainers

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Tested on both web and mobile (if applicable)

## 🐛 Reporting Bugs

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, device)

## 💡 Feature Requests

For feature requests:
- Check if the feature already exists
- Explain the use case
- Describe the expected behavior
- Consider implementation complexity

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

## 🙏 Thank You

Your contributions help make Apex better for all riders. Thank you for taking the time to contribute!

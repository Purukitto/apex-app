# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.4.2](https://github.com/Purukitto/apex-app/compare/v0.4.1...v0.4.2) (2026-01-10)


### Bug Fixes

* **ci:** improve release workflow with tag fetching and keystore cleanup ([8d29c2e](https://github.com/Purukitto/apex-app/commit/8d29c2e63777667bc1e89d866c6fdc17d70abd22))

### [0.4.1](https://github.com/Purukitto/apex-app/compare/v0.4.0...v0.4.1) (2026-01-10)


### Code Refactoring

* update icons for better visual consistency ([7fab88d](https://github.com/Purukitto/apex-app/commit/7fab88d0efbd736d44bd0fbe933742b754561837))

## [0.4.0](https://github.com/Purukitto/apex-app/compare/v0.3.3...v0.4.0) (2026-01-10)


### Features

* add sensor calibration with localStorage persistence ([34c3983](https://github.com/Purukitto/apex-app/commit/34c3983d5e92ce17bc5ab3eae56e2a72272b8e4f))
* **android:** add fullscreen mode and location permissions ([29cbe3e](https://github.com/Purukitto/apex-app/commit/29cbe3e7a8fc47357e6df58f30c46411698e9d64))
* **android:** add native accelerometer support for lean angle tracking ([019615a](https://github.com/Purukitto/apex-app/commit/019615ae52beddba22d0d4a08b741ecee1392ed8))
* **dashboard:** add recent rides display component ([27390b9](https://github.com/Purukitto/apex-app/commit/27390b99ba7c7b850a396263628a89cc18d544b3))
* **mobile:** configure fullscreen and status bar for native platforms ([93022d4](https://github.com/Purukitto/apex-app/commit/93022d4cd95457948ce7f00b57466ce61753d3b4))
* redesign web fallback page with QR code and copy link ([8496b70](https://github.com/Purukitto/apex-app/commit/8496b703c997471153f76a9d9d7f2136148e1efe))
* **ride:** add ride tracking with GPS and motion sensors ([634f941](https://github.com/Purukitto/apex-app/commit/634f94198827c16e0e2f888dd2b89f8e5ba65e5c))


### Bug Fixes

* resolve linting warnings and add release workflow ([e943689](https://github.com/Purukitto/apex-app/commit/e94368998c1a8c62ce29409eb974ab5cf678d353))
* **ride:** change lean angle to decimal precision and fix sync issues ([33c8c3f](https://github.com/Purukitto/apex-app/commit/33c8c3f3ef66d8b278e27342cec712745726abc9))


### Miscellaneous Chores

* **deps-dev:** bump the development-dependencies group with 6 updates ([0f15e4c](https://github.com/Purukitto/apex-app/commit/0f15e4ca213b5b605ff42eff6275154d6764173c))
* **deps:** bump the production-dependencies group with 3 updates ([4bf9efa](https://github.com/Purukitto/apex-app/commit/4bf9efaedd6a619f86220bc3a68ab502edd35825))


### Styles

* use type-only imports for TypeScript types ([c35108b](https://github.com/Purukitto/apex-app/commit/c35108bb6bd451be5d97d663e1778f8230d809b0))


### Build System

* update capacitor android configuration for sensors plugin ([e9c1090](https://github.com/Purukitto/apex-app/commit/e9c1090395afd5a5029f8367a467a02b6bc036e8))
* update dependencies and capacitor configuration ([5d82ba9](https://github.com/Purukitto/apex-app/commit/5d82ba92feffd579ac71180c4abcbc44e328ccca))


### Documentation

* add Android log viewing guide for debugging ([c60cf08](https://github.com/Purukitto/apex-app/commit/c60cf084836947a0124d47bac16975a851d3acd4))
* **rules:** add mobile-only logic guidelines ([65c886a](https://github.com/Purukitto/apex-app/commit/65c886ae6d2cbe89de480066da896d2680e23254))

### [0.3.3](https://github.com/Purukitto/apex-app/compare/v0.3.2...v0.3.3) (2026-01-08)


### Features

* **auth:** add password strength indicator and validation on signup ([9d3a218](https://github.com/Purukitto/apex-app/commit/9d3a218b017b4b62734c3a448f9bc2ccd22ae3dd))


### Documentation

* add comprehensive README and contributing guidelines ([6dbfbe6](https://github.com/Purukitto/apex-app/commit/6dbfbe67443b3899f4a172327bb6f684afbaa358))


### Continuous Integration

* add GitHub Actions workflows and repository templates ([3c828c0](https://github.com/Purukitto/apex-app/commit/3c828c00e8f51811503040d97cf855a26aee2b55))


### Miscellaneous Chores

* add environment template and update gitignore ([be06f4f](https://github.com/Purukitto/apex-app/commit/be06f4fba49320d2a771f36b6e0dad9346d04d47))

### 0.3.2 (2026-01-08)


### Features

* add versioning and commit message standards ([d7254e5](https://github.com/Purukitto/apex-app/commit/d7254e5320d772774f0cce0f9f9a03262d3e2d3b))
* **notifications:** improve error handling with user-friendly toasts ([1d7f6bd](https://github.com/Purukitto/apex-app/commit/1d7f6bdaef37095cab234c4799260ca35d59be05))
* **ui:** add ConfirmModal component for destructive actions ([abace79](https://github.com/Purukitto/apex-app/commit/abace798bbb540cfff97701894d1efd881b9336f))


### Bug Fixes

* lint fix ([31a2b5a](https://github.com/Purukitto/apex-app/commit/31a2b5a831bf589c4031f824024b5f6ac6d34fdd))


### Code Refactoring

* **components:** replace window.confirm with ConfirmModal ([4d591f9](https://github.com/Purukitto/apex-app/commit/4d591f9d4ba227921a3551f921180e3287bd5f9d))


### Documentation

* **notifications:** update error handling guidelines ([bcd16a3](https://github.com/Purukitto/apex-app/commit/bcd16a360b37cb64a7b4f7419bb56b3884296760))

## [0.3.1] - 2025-01-27

### Features
- Initial versioning setup with automated changelog generation
- Commit message validation with commitlint
- Git hooks for enforcing conventional commits

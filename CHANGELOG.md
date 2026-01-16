# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.15.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.15.0) (2026-01-16)


### Features

* add image URL input to ride edit modal ([67cd105](https://github.com/Purukitto/apex-app/commit/67cd105f1d121f0b801ac5d663a60122df15f70a))
* add image_url field to Ride type ([7b60876](https://github.com/Purukitto/apex-app/commit/7b608765884b5174803ae2f58052c5996f38a67f))
* add multiple share modes to ride image generation ([82e0b39](https://github.com/Purukitto/apex-app/commit/82e0b396c0025cba5e198f1f24fd576d4a46368a))
* create ShareModal component with swipeable options ([3739fb6](https://github.com/Purukitto/apex-app/commit/3739fb6d8750d6e42ff02dd72f25a7138307fb94))
* **DevToolsPanel:** enhance log display and sharing functionality ([797b5c5](https://github.com/Purukitto/apex-app/commit/797b5c507bf339b1c2469229df5754063b70fe3a))
* **gpx:** enhance GPX export functionality for native and web platforms ([fd9aa0a](https://github.com/Purukitto/apex-app/commit/fd9aa0a49af680c6e1af751e95f9ca20774f825d))
* **logger:** enhance logging functionality with dynamic log level checks ([3d5f4b4](https://github.com/Purukitto/apex-app/commit/3d5f4b450c8dec9b6bb2fa7f8ffaaa1fd88a4949))
* **MainLayout, toast:** update background colors and toast duration ([8ab52a3](https://github.com/Purukitto/apex-app/commit/8ab52a33cdaf63afc029fc5c7550695fdb63111f))
* **share:** add map snapshot support and image_url handling for ride sharing ([29dfd70](https://github.com/Purukitto/apex-app/commit/29dfd703a7ab68ec2991b9efc5d9bda1d5ce1c84))
* support image_url updates in useRides hook ([4c5bc52](https://github.com/Purukitto/apex-app/commit/4c5bc52052b69ca5ff48724775bfc6a77d4673a3))
* **ui:** improve keyboard handling and navigation visibility ([0564d69](https://github.com/Purukitto/apex-app/commit/0564d690a89659a8993fdcb1f267a25c45d0d0c1))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **deps-dev:** bump the development-dependencies group with 3 updates ([#44](https://github.com/Purukitto/apex-app/issues/44)) ([75640f6](https://github.com/Purukitto/apex-app/commit/75640f6bb151a7d0522fcd8e1afa37cc9e474ce5))
* **deps:** bump the production-dependencies group with 2 updates ([#43](https://github.com/Purukitto/apex-app/issues/43)) ([9f4ee8d](https://github.com/Purukitto/apex-app/commit/9f4ee8dc9773a144873681c5ffee24d4f9e9ce58))


### Documentation

* add rule for common utility function reuse ([fbe533d](https://github.com/Purukitto/apex-app/commit/fbe533d04cfbe1becc537f0638a018206be7dba4))


### Code Refactoring

* extract date/time formatting utilities to shared module ([11f513c](https://github.com/Purukitto/apex-app/commit/11f513c18855cb7dfd2097d2405b5e4ad3c7ab2e))
* remove unnecessary debug logging from share image generation ([f434b31](https://github.com/Purukitto/apex-app/commit/f434b3165328a78a41e6288b72da44fdf81476f4))
* **ShareModal:** clean up code formatting and improve readability ([011aa85](https://github.com/Purukitto/apex-app/commit/011aa856f3aa5615b1b4b2adee5ea2b9ff691a8e))

### [0.14.6](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.14.6) (2026-01-16)


### Bug Fixes

* **release:** improve changelog extraction for major and minor releases ([038fb43](https://github.com/Purukitto/apex-app/commit/038fb4390be075993c10bcad0de8c29adde29270))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **deps-dev:** bump the development-dependencies group with 3 updates ([#44](https://github.com/Purukitto/apex-app/issues/44)) ([75640f6](https://github.com/Purukitto/apex-app/commit/75640f6bb151a7d0522fcd8e1afa37cc9e474ce5))
* **deps:** bump the production-dependencies group with 2 updates ([#43](https://github.com/Purukitto/apex-app/issues/43)) ([9f4ee8d](https://github.com/Purukitto/apex-app/commit/9f4ee8dc9773a144873681c5ffee24d4f9e9ce58))

### [0.14.5](https://github.com/Purukitto/apex-app/compare/v0.14.4...v0.14.5) (2026-01-15)


### Features

* **Dashboard:** improve pull-to-refresh functionality ([1eb6566](https://github.com/Purukitto/apex-app/commit/1eb6566031efb0a7aa05ad077dd761069878d3a4))

### [0.14.4](https://github.com/Purukitto/apex-app/compare/v0.14.3...v0.14.4) (2026-01-15)


### Features

* **appUpdate:** enhance update checking logic and UI feedback ([e33073b](https://github.com/Purukitto/apex-app/commit/e33073b35b8de73667767a2a73859651fcc2d17c))


### Bug Fixes

* **hooks:** update error handling in various hooks to use underscore for unused parameters ([233ba8a](https://github.com/Purukitto/apex-app/commit/233ba8a9e7ed53cceda6d8de8f5ad5c22e313559))

### [0.14.3](https://github.com/Purukitto/apex-app/compare/v0.14.2...v0.14.3) (2026-01-15)


### Features

* **AddBikeModal, bikeLibrary:** implement global bike search functionality ([9093770](https://github.com/Purukitto/apex-app/commit/90937701cce8f3dcc7b2313a0a11e8439683e6bc))
* **AddBikeModal, bikeLibrary:** implement multi-bike search and reporting functionality ([d818c86](https://github.com/Purukitto/apex-app/commit/d818c86632ebf03eacfe500cec8f930c7b6743ce))
* **AddBikeModal:** add selected bike state management and reporting enhancements ([a1bb38d](https://github.com/Purukitto/apex-app/commit/a1bb38d17143ba64805463ee76c0a0a18dc4db8c))
* **AddBikeModal:** capitalize bike make, model, and category in display ([5460ae1](https://github.com/Purukitto/apex-app/commit/5460ae12038cd3629bbdfe2f8bddbf4913623327))
* **bikeLibrary:** add bike search, report, and addition functionalities ([dd7c198](https://github.com/Purukitto/apex-app/commit/dd7c1988217a8e680187791e0e6bd5cca7676bdd))
* **bikeLibrary:** enhance global bike search functionality ([a9b54ce](https://github.com/Purukitto/apex-app/commit/a9b54ce6120d04fc5b9704a353cc682af5dfa425))
* **bikeLibrary:** improve bike search logic and prioritization ([b2d8c4b](https://github.com/Purukitto/apex-app/commit/b2d8c4bc32188dbe2dfd1ae8b879e7de8a9f8724))


### Code Refactoring

* **AddBikeModal:** streamline bike information display and remove unused icons ([b7e0bbd](https://github.com/Purukitto/apex-app/commit/b7e0bbd996f6788fd9f4de28a4b61c03ad1ccbae))

### [0.14.2](https://github.com/Purukitto/apex-app/compare/v0.14.1...v0.14.2) (2026-01-15)


### Features

* implement optimistic updates for state mutations ([68f8313](https://github.com/Purukitto/apex-app/commit/68f831386f4f8052964887e9496a6f3c820fc6ff))


### Bug Fixes

* **CompleteServiceModal:** clarify odometer reading labels and pre-fill information ([2297ef2](https://github.com/Purukitto/apex-app/commit/2297ef2bc4f152848d3bb39cc374b4b8ed32215c))

### [0.14.1](https://github.com/Purukitto/apex-app/compare/v0.14.0...v0.14.1) (2026-01-15)


### Features

* **AddBikeModal:** enhance keyboard handling and modal layout adjustments ([8a1a142](https://github.com/Purukitto/apex-app/commit/8a1a1425d8bf8bdf4e98c8922d02103b09f09013))
* **AddBikeModal:** improve user experience with keyboard handling and form validation ([a94f36f](https://github.com/Purukitto/apex-app/commit/a94f36f46f3b8c1c8fe10d4f330fe3a43e8458dd))


### Bug Fixes

* improve Add Bike modal keyboard handling and UX ([c1f9d13](https://github.com/Purukitto/apex-app/commit/c1f9d13ac013debbd1f328feba05493c3b7d0d68))


### Code Refactoring

* **AddBikeModal:** enhance keyboard handling and scrolling behavior ([6c1f8b6](https://github.com/Purukitto/apex-app/commit/6c1f8b61e0ea089c247d29209412ee8ba2ab4697))

## [0.14.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.14.0) (2026-01-15)


### Features

* **AddBikeModal:** enhance bike addition with Wikipedia search and additional specs fields ([dd201b7](https://github.com/Purukitto/apex-app/commit/dd201b7774203f44528b9776a90eb422b12d7252))
* **AllRides:** add GPX export functionality for rides ([2085416](https://github.com/Purukitto/apex-app/commit/2085416687b91fa0427e8e8437efa70d75efec16))
* enhance changelog extraction and release notes formatting ([c932f02](https://github.com/Purukitto/apex-app/commit/c932f02acda12b911f47d3e54d2ebd83dfb4a2a6))
* **FuelLogs:** implement fuel log management with add, edit, and delete functionality ([27a1eca](https://github.com/Purukitto/apex-app/commit/27a1eca072870d279eb1bae6277f8dc9a2edc7f4))
* implement comprehensive data deletion strategy ([1e9f464](https://github.com/Purukitto/apex-app/commit/1e9f464c3a30c811fa5317ff34c502a7674442e7))
* **shareRide:** enhance ride sharing functionality with map integration ([05a6ba5](https://github.com/Purukitto/apex-app/commit/05a6ba5c1eebf8209aa78c286bd5021555cf2f2c))
* upgrade to maintenance health monitor with local notifications ([412209f](https://github.com/Purukitto/apex-app/commit/412209f2d6a606795e4be68f60ce15d504aef716))


### Bug Fixes

* hide navigation pill when keyboard is visible ([8ea989b](https://github.com/Purukitto/apex-app/commit/8ea989bd3d9e47b1c8b42fdda3dc44b49ca02462))
* resolve TypeScript build errors ([fedea3a](https://github.com/Purukitto/apex-app/commit/fedea3ad47b44fc669586360ef4a2a52832b670e))


### Code Refactoring

* **useRideTracking:** streamline odometer update logic ([e2be76e](https://github.com/Purukitto/apex-app/commit/e2be76e54c5eeddbcaf9e93f100267ac7a802a91))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **deps-dev:** bump the development-dependencies group with 3 updates ([#44](https://github.com/Purukitto/apex-app/issues/44)) ([75640f6](https://github.com/Purukitto/apex-app/commit/75640f6bb151a7d0522fcd8e1afa37cc9e474ce5))
* **deps:** bump the production-dependencies group with 2 updates ([#43](https://github.com/Purukitto/apex-app/issues/43)) ([9f4ee8d](https://github.com/Purukitto/apex-app/commit/9f4ee8dc9773a144873681c5ffee24d4f9e9ce58))
* rename start:android script to dev:android in package.json for consistency ([3dd77be](https://github.com/Purukitto/apex-app/commit/3dd77bee06e753d283d692920280c7111e6c344d))

### [0.13.4](https://github.com/Purukitto/apex-app/compare/v0.13.3...v0.13.4) (2026-01-15)


### Features

* add copy all logs functionality to DevToolsPanel ([40fb7d9](https://github.com/Purukitto/apex-app/commit/40fb7d99039a5cc5189fb8df22618a066c825924))
* enhance copy logs functionality in DevToolsPanel ([1e55112](https://github.com/Purukitto/apex-app/commit/1e55112e8e39012c4fee2337d033c0b601f44eaf))
* improve toast message handling and error logging ([8a256a0](https://github.com/Purukitto/apex-app/commit/8a256a06ea8968e6e2be06c64f2ed50b87d68288))


### Bug Fixes

* defer setState call in DevToolsPanel to avoid render phase errors ([80601f4](https://github.com/Purukitto/apex-app/commit/80601f4eaa88c28f74d6d022d3df0efa056885cb))
* enhance error handling and state management in ride tracking ([72f31d2](https://github.com/Purukitto/apex-app/commit/72f31d2a3c4b9b216656d55d3a493534a89c0cd1))
* enhance error handling in ride tracking for geolocation and save operations ([19102c9](https://github.com/Purukitto/apex-app/commit/19102c99c87eed4468cafc00f24994d7ff7bfc6b))
* ensure toasts are always visible on top of content ([6bf1820](https://github.com/Purukitto/apex-app/commit/6bf18201f612f0331b2bbda1079021aa9eaeeb1d))
* improve error handling for RPC function issues in ride tracking ([efffc4d](https://github.com/Purukitto/apex-app/commit/efffc4d0dc42f1b71b3fd542235da2cf8647997a))
* improve log level retrieval in ApexLogger ([ea756fc](https://github.com/Purukitto/apex-app/commit/ea756fc1a9ba828a771105555f7d64768d3f90d9))
* increase console log retention in DevToolsPanel ([ce6138f](https://github.com/Purukitto/apex-app/commit/ce6138feb96ae6da9fb01b09cdae86cff4d4e4d6))
* optimize log handling in DevToolsPanel and enhance error logging in ride tracking ([8ee0b6f](https://github.com/Purukitto/apex-app/commit/8ee0b6f1da8d1afb1e328ff58901a74c414cd2a1))
* streamline error handling for RPC function in ride tracking ([5b8e195](https://github.com/Purukitto/apex-app/commit/5b8e195615c388dfe714221ece95798602924915))
* update toast z-index and positioning for improved visibility ([6b2ab9d](https://github.com/Purukitto/apex-app/commit/6b2ab9db264a5323bd818b44356dde7754f32a96))


### Styles

* update safety warning toast appearance for better visibility ([cfde012](https://github.com/Purukitto/apex-app/commit/cfde012c13e56346057dd85f6edf27264cbf091d))

### [0.13.3](https://github.com/Purukitto/apex-app/compare/v0.13.2...v0.13.3) (2026-01-15)


### Bug Fixes

* ensure all devtools are disabled in production builds ([5f20a99](https://github.com/Purukitto/apex-app/commit/5f20a99cb90faf02a6b64ae58de097ddced670e0))

### [0.13.2](https://github.com/Purukitto/apex-app/compare/v0.13.1...v0.13.2) (2026-01-15)


### Features

* **dependencies:** add loglevel package for improved logging capabilities ([ebe189b](https://github.com/Purukitto/apex-app/commit/ebe189b9bcdadafd5ac2b2c62ee6e218cb52d329))
* **logging:** implement centralized logging system with ApexLogger ([fbcb243](https://github.com/Purukitto/apex-app/commit/fbcb2439d6e079578ad887fe69c23f07ef4f095d))
* **rules:** update core instructions to include mandatory logging standards ([828f401](https://github.com/Purukitto/apex-app/commit/828f4015ad327c532ab085bd760affb5d578878d))


### Bug Fixes

* improve log export functionality in DevTools panel ([dfafcbf](https://github.com/Purukitto/apex-app/commit/dfafcbf10d4c163c00166b9796f5820146564f44))


### Code Refactoring

* replace all console.* calls with logger ([ab5d73b](https://github.com/Purukitto/apex-app/commit/ab5d73bec9ca6f78506f7fefffafea6208b4b153))


### Documentation

* update notification rules to use logger instead of console ([20135bc](https://github.com/Purukitto/apex-app/commit/20135bcf70041c2d38f43f5b83f24b197a9fc6c3))

### [0.13.1](https://github.com/Purukitto/apex-app/compare/v0.13.0...v0.13.1) (2026-01-15)


### Features

* **Dashboard:** enhance pull-to-refresh functionality and loading experience ([2a5ddcb](https://github.com/Purukitto/apex-app/commit/2a5ddcbb182bca4669abc2a12801486996661485))
* **Dashboard:** enhance ride card interactivity and layout ([9358bce](https://github.com/Purukitto/apex-app/commit/9358bcece93332b393de58d2701016fee0016ae1))
* **DebugPanel:** introduce DebugPanel component for development tools ([b43afa6](https://github.com/Purukitto/apex-app/commit/b43afa648bc1feba580108dec3e2052b36726703))
* **Map:** improve z-index management and isolation for Leaflet maps ([d2be942](https://github.com/Purukitto/apex-app/commit/d2be9422a0533be488f35cb44e97524f59b36d90))
* **Profile:** add OpenStreetMap attribution and hide Leaflet control ([6dd4720](https://github.com/Purukitto/apex-app/commit/6dd4720a52010d3ebeb72e703e097e68e9576ec7))
* **RideMap:** enhance interactivity and scrolling behavior for maps ([1fb62d4](https://github.com/Purukitto/apex-app/commit/1fb62d42d40aaa4871abfb95f11d0046ff26ed37))


### Code Refactoring

* **MainActivity:** simplify onCreate method and remove fullscreen UI handling ([9a3789c](https://github.com/Purukitto/apex-app/commit/9a3789ce2e3d0f2d63766359b95600d6b91497c4))
* **modals:** enhance padding and layout for better responsiveness ([e172aeb](https://github.com/Purukitto/apex-app/commit/e172aebcaa62db7071f6962155525a9e0fc1fa17))

## [0.13.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.13.0) (2026-01-15)


### Features

* add themed loading components and optimize loading performance ([bbd3093](https://github.com/Purukitto/apex-app/commit/bbd3093a552fc9cc2f3cc48f1fe825d611ffe386))
* integrate RideMap component in AllRides and fix coordinate saving ([3a77f20](https://github.com/Purukitto/apex-app/commit/3a77f207b88e68fabe7ca935a6de996b04a8e0be))
* **RideMap:** add RideMap component for displaying routes on a map ([4b2fb6b](https://github.com/Purukitto/apex-app/commit/4b2fb6b4878a37692b634ea8f4bb4ac204aceac4))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **deps-dev:** bump the development-dependencies group with 3 updates ([#44](https://github.com/Purukitto/apex-app/issues/44)) ([75640f6](https://github.com/Purukitto/apex-app/commit/75640f6bb151a7d0522fcd8e1afa37cc9e474ce5))
* **deps:** bump the production-dependencies group with 2 updates ([#43](https://github.com/Purukitto/apex-app/issues/43)) ([9f4ee8d](https://github.com/Purukitto/apex-app/commit/9f4ee8dc9773a144873681c5ffee24d4f9e9ce58))
* update dependencies in package.json and package-lock.json ([9b8cf38](https://github.com/Purukitto/apex-app/commit/9b8cf38bce7c2c6c96a962d366cc9dd63221c30f))

### [0.12.6](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.12.6) (2026-01-15)


### Features

* add themed loading components and optimize loading performance ([bbd3093](https://github.com/Purukitto/apex-app/commit/bbd3093a552fc9cc2f3cc48f1fe825d611ffe386))
* integrate RideMap component in AllRides and fix coordinate saving ([3a77f20](https://github.com/Purukitto/apex-app/commit/3a77f207b88e68fabe7ca935a6de996b04a8e0be))
* **RideMap:** add RideMap component for displaying routes on a map ([4b2fb6b](https://github.com/Purukitto/apex-app/commit/4b2fb6b4878a37692b634ea8f4bb4ac204aceac4))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **deps-dev:** bump the development-dependencies group with 3 updates ([#44](https://github.com/Purukitto/apex-app/issues/44)) ([75640f6](https://github.com/Purukitto/apex-app/commit/75640f6bb151a7d0522fcd8e1afa37cc9e474ce5))
* **deps:** bump the production-dependencies group with 2 updates ([#43](https://github.com/Purukitto/apex-app/issues/43)) ([9f4ee8d](https://github.com/Purukitto/apex-app/commit/9f4ee8dc9773a144873681c5ffee24d4f9e9ce58))
* update dependencies in package.json and package-lock.json ([9b8cf38](https://github.com/Purukitto/apex-app/commit/9b8cf38bce7c2c6c96a962d366cc9dd63221c30f))

### [0.12.5](https://github.com/Purukitto/apex-app/compare/v0.12.4...v0.12.5) (2026-01-15)


### Features

* **layout:** add safe area insets for better compatibility with notches and punch-holes ([477a1e3](https://github.com/Purukitto/apex-app/commit/477a1e389d6c48019534708a186d0c99941e866c))
* **Ride:** implement startup animation and enhance back button handling ([0b0ea7e](https://github.com/Purukitto/apex-app/commit/0b0ea7e378e29ac4eb8a8b63ce2063500f69f257))


### Bug Fixes

* **usePocketModeDetection:** correct proximity sensor logic for pocket mode detection ([3faa1e7](https://github.com/Purukitto/apex-app/commit/3faa1e7462fdc293e21f1d21b9393e073783bf45))


### Code Refactoring

* **DonationCard:** remove unused App import to clean up code ([18ec85d](https://github.com/Purukitto/apex-app/commit/18ec85db319a97d482a0c9b730a054fa179cf837))

### [0.12.4](https://github.com/Purukitto/apex-app/compare/v0.12.3...v0.12.4) (2026-01-14)


### Features

* **devtools:** add in-app devtools panel with floating button and triple tap gesture ([eee4d05](https://github.com/Purukitto/apex-app/commit/eee4d057afa995c35c3e4a4c46603fe61bfcdeb9))
* **DonationCard:** enhance UPI deep link handling and modal interactions ([7f68417](https://github.com/Purukitto/apex-app/commit/7f68417b53cfe6c3d8b3a48e76c2167db87e5d39))
* **DonationCard:** improve UPI deep link handling and clipboard functionality ([f1f822d](https://github.com/Purukitto/apex-app/commit/f1f822d65123bf4d455524bfd7cf2e2c5c41d6a9))


### Bug Fixes

* **toast:** update border color for success toast and enhance visibility styles ([7febad5](https://github.com/Purukitto/apex-app/commit/7febad580b412d0dffe8c371b1e687eaaca6e6cb))

### [0.12.3](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.12.3) (2026-01-14)


### Features

* enhance app update functionality with modal support ([a4a3df1](https://github.com/Purukitto/apex-app/commit/a4a3df18d621c862b45517755c1afb9ad4cc95a6))


### Bug Fixes

* **useAppUpdate:** update dependencies in useEffect for improved state management ([f7f508c](https://github.com/Purukitto/apex-app/commit/f7f508c8d52a53c4b016d9fd1b18beebc9c2afb6))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **deps-dev:** bump the development-dependencies group with 3 updates ([#44](https://github.com/Purukitto/apex-app/issues/44)) ([75640f6](https://github.com/Purukitto/apex-app/commit/75640f6bb151a7d0522fcd8e1afa37cc9e474ce5))
* **deps:** bump the production-dependencies group with 2 updates ([#43](https://github.com/Purukitto/apex-app/issues/43)) ([9f4ee8d](https://github.com/Purukitto/apex-app/commit/9f4ee8dc9773a144873681c5ffee24d4f9e9ce58))
* **release:** update APK naming convention to include version ([83df481](https://github.com/Purukitto/apex-app/commit/83df4819d30e1c878b92b856b610f29a12f56dd2))

### [0.12.2](https://github.com/Purukitto/apex-app/compare/v0.12.1...v0.12.2) (2026-01-13)


### Features

* add 'All Rides' navigation item to BottomPillNav ([37d9a47](https://github.com/Purukitto/apex-app/commit/37d9a47d3ba045f8b6867e3efa3700d9d461ec1c))
* enhance BackButtonHandler and BottomPillNav for improved navigation ([ccbd549](https://github.com/Purukitto/apex-app/commit/ccbd54901e544522073905cd94089f116a61d7b5))

### [0.12.1](https://github.com/Purukitto/apex-app/compare/v0.12.0...v0.12.1) (2026-01-13)


### Features

* add signal processing and pocket mode detection ([24b5880](https://github.com/Purukitto/apex-app/commit/24b5880d982dd0a3ea8d4d191a0f5f98a6de046e))

## [0.12.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.12.0) (2026-01-13)


### Features

* add Support Development donation module to Profile page ([7d54571](https://github.com/Purukitto/apex-app/commit/7d545711cd1a8a201af8102bb05d0af86ceab29d))
* enhance DonationCard with UPI modal and clipboard functionality ([2db6f20](https://github.com/Purukitto/apex-app/commit/2db6f20aa79df2dfcf981ad523bc99a6227a13f8))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **deps-dev:** bump the development-dependencies group with 3 updates ([#44](https://github.com/Purukitto/apex-app/issues/44)) ([75640f6](https://github.com/Purukitto/apex-app/commit/75640f6bb151a7d0522fcd8e1afa37cc9e474ce5))
* **deps:** bump the production-dependencies group with 2 updates ([#43](https://github.com/Purukitto/apex-app/issues/43)) ([9f4ee8d](https://github.com/Purukitto/apex-app/commit/9f4ee8dc9773a144873681c5ffee24d4f9e9ce58))

### [0.11.3](https://github.com/Purukitto/apex-app/compare/v0.11.2...v0.11.3) (2026-01-12)


### Bug Fixes

* **BackButtonHandler:** ensure proper listener cleanup on component unmount ([0785539](https://github.com/Purukitto/apex-app/commit/0785539c494e4b6869c92dfc07bfd6c8e42db191))
* **BackButtonHandler:** improve back button listener management with proper cleanup ([0e83624](https://github.com/Purukitto/apex-app/commit/0e836242138c4aa79453e3ee52537a15af5f7a3c))


### Code Refactoring

* **UpdateModal:** filter release notes to include only specified sections ([cdc3f63](https://github.com/Purukitto/apex-app/commit/cdc3f639790961636a17ed9f2697e9efc55a2b7a))

### [0.11.2](https://github.com/Purukitto/apex-app/compare/v0.11.1...v0.11.2) (2026-01-12)


### Features

* add BackButtonHandler component to App for improved navigation management ([1fbdd9d](https://github.com/Purukitto/apex-app/commit/1fbdd9dd349dcb289f7e2c9197620c04983f593e))


### Bug Fixes

* remove Miscellaneous Chores section from update modal changelog ([9de4d45](https://github.com/Purukitto/apex-app/commit/9de4d4586b5953a4757ea3ee505e42561ee81608))


### Miscellaneous Chores

* add capacitor-app and update dependencies in Android and iOS projects ([4106a72](https://github.com/Purukitto/apex-app/commit/4106a72713a7f01a40e4d614824822e0ad23a530))
* **dependencies:** add @capacitor/app version 8.0.0 to package.json and package-lock.json ([9d0ae55](https://github.com/Purukitto/apex-app/commit/9d0ae55c29ab9527f46b6bfaea5600a97489ba4c))

### [0.11.1](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.11.1) (2026-01-12)


### Bug Fixes

* update checker auto-run, markdown formatting, and button visibility ([0f3aa17](https://github.com/Purukitto/apex-app/commit/0f3aa176e7857d5ac2271767cafbc8735f9aa263))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))

## [0.11.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.11.0) (2026-01-12)


### Features

* **android:** add capacitor-filesystem and capacitor-share modules to project dependencies ([f76949b](https://github.com/Purukitto/apex-app/commit/f76949ba479edb601e236cdce386a3418977af6d))
* **shareRide:** implement ride image sharing functionality with clipboard and download options ([c0acc75](https://github.com/Purukitto/apex-app/commit/c0acc7591c00a5aba8caa254f96fc5e5e4bfde26))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))
* **dependencies:** update package-lock and package.json to include new dependencies and licenses ([977727f](https://github.com/Purukitto/apex-app/commit/977727f021621580c82002d40e198162fec35b14))

### [0.10.2](https://github.com/Purukitto/apex-app/compare/v0.10.1...v0.10.2) (2026-01-11)


### Features

* **Profile:** add footer displaying app version with a heart icon ([b9ed40f](https://github.com/Purukitto/apex-app/commit/b9ed40fc62d306076dc2df0c3885886bd99fc1e7))
* **Profile:** update footer to include developer attribution and separate version display ([833b793](https://github.com/Purukitto/apex-app/commit/833b793947d1d04420f65b5dc4e839a9e3203ed9))
* **version:** implement version management system and update version display across components ([a6a5870](https://github.com/Purukitto/apex-app/commit/a6a5870e1f1bc02c87efef71a89db82070098c4b))


### Miscellaneous Chores

* **package:** add author, license, homepage, repository, and bugs information to package.json ([76f38b8](https://github.com/Purukitto/apex-app/commit/76f38b8d9c4fa9f56ee5a8c30908ecd09b2d63d4))

### [0.10.1](https://github.com/Purukitto/apex-app/compare/v0.10.0...v0.10.1) (2026-01-11)


### Bug Fixes

* **Dashboard:** reduce ride limit from 10 to 5 for improved performance ([2b5fc37](https://github.com/Purukitto/apex-app/commit/2b5fc370a45671727984d66d355becc178912333))
* **useAppUpdate:** dynamically set current version from package.json for update checks ([c5f3127](https://github.com/Purukitto/apex-app/commit/c5f312713cf457d28f49fc81b7ad0b9b8be933d6))

## [0.10.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.10.0) (2026-01-11)


### Features

* **theme:** add dynamic theming system with background and primary color options ([a5ea282](https://github.com/Purukitto/apex-app/commit/a5ea2826027fd5c5912c593946ed4d7fa64bf4da))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))


### Styles

* **Garage:** update maintenance view styles for improved UI consistency ([7379119](https://github.com/Purukitto/apex-app/commit/7379119897ee0c6de1cfc12e3a3bfccd6f5d0fad))
* **UX:** add guidelines for deprecated colors and usage of apex-themed colors ([71d40a5](https://github.com/Purukitto/apex-app/commit/71d40a5ee9587b7f1126a5663971a270478f3b9e))

## [0.9.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.9.0) (2026-01-11)


### Features

* **android:** add capacitor-preferences module to project dependencies ([dc12e85](https://github.com/Purukitto/apex-app/commit/dc12e8500bebf66059618808f6b753c9b0245c60))
* **Profile:** add app update checker and modal for native platforms ([8480b25](https://github.com/Purukitto/apex-app/commit/8480b251d410d8a9e6841c5d6fb6eb9f493ff960))


### Bug Fixes

* **hooks:** export UpdateInfo interface for app update functionality ([b7919a4](https://github.com/Purukitto/apex-app/commit/b7919a4ba37a0eb2278b97395353dec3d60a1816))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))

## [0.8.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.8.0) (2026-01-11)


### Features

* **android:** add capacitor-browser module to project dependencies ([2807fa4](https://github.com/Purukitto/apex-app/commit/2807fa4837ff796804d1889b6b233afe69b03328))
* **architecture:** expand documentation to include Discord integration details ([6c464b4](https://github.com/Purukitto/apex-app/commit/6c464b4e267e7c449106df601b53d92590a36d10))
* **Discord:** integrate Discord OAuth with connection management and UI updates in Profile ([37fb4f2](https://github.com/Purukitto/apex-app/commit/37fb4f2508f0e43fd56da80eb65e6ec4acaf002f))
* **Profile:** add Discord integration with link/unlink functionality and display options ([2011e6f](https://github.com/Purukitto/apex-app/commit/2011e6f691ad567dd2507b4ce6b7cf1ffbc74af0))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))


### Code Refactoring

* **Ride:** remove console log from component mount for cleaner output ([0d59c50](https://github.com/Purukitto/apex-app/commit/0d59c5058cb53e64e1be4bcfbfa3df0e1f013be0))

### [0.7.1](https://github.com/Purukitto/apex-app/compare/v0.7.0...v0.7.1) (2026-01-11)


### Features

* **MaintenanceLogModal:** add form validation and error handling for maintenance log submission ([f23f17a](https://github.com/Purukitto/apex-app/commit/f23f17a65954acdc865c30bf6d427560b18d7d4b))

## [0.7.0](https://github.com/Purukitto/apex-app/compare/v0.6.0...v0.7.0) (2026-01-11)


### Features

* **AllRides:** implement ride expansion from URL and improve ride navigation ([9548fc0](https://github.com/Purukitto/apex-app/commit/9548fc01ccd5c75a75371d840e596f51de11256e))
* **hooks:** enhance useRides with improved error handling and ride existence verification ([3d77324](https://github.com/Purukitto/apex-app/commit/3d7732446c2e7be8fc2a7c078191aed883704d9a))
* **hooks:** refactor useRideTracking for improved GPS and motion tracking functionality ([d66a1f7](https://github.com/Purukitto/apex-app/commit/d66a1f73ca8acca0655b0a19ae2ad4927ffdfdf3))
* **routing:** add AllRides page and update routing for improved ride management ([533c242](https://github.com/Purukitto/apex-app/commit/533c242960cf3668542b04c72b0e9e863264862a))
* **ui:** enhance NotificationPane with drag-to-close functionality and improved animations ([d73abca](https://github.com/Purukitto/apex-app/commit/d73abca9708a2d0c52a34d1d583cfac82cc41a29))


### Miscellaneous Chores

* changelog ([3ddecd5](https://github.com/Purukitto/apex-app/commit/3ddecd5e4c4be9db35f2160e10a2e2ae8e77206f))


### Styles

* update BottomPillNav background color for improved visibility ([b39855e](https://github.com/Purukitto/apex-app/commit/b39855eb2a765f9c15c6e0fe95ef7534c6ed3a1c))

## [0.6.0](https://github.com/Purukitto/apex-app/compare/v0.5.0...v0.6.0) (2026-01-10)


### Features

* **ui:** update notification pane and layout to match Bento Grid design system ([2eddc18](https://github.com/Purukitto/apex-app/commit/2eddc1887382d57ffd55013c1a9f47f1ae3be4d9))

## [0.5.0](https://github.com/Purukitto/apex-app/compare/v0.4.3...v0.5.0) (2026-01-10)


### Features

* implement ApexTelemetryIcon and improve UI consistency ([ac39061](https://github.com/Purukitto/apex-app/commit/ac390610b8f2b30d5177244a4311d303f17dca96))


### Bug Fixes

* make bike selector modal background opaque ([b61be1b](https://github.com/Purukitto/apex-app/commit/b61be1bd6d5caddfaf4bfc5a8d7ae20128224137))


### Miscellaneous Chores

* add assets directory with logo.svg ([1ed6e25](https://github.com/Purukitto/apex-app/commit/1ed6e2557069a94a32518a6fe340f663f0e70569))
* add build config updates and remove Recorder page ([a636a72](https://github.com/Purukitto/apex-app/commit/a636a72baeb3de90d54e0c014d480d801240dbf2))
* update Android and iOS app icons and splash screens ([6e67888](https://github.com/Purukitto/apex-app/commit/6e67888804750faf9c050aad3e467cf0160c51d9))

### [0.4.3](https://github.com/Purukitto/apex-app/compare/v0.4.2...v0.4.3) (2026-01-10)


### Bug Fixes

* **release:** add error handling and use changelog in release workflow ([536b590](https://github.com/Purukitto/apex-app/commit/536b59036b9821705b6da788a67bff846829e052))

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

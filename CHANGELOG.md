# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [2.0.2](https://github.com/Purukitto/apex-app/compare/v1.1.1...v2.0.2) (2026-03-22)


### ⚠ BREAKING CHANGES

* rewrite app in Flutter (v2.0.0)

### Features

* add Claude AI assistant configuration and development guidance ([aa69908](https://github.com/Purukitto/apex-app/commit/aa69908dbb860224be44a3a0c28e2b6c66b7e9a2))
* remove discord integration ([b2583b4](https://github.com/Purukitto/apex-app/commit/b2583b4fc8a602a87d33686b9373e60cabfa1d4b))
* rewrite app in Flutter (v2.0.0) ([f4795f0](https://github.com/Purukitto/apex-app/commit/f4795f02226dd90d8877797eb7dc2e846aea2946))


### Bug Fixes

* add shebang to husky hooks for Windows compatibility ([99a6d8f](https://github.com/Purukitto/apex-app/commit/99a6d8f15fd554b55218747b3befada2ff6b2417))
* **auth:** remove redundant navigation causing false error toast ([651ff6b](https://github.com/Purukitto/apex-app/commit/651ff6b0483b975a51c06e0fbc167097e372d05e))
* map VITE_FIREBASE secrets for google-services injection ([af88ba8](https://github.com/Purukitto/apex-app/commit/af88ba81b8873c147918c561065fbdd0f5555aec))
* match existing GitHub secret names for Firebase and keystore ([038e0b3](https://github.com/Purukitto/apex-app/commit/038e0b31f3029cca55046cd2caa158fb099f74e6))
* remove duplicate ic_launcher_background resource ([81d4460](https://github.com/Purukitto/apex-app/commit/81d4460a218c9432d1ad27be580892bac463825e))
* resolve analyzer warnings and lint issues ([3d71133](https://github.com/Purukitto/apex-app/commit/3d71133a472c961f1320c50fe35fa045d92343bf))
* resolve loading bugs, fix nav icons, remove serif fonts, add profile improvements ([6798c7c](https://github.com/Purukitto/apex-app/commit/6798c7c3815ceeb056c6394a5f8af33ebedeed10))
* use correct VITE_SUPABASE secret names in CI workflows ([5a20adc](https://github.com/Purukitto/apex-app/commit/5a20adc8a58f2eaaa58f88733c6c26355544f27f))


### Documentation

* add flutter migration plan ([f4f6518](https://github.com/Purukitto/apex-app/commit/f4f65184626e7816472e408ef2167422897f9358))
* **migration:** add build flavours, mapbox maps, drop web target ([007e5e5](https://github.com/Purukitto/apex-app/commit/007e5e515d38e4a378818edbc6746b7099343599))
* **migration:** update map decision to flutter_map + fix bikes RLS ([39466a9](https://github.com/Purukitto/apex-app/commit/39466a9dabadfaf37e6bf6f63436a2c483327702))


### Styles

* format all dart files ([866de5f](https://github.com/Purukitto/apex-app/commit/866de5fa9ce563e8197dd84fbfd23f4fb9e2af0f))


### Chores

* add `.claude/settings.local.json` to define local tool permissions ([dabc040](https://github.com/Purukitto/apex-app/commit/dabc0401e286b6730eb55a71992746b2661b44e2))
* **deps-dev:** bump the development-dependencies group across 1 directory with 4 updates ([#87](https://github.com/Purukitto/apex-app/issues/87)) ([897e7e7](https://github.com/Purukitto/apex-app/commit/897e7e7a2c068d890d41bf9ebe14427a8ec87c22))
* **deps-dev:** bump the development-dependencies group with 6 updates ([#89](https://github.com/Purukitto/apex-app/issues/89)) ([2942c7a](https://github.com/Purukitto/apex-app/commit/2942c7a0af20ec7c5390daa25cc2a0cbf61d24eb))
* **deps:** bump the production-dependencies group across 1 directory with 23 updates ([#101](https://github.com/Purukitto/apex-app/issues/101)) ([a792a9b](https://github.com/Purukitto/apex-app/commit/a792a9b8ce0b98d7276c1c36f02ade25988860bd))
* **deps:** bump the production-dependencies group with 9 updates ([#85](https://github.com/Purukitto/apex-app/issues/85)) ([856dc37](https://github.com/Purukitto/apex-app/commit/856dc3772794a46bba08ab288b74778d2e21af6c))
* **deps:** bump the production-dependencies group with 9 updates ([#88](https://github.com/Purukitto/apex-app/issues/88)) ([3f9351e](https://github.com/Purukitto/apex-app/commit/3f9351e6d86e84451567e3167915ef296ffc5c7d))
* **release:** 2.0.1 ([d3db6aa](https://github.com/Purukitto/apex-app/commit/d3db6aadacb309e01a72b24ba263d5fc9c645a6a))
* remove cursor-specific config files ([53f2b65](https://github.com/Purukitto/apex-app/commit/53f2b6557741f8953e2d77f0b17f657595f0ae03))

## 2.0.1 (2026-03-21)

### Bug Fixes

* **auth:** fix false "invalid password" toast on successful login
* **ci:** use correct Supabase and Firebase secret names in workflows

## 2.0.0 (2026-03-20)

### Features

* **app:** initial Flutter release — ride tracking, garage management, fuel logs, maintenance alerts
* **sync:** offline-first architecture with Supabase sync engine
* **ride:** GPS ride recording with foreground service and pocket detection
* **garage:** bike management with global search and image support
* **fuel:** fuel log tracking with mileage calculation
* **service:** maintenance scheduling with push notification alerts
* **auth:** email-based authentication with Supabase Auth
* **theme:** dark theme with accent color customization and OLED mode

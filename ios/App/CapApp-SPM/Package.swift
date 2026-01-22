// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.0.1"),
        .package(name: "CapacitorApp", path: "..\..\..\node_modules\@capacitor\app"),
        .package(name: "CapacitorBrowser", path: "..\..\..\node_modules\@capacitor\browser"),
        .package(name: "CapacitorFilesystem", path: "..\..\..\node_modules\@capacitor\filesystem"),
        .package(name: "CapacitorGeolocation", path: "..\..\..\node_modules\@capacitor\geolocation"),
        .package(name: "CapacitorHaptics", path: "..\..\..\node_modules\@capacitor\haptics"),
        .package(name: "CapacitorKeyboard", path: "..\..\..\node_modules\@capacitor\keyboard"),
        .package(name: "CapacitorLocalNotifications", path: "..\..\..\node_modules\@capacitor\local-notifications"),
        .package(name: "CapacitorPreferences", path: "..\..\..\node_modules\@capacitor\preferences"),
        .package(name: "CapacitorPushNotifications", path: "..\..\..\node_modules\@capacitor\push-notifications"),
        .package(name: "CapacitorShare", path: "..\..\..\node_modules\@capacitor\share"),
        .package(name: "CapacitorStatusBar", path: "..\..\..\node_modules\@capacitor\status-bar"),
        .package(name: "CapgoInappbrowser", path: "..\..\..\node_modules\@capgo\inappbrowser")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorBrowser", package: "CapacitorBrowser"),
                .product(name: "CapacitorFilesystem", package: "CapacitorFilesystem"),
                .product(name: "CapacitorGeolocation", package: "CapacitorGeolocation"),
                .product(name: "CapacitorHaptics", package: "CapacitorHaptics"),
                .product(name: "CapacitorKeyboard", package: "CapacitorKeyboard"),
                .product(name: "CapacitorLocalNotifications", package: "CapacitorLocalNotifications"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences"),
                .product(name: "CapacitorPushNotifications", package: "CapacitorPushNotifications"),
                .product(name: "CapacitorShare", package: "CapacitorShare"),
                .product(name: "CapacitorStatusBar", package: "CapacitorStatusBar"),
                .product(name: "CapgoInappbrowser", package: "CapgoInappbrowser")
            ]
        )
    ]
)

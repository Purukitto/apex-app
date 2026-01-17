#!/usr/bin/env node
/**
 * Injects Firebase configuration into google-services.json at build time
 * Uses VITE_FIREBASE_* environment variables for Android app
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env file
config({ path: join(rootDir, '.env') });

// Android Firebase config from env vars
// Note: For Android, we need the Android-specific API key and app ID
// These are DIFFERENT from the web app values - get them from Firebase Console > Android app
const androidConfig = {
  projectNumber: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  // Android API key is different from web API key - use Android-specific if provided
  apiKey: process.env.VITE_FIREBASE_ANDROID_API_KEY || '',
  // Android App ID format: 1:PROJECT_NUMBER:android:APP_ID_HASH
  appId: process.env.VITE_FIREBASE_ANDROID_APP_ID || '',
  packageName: 'com.purukitto.apex', // From capacitor.config.ts or android/app/build.gradle
};

const templatePath = join(rootDir, 'android', 'app', 'google-services.json.example');
const servicesPath = join(rootDir, 'android', 'app', 'google-services.json');

// Read from template file (or existing file if template doesn't exist)
let servicesContent;
try {
  servicesContent = readFileSync(templatePath, 'utf-8');
} catch (error) {
  // Fallback to existing file for backwards compatibility
  try {
    servicesContent = readFileSync(servicesPath, 'utf-8');
  } catch (err) {
    console.error('❌ Neither google-services.json.example nor google-services.json found');
    process.exit(1);
  }
}

// Check if any env vars are set
const hasAnyEnvVars = Object.values(androidConfig).some(value => value !== '');

if (hasAnyEnvVars) {
  // Validate required fields
  const requiredFields = ['projectNumber', 'projectId', 'apiKey', 'appId'];
  const missingFields = requiredFields.filter(field => !androidConfig[field]);

  if (missingFields.length > 0) {
    console.warn('⚠️  Some Android Firebase env vars are missing. Using existing google-services.json.');
    console.warn('   Missing:', missingFields.join(', '));
    console.warn('   For Android, set VITE_FIREBASE_ANDROID_API_KEY and VITE_FIREBASE_ANDROID_APP_ID');
    console.warn('   (These are DIFFERENT from the web app values - get from Firebase Console > Android app)');
    console.warn('   If not set, the existing google-services.json file will be used as-is.');
    // Don't write if missing required fields - use existing file
    process.exit(0);
  }

  try {
    // Parse existing JSON to preserve structure
    let servicesJson = JSON.parse(servicesContent);
    
    // Update project info
    servicesJson.project_info = {
      project_number: androidConfig.projectNumber,
      project_id: androidConfig.projectId,
      storage_bucket: androidConfig.storageBucket,
    };

    // Update client info (assuming first client is Android)
    if (servicesJson.client && servicesJson.client.length > 0) {
      servicesJson.client[0].client_info = {
        mobilesdk_app_id: androidConfig.appId,
        android_client_info: {
          package_name: androidConfig.packageName,
        },
      };

      // Update API key
      servicesJson.client[0].api_key = [
        {
          current_key: androidConfig.apiKey,
        },
      ];
    }

    // Write updated JSON
    writeFileSync(servicesPath, JSON.stringify(servicesJson, null, 2), 'utf-8');
    console.log('✓ Firebase config injected into google-services.json');
  } catch (error) {
    console.error('❌ Failed to parse or update google-services.json:', error.message);
    process.exit(1);
  }
} else {
  // No env vars set - keep existing file
  console.log('ℹ️  No Android Firebase env vars set. Using existing google-services.json.');
  console.log('   Set VITE_FIREBASE_* vars in .env (or VITE_FIREBASE_ANDROID_* for Android-specific values)');
}

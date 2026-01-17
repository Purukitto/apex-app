#!/usr/bin/env node
/**
 * Injects Firebase configuration into firebase-messaging-sw.js at build time
 * Uses VITE_FIREBASE_* environment variables (same as app code)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env file (Vite automatically does this for build, but Node scripts need dotenv)
config({ path: join(rootDir, '.env') });

// Use VITE_FIREBASE_* env vars (same as app code)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
};

const templatePath = join(rootDir, 'public', 'firebase-messaging-sw.js.template');
const swPath = join(rootDir, 'public', 'firebase-messaging-sw.js');

// Read from template file (or existing file if template doesn't exist for backwards compatibility)
let swContent;
try {
  swContent = readFileSync(templatePath, 'utf-8');
} catch (error) {
  // Fallback to existing file for backwards compatibility
  try {
    swContent = readFileSync(swPath, 'utf-8');
  } catch (err) {
    console.error('❌ Neither firebase-messaging-sw.js.template nor firebase-messaging-sw.js found');
    process.exit(1);
  }
}

// Check if any env vars are set
const hasAnyEnvVars = Object.values(firebaseConfig).some(value => value !== '');

if (hasAnyEnvVars) {
  // Validate all required fields are set
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

  if (missingFields.length > 0) {
    console.warn('⚠️  Some VITE_FIREBASE_* env vars are set but not all. Using placeholder values.');
    console.warn('   Missing:', missingFields.join(', '));
    console.warn('   Push notifications will not work. Set all VITE_FIREBASE_* vars in .env');
  } else {
    // Replace the firebaseConfig object
    const configRegex = /const firebaseConfig = \{[\s\S]*?\};/;
    const newConfig = `const firebaseConfig = {
  apiKey: '${firebaseConfig.apiKey}',
  authDomain: '${firebaseConfig.authDomain}',
  projectId: '${firebaseConfig.projectId}',
  storageBucket: '${firebaseConfig.storageBucket}',
  messagingSenderId: '${firebaseConfig.messagingSenderId}',
  appId: '${firebaseConfig.appId}',
};`;

    if (configRegex.test(swContent)) {
      swContent = swContent.replace(configRegex, newConfig);
      writeFileSync(swPath, swContent, 'utf-8');
      console.log('✓ Firebase config injected into firebase-messaging-sw.js');
    } else {
      console.error('❌ Could not find firebaseConfig in firebase-messaging-sw.js');
      process.exit(1);
    }
  }
} else {
  // No env vars set - write template with placeholder values
  console.log('ℹ️  No VITE_FIREBASE_* env vars set. Using placeholder values.');
  console.log('   Push notifications will not work. Set VITE_FIREBASE_* vars in .env');
  // Still write the file so it exists for the build (with placeholder values)
  writeFileSync(swPath, swContent, 'utf-8');
}

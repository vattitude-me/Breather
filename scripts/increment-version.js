#!/usr/bin/env node

/**
 * Version increment utility for Breather monorepo
 * Increments patch version in all package.json files
 * Usage: node scripts/increment-version.js
 */

const fs = require('fs');
const path = require('path');

const packagePaths = [
  'packages/pwa/package.json',
  'packages/chrome-ext/package.json',
  'packages/shared/package.json'
];

function incrementVersion(versionString) {
  const parts = versionString.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${versionString}`);
  }
  
  const [major, minor, patch] = parts;
  const newPatch = parseInt(patch) + 1;
  
  return `${major}.${minor}.${newPatch}`;
}

function incrementAllVersions() {
  let updatedVersions = {};
  
  packagePaths.forEach((packagePath) => {
    const fullPath = path.join(__dirname, '..', packagePath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: ${packagePath} not found`);
      return;
    }
    
    const content = fs.readFileSync(fullPath, 'utf-8');
    const packageJson = JSON.parse(content);
    const oldVersion = packageJson.version;
    const newVersion = incrementVersion(oldVersion);
    
    packageJson.version = newVersion;
    updatedVersions[packagePath] = { old: oldVersion, new: newVersion };
    
    fs.writeFileSync(fullPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✓ Updated ${packagePath}: ${oldVersion} → ${newVersion}`);
  });
  
  return updatedVersions;
}

try {
  const updated = incrementAllVersions();
  console.log('\n✓ All versions incremented successfully');
  process.exit(0);
} catch (error) {
  console.error('✗ Error incrementing versions:', error.message);
  process.exit(1);
}

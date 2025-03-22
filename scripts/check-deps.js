#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json to get the list of dependencies
const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
const dependencies = { 
  ...packageJson.dependencies, 
  ...packageJson.devDependencies 
};

console.log('🔍 Checking for missing dependencies...');

// Check if node_modules exists
if (!fs.existsSync(path.resolve(process.cwd(), 'node_modules'))) {
  console.log('❗ No node_modules directory found. Installing all dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  process.exit(0);
}

// Check for each dependency
const missingDeps = [];
for (const dep in dependencies) {
  try {
    // Check if the dependency is installed in node_modules
    fs.accessSync(path.resolve(process.cwd(), 'node_modules', dep));
  } catch (err) {
    missingDeps.push(dep);
  }
}

// Install missing dependencies if any
if (missingDeps.length > 0) {
  console.log(`❗ Found ${missingDeps.length} missing dependencies: ${missingDeps.join(', ')}`);
  console.log('📦 Installing missing dependencies...');
  execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  console.log('✅ All missing dependencies installed!');
} else {
  console.log('✅ All dependencies are properly installed!');
} 
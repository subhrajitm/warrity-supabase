#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output without chalk
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`
};

// Function to get all dependencies from package.json
function getDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'));
    return {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
  } catch (error) {
    console.error(colors.red('Error reading package.json:'), error.message);
    process.exit(1);
  }
}

// Install missing dependency utility
function installMissingDependency(packageName) {
  console.log(colors.yellow(`Installing missing dependency: ${packageName}`));
  try {
    execSync(`npm install ${packageName}`, { stdio: 'inherit' });
    console.log(colors.green(`✅ Successfully installed ${packageName}`));
    return true;
  } catch (error) {
    console.error(colors.red(`Failed to install ${packageName}:`), error.message);
    return false;
  }
}

// Simple file finder without glob
function findFiles(dir, pattern, ignore = []) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip ignored directories
    if (ignore.some(pattern => filePath.includes(pattern))) {
      continue;
    }
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, pattern, ignore));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Function to extract imports from a file
function extractImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Match ES6 imports (import X from 'package')
    const es6ImportRegex = /import\s+(?:.+\s+from\s+)?['"]([@\w\d\/-]+)['"]/g;
    let match;
    while ((match = es6ImportRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
        // Only consider external packages (not relative or alias imports)
        imports.push(getRootPackageName(importPath));
      }
    }
    
    // Match require statements (const X = require('package'))
    const requireRegex = /require\s*\(\s*['"]([@\w\d\/-]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
        imports.push(getRootPackageName(importPath));
      }
    }
    
    return imports;
  } catch (error) {
    console.error(colors.red(`Error processing ${filePath}:`), error.message);
    return [];
  }
}

// Get the root package name from an import path
// e.g., '@material-ui/core/Button' -> '@material-ui/core'
// e.g., 'lodash/get' -> 'lodash'
function getRootPackageName(importPath) {
  // Handle scoped packages
  if (importPath.startsWith('@')) {
    // Return first two parts for scoped packages
    const parts = importPath.split('/');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  }
  
  // Handle regular packages
  return importPath.split('/')[0];
}

// Main function
async function main() {
  console.log(colors.blue('🔍 Validating imports against package.json dependencies...'));
  
  // Get dependencies from package.json
  const dependencies = getDependencies();
  
  // Get all JS/TS files in the project
  const filePattern = /\.(js|jsx|ts|tsx)$/;
  const ignorePatterns = ['node_modules', 'dist', 'build', '.next'];
  const files = findFiles(process.cwd(), filePattern, ignorePatterns);
  
  console.log(colors.blue(`Found ${files.length} files to scan`));
  
  // Track all imports and missing dependencies
  const allImports = new Set();
  const missingDependencies = new Set();
  
  // Scan each file for imports
  files.forEach(filePath => {
    // Get the relative path for cleaner output
    const relativePath = path.relative(process.cwd(), filePath);
    const imports = extractImports(filePath);
    
    imports.forEach(packageName => {
      allImports.add(packageName);
      
      // Check if the import is in package.json
      if (!dependencies[packageName]) {
        missingDependencies.add(packageName);
        console.log(colors.yellow(`⚠️ Missing dependency "${packageName}" found in ${relativePath}`));
      }
    });
  });
  
  console.log(colors.blue(`Total unique external packages imported: ${allImports.size}`));
  
  // Handle missing dependencies
  if (missingDependencies.size > 0) {
    console.log(colors.yellow(`Found ${missingDependencies.size} missing dependencies!`));
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(colors.yellow(`Do you want to install these missing dependencies? (y/n) `), answer => {
      readline.close();
      
      if (answer.toLowerCase() === 'y') {
        let installCount = 0;
        missingDependencies.forEach(dep => {
          if (installMissingDependency(dep)) {
            installCount++;
          }
        });
        
        console.log(colors.green(`✅ Installed ${installCount} out of ${missingDependencies.size} missing dependencies`));
      } else {
        console.log(colors.blue('Skipping installation of missing dependencies'));
        
        // Create a report of missing dependencies
        console.log(colors.yellow('Missing dependencies:'));
        missingDependencies.forEach(dep => {
          console.log(`  - ${dep}`);
        });
      }
    });
  } else {
    console.log(colors.green('✅ All imports have corresponding dependencies in package.json!'));
  }
}

main().catch(error => {
  console.error(colors.red('Error:'), error);
  process.exit(1);
}); 
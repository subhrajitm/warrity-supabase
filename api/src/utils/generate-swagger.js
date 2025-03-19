const fs = require('fs');
const path = require('path');
const { spec } = require('../config/swagger');

// Directory where the file will be saved
const outputDir = path.join(__dirname, '../../public');

// Ensure the directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Path for the output file
const outputPath = path.join(outputDir, 'swagger.json');

// Write the Swagger spec to a file
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`Swagger JSON file generated at: ${outputPath}`);
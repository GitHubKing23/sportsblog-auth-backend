import fs from 'fs';
import path from 'path';

const filesToProcess = [
  path.resolve('C:/Users/User/auth-backend/middleware/auth.js'),
  path.resolve('C:/Users/User/auth-backend/models/User.js'),
  path.resolve('C:/Users/User/auth-backend/routes/auth.js'),
  path.resolve('C:/Users/User/auth-backend/src/controllers/auth/ethereumAuthController.js'),
  path.resolve('C:/Users/User/auth-backend/src/models/User.js'),
  path.resolve('C:/Users/User/auth-backend/src/routes/ethereumAuthRoutes.js'),
  path.resolve('C:/Users/User/auth-backend/src/server.js'),
  path.resolve('C:/Users/User/auth-backend/.env'),
  path.resolve('C:/Users/User/auth-backend/package.json')
];

const outputFile = 'extractedAuthBackendFiles.txt';
let output = '';

filesToProcess.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Redact MONGO_URI in .env
    if (filePath.endsWith('.env')) {
      content = content
        .split('\n')
        .map(line => line.startsWith('MONGO_URI=') ? 'MONGO_URI=***REDACTED***' : line)
        .join('\n');
    }

    output += `=== FILE: ${filePath} ===\n\n${content}\n\n`;
  } else {
    output += `=== FILE: ${filePath} NOT FOUND ===\n\n`;
  }
});

fs.writeFileSync(outputFile, output, 'utf-8');
console.log(`✅ Done. Output written to ${outputFile}`);

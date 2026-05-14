'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function deps(pkgPath) {
  const p = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return Object.keys({ ...p.dependencies, ...p.devDependencies });
}

const errors = [];

const sharedDeps = deps(path.join(root, 'packages/shared/package.json'));
for (const banned of ['react', 'next', 'expo', 'drizzle-orm']) {
  if (sharedDeps.includes(banned))
    errors.push(`packages/shared must not depend on "${banned}"`);
}

const dbDeps = deps(path.join(root, 'packages/db/package.json'));
for (const banned of ['@compliance/admin', '@compliance/field']) {
  if (dbDeps.includes(banned))
    errors.push(`packages/db must not depend on "${banned}"`);
}

const fieldDeps = deps(path.join(root, 'apps/field/package.json'));
if (fieldDeps.includes('@compliance/db'))
  errors.push('apps/field must not depend on "@compliance/db"');

if (errors.length) {
  errors.forEach(e => console.error('BOUNDARY VIOLATION:', e));
  process.exit(1);
}
console.log('Boundary check passed.');

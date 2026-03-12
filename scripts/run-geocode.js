// scripts/run-geocode.js — load .env.local properly and run geocode-businesses.ts
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env.local');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 0) continue;
  const key = trimmed.slice(0, eq);
  let val = trimmed.slice(eq + 1);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

console.log('Env loaded, running geocode script...');
execSync('npx tsx scripts/geocode-businesses.ts', { stdio: 'inherit', env: process.env, cwd: path.resolve(__dirname, '..') });

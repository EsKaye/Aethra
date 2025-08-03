#!/usr/bin/env node
/**
 * GitHub Commit Annotator
 * Injects whimsical lore into commit messages for archival glory.
 */

const fs = require('fs');

const annotations = [
  '🪄 Annotation: Bound by the Solar-Lunar pact, this commit strides through ether.',
  '🔮 From twilight code, new constellations rise.',
  '⚔️ Forged in starfire, blessed by moonlight.'
];

function enchantCommit(filePath) {
  const msg = fs.readFileSync(filePath, 'utf8');
  const charm = annotations[Math.floor(Math.random() * annotations.length)];
  fs.writeFileSync(filePath, `${msg.trim()}\n${charm}\n`);
}

if (require.main === module) {
  const [,, filePath] = process.argv;
  if (!filePath) {
    console.error('No commit message file path provided.');
    process.exit(1);
  }
  enchantCommit(filePath);
}

module.exports = { enchantCommit };

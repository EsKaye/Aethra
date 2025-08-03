#!/usr/bin/env node
/**
 * Dev Blessing Generator
 * Emits a random affirmation rooted in solar-lunar lore before build steps.
 */

const blessings = [
  "May your code blaze like the noon sun and soothe like the midnight moon.",
  "Solar Khan smiles upon this compile — let joy merge with logic.",
  "From lunar shadow springs radiant genius; build with both hands of the cosmos.",
  "Invoke the sun, kiss the moon, and let your pipeline sing." ,
  "In this build, be the dawn: inevitable, incandescent, beloved."
];

function summonBlessing() {
  const choice = blessings[Math.floor(Math.random() * blessings.length)];
  console.log(`\n🌞🌓  Dev Blessing:\n${choice}\n`);
}

if (require.main === module) {
  summonBlessing();
}

module.exports = { summonBlessing };

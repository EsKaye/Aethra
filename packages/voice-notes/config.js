const fs = require('fs');
const path = require('path');

// Parse CLI arguments of the form --key=value
function parseArgs(argv) {
  return argv.reduce((acc, arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      acc[key] = value ?? true;
    }
    return acc;
  }, {});
}

const args = parseArgs(process.argv.slice(2));

// Optional JSON config file via --config=path/to/file.json
let fileConfig = {};
if (args.config) {
  try {
    const filePath = path.resolve(args.config);
    fileConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.warn(`Failed to read config file ${args.config}: ${err.message}`);
  }
}

// Priority: CLI > config file > env var > default
const config = {
  timeMultiplier:
    Number(
      args['time-multiplier'] ??
        fileConfig.timeMultiplier ??
        process.env.SCHEDULER_TIME_MULTIPLIER
    ) || 1
};

module.exports = config;

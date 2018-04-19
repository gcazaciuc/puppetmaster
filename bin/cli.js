
// #!/usr/bin / env node
const argv = require('minimist')(process.argv.slice(2));
const argDefaults = {
    config: './puppet.config.js',
    output: 'test-project',
}
const Runner = require('../src/runner');
const runner = new Runner();
const cliOptions = Object.assign({}, argDefaults, argv);
console.log(cliOptions);
runner.run(cliOptions);

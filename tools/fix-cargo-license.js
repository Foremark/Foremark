// Makes some modifications to `cargo-license`'s output.
const getStdin = require('get-stdin');

const exclude = [
    // Very small shim that I wrote for Foremark, no license notice is required
    'diagram',
    // `cargo-license` doesn't output license info for crates in the
    // current workspace
    'svgbob',
];

getStdin().then(text => {
    for (let line of text.split('\n')) {
        if (line.trim() === '') {
            continue;
        }

        // Remove ANSI colors
        line = line.replace(/\u001b\[.*?m/g, '');

        const match = line.match(/^(.+?): (.+?), "(.+?)", (.*?), (.*?)$/);
        if (!match) {
            console.warn(`Fatal: Unrecognized input: ${line}`);
            process.exit(1);
        }

        const [_, name, version, license, source, authors] = match;

        if (exclude.indexOf(name) >= 0) {
            continue;
        }

        console.log(`${name} ${version} (${source})`);
        console.log(`${license}`);
        console.log(`${authors}`);
        console.log('')
    }
});

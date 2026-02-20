const fs = require('fs');

function parseMarkdown(filename) {
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n');
    const regions = [];
    let currentRegion = null;

    for (const line of lines) {
        if (line.startsWith('## ')) {
            if (currentRegion) {
                regions.push(currentRegion);
            }
            currentRegion = {
                title: line.replace('## ', '').trim(),
                tasks: []
            };
        } else if (line.startsWith('- [ ] ')) {
            if (currentRegion) {
                currentRegion.tasks.push(line.replace('- [ ] ', '').trim());
            }
        }
    }
    if (currentRegion) {
        regions.push(currentRegion);
    }
    return regions;
}

const mainGame = parseMarkdown('quest-guide-main.md');
const dlc = parseMarkdown('quest-guide-dlc.md');

const data = {
    main: mainGame,
    dlc: dlc
};

fs.writeFileSync('data.js', `const questData = ${JSON.stringify(data, null, 2)};`);
console.log('Successfully generated data.js');

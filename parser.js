const fs = require('fs');

function parseOriginalFile(filename, startLineString) {
    const content = fs.readFileSync(filename, 'utf-8');
    const lines = content.split('\n');
    const regions = [];
    let currentRegion = null;
    let started = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;

        // Check where the actual guide starts
        if (!started) {
            if (line.includes(startLineString) || line === startLineString) {
                started = true;
                currentRegion = { title: line.replace(':', ''), tasks: [] };
            }
            continue;
        }

        // Identify headers (Short length is a key indicator)
        // If it ends with a colon but is very long, it's a descriptive sentence, not a header.
        const isHeader = (line.endsWith(':') && line.length < 50) || 
                         (line.length < 40 && !line.includes('.') && !line.startsWith('Talk') && !line.startsWith('Speak') && !line.startsWith('Meet') && !line.startsWith('Find') && !line.startsWith('Summon') && !line.startsWith('Defeat') && !line.startsWith('Return') && !line.startsWith('Choose'));

        if (isHeader) {
            if (currentRegion && currentRegion.tasks.length > 0) {
                regions.push(currentRegion);
            }
            currentRegion = {
                title: line.replace(':', '').trim(),
                tasks: []
            };
        } else {
            if (currentRegion) {
                // Clean up some markdown-like asterisks if present
                let cleanTask = line.replace(/^\*{2,5}\s*/, '').trim();
                // Also remove leading dashes if any
                cleanTask = cleanTask.replace(/^- /, '').trim();
                currentRegion.tasks.push(cleanTask);
            }
        }
    }
    
    if (currentRegion && currentRegion.tasks.length > 0) {
        regions.push(currentRegion);
    }
    
    return regions;
}

const mainGame = parseOriginalFile('guide.txt', 'Limgrave:');
const dlc = parseOriginalFile('guide-dlc.txt', 'Graveside Plain/Cerulean Coast');

const data = {
    main: mainGame,
    dlc: dlc
};

fs.writeFileSync('data.js', `const questData = ${JSON.stringify(data, null, 2)};`);
console.log('Successfully regenerated data.js with fixed headers!');

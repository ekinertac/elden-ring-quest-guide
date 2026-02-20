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

        // Identify headers
        const actionVerbs = ['Talk', 'Speak', 'Meet', 'Find', 'Summon', 'Defeat', 'Return', 'Choose', 'Go', 'To', 'After', 'Grab', 'Search', 'Travel', 'Take', 'Use', 'Kill', 'Pick', 'Interact', 'Give', 'Cross', 'Head', 'Once', 'Continue', 'Buy', 'Get', 'Complete', 'Rest', 'Do not'];
        const cleanLineForCheck = line.replace(/^\*{2,5}\s*/, '').replace(/^- /, '').trim();
        const startsWithAction = actionVerbs.some(verb => cleanLineForCheck.startsWith(verb + ' ') || cleanLineForCheck.startsWith(verb + ','));

        const isLongOrSentence = line.length >= 50 || line.includes('?');
        
        // Exceptions for known long headers
        const isKnownLongHeader = line.startsWith('Nokron/Nokstella') || 
                                  line.startsWith('Deeproot Depths:') ||
                                  line.startsWith('Consecrated Snowfield/') ||
                                  line.startsWith('Mt Gelmir') ||
                                  line.startsWith('Jagged Peak -') ||
                                  line.startsWith('Shadow Keep/') ||
                                  line.startsWith('***** Frenzied Flame Ending');

        let isHeader = false;
        if (isKnownLongHeader) {
            isHeader = true;
        } else if (!startsWithAction) {
            if (line.endsWith(':') && line.length < 50) {
                isHeader = true;
            } else if (!line.endsWith(':') && !isLongOrSentence && !line.includes('.')) {
                isHeader = true;
            }
        }

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

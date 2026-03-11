const fs = require('fs');

let text = fs.readFileSync('data.js', 'utf8');
let jsonStr = text.replace('const questData = ', '').replace(/;$/, '');
let data = JSON.parse(jsonStr);

function rewriteTask(task) {
    let t = task;

    // Remove conversational fluff
    t = t.replace(/at the very start of the game, /gi, '');
    t = t.replace(/It's generally a good idea to /gi, '');
    t = t.replace(/After getting access to /gi, 'Upon reaching ');
    t = t.replace(/Make sure to /gi, '');
    t = t.replace(/If you are not completing the manor's requests, you can continue on and /gi, 'If ignoring assassination requests, ');
    t = t.replace(/There is a man unable to speak\. Give /gi, 'Give ');
    t = t.replace(/If at any point an NPC is angry at you, you can use /gi, 'Use ');
    t = t.replace(/To get here: /gi, '');

    // Standardize verbs at the beginning
    t = t.replace(/^(Talk to|Speak to)/i, 'Speak with');
    t = t.replace(/^Meet /i, 'Find and speak with ');
    t = t.replace(/^Kill /i, 'Defeat ');
    t = t.replace(/^Grab /i, 'Collect ');
    t = t.replace(/^Pick up /i, 'Collect ');
    t = t.replace(/^Head /i, 'Travel ');
    t = t.replace(/^Go to /i, 'Travel to ');
    t = t.replace(/^Go /i, 'Travel ');
    t = t.replace(/^Take the /i, 'Use the ');
    t = t.replace(/^Cross the /i, 'Cross the ');
    t = t.replace(/^In the Northern section /i, 'Travel to the Northern section ');
    
    // Middle of sentence cleanups
    t = t.replace(/Then talk to /gi, 'Then speak with ');
    t = t.replace(/Then, talk to /gi, 'Then speak with ');
    t = t.replace(/Then speak to /gi, 'Then speak with ');
    t = t.replace(/Then, speak to /gi, 'Then speak with ');
    t = t.replace(/Then, go back to /gi, 'Return to ');
    t = t.replace(/Then go back to /gi, 'Return to ');
    t = t.replace(/Then, return to /gi, 'Return to ');
    t = t.replace(/Then return to /gi, 'Return to ');
    t = t.replace(/Then, go speak to /gi, 'Speak with ');

    // Standardize optional
    t = t.replace(/\(Optional\) /g, 'Optional: ');

    // Formatting capitalization and ending punctuation
    t = t.charAt(0).toUpperCase() + t.slice(1);
    
    // Add period if it doesn't end with one (and skip if it has HTML tags at the end)
    if (!t.endsWith('.') && !t.endsWith('!') && !t.includes('</span>')) {
        t += '.';
    }
    
    // Clean up double periods or trailing spaces
    t = t.replace(/\.\./g, '.').trim();

    return t;
}

data.main.forEach(region => {
    region.tasks = region.tasks.map(rewriteTask);
});
data.dlc.forEach(region => {
    region.tasks = region.tasks.map(rewriteTask);
});

fs.writeFileSync('data.js', 'const questData = ' + JSON.stringify(data, null, 4) + ';\n');
console.log('Directives rewritten successfully!');
# AGENTS.md - Agent Coding Guidelines for Elden Ring Quest Guide

## Project Overview

This is a vanilla JavaScript web application - a quest tracker for Elden Ring and the Shadow of the Erdtree DLC. The project consists of:
- `index.html` - Main HTML file
- `script.js` - Application logic (DOM manipulation, state management, localStorage)
- `data.js` - Quest data in JSON format
- `style.css` - CSS styles

## Build / Development Commands

### Running Locally
```bash
# Start a local HTTP server (Python)
python3 -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

Open `http://localhost:8000` in your browser.

### No Build System
This is a static site with no build process. There is no:
- No npm/yarn/pnpm
- No webpack/vite/rollup
- No test framework
- No linter configured

## Code Style Guidelines

### General Principles
- This is a vanilla JavaScript project - avoid adding frameworks unless explicitly requested
- Keep code simple and readable
- No TypeScript - plain JavaScript only

### JavaScript Conventions (from existing code)

#### Naming Conventions
- Variables and functions: `camelCase`
  ```javascript
  let currentTab = 'main';
  function utf8_to_b64(str) { }
  ```
- Constants: Use descriptive names, no specific case required
  ```javascript
  let saveKey = 'er-quest-tracker-state';
  ```
- DOM elements: Descriptive names with clear purpose
  ```javascript
  const contentArea = document.getElementById('content-area');
  const progressText = document.getElementById('progress-text');
  ```

#### Code Structure
- Use `const` by default, `let` when mutation is needed
- Avoid `var` - use `const`/`let` only
- Prefer arrow functions for callbacks
  ```javascript
  btn.addEventListener('click', (e) => { });
  ```
- Use template literals for string interpolation
  ```javascript
  const regionId = `region-${currentTab}-${rIndex}`;
  ```

#### Functions
- Keep functions focused and single-purpose
- Use meaningful function names that describe their action
- Avoid functions longer than ~50 lines when possible

#### Error Handling
- Wrap potentially failing operations in try-catch
  ```javascript
  try {
      const minified = JSON.parse(b64_to_utf8(encoded));
      // ...
  } catch (e) {
      console.error('Error decoding save', e);
      return null;
  }
  ```
- Use `console.error` for logging errors, not `console.log`

#### DOM Manipulation
- Cache DOM elements at the top of the module/script
- Use event delegation where appropriate
- Use template literals for HTML generation
  ```javascript
  header.innerHTML = `
      <div class="region-title">${highlightText(region.title, searchTerm)}</div>
      <div class="region-progress">${completedTasks}/${totalTasks}</div>
  `;
  ```

### CSS Conventions

#### Structure
- Use CSS custom properties (variables) for theming
  ```css
  :root {
      --bg-dark: #121212;
      --accent-gold: #c3a152;
  }
  ```
- Use consistent spacing (tabs or spaces - match existing)
- Group related styles together
- Use meaningful class names

#### Selectors
- Prefer class selectors over element selectors
- Use BEM-like naming for complex components
  ```css
  .region-header { }
  .region-title { }
  .task-item.completed { }
  ```

### Data Structure (data.js)

#### Quest Data Format
- Use the existing structure for quest regions
- Each region has: `title` (string) and `tasks` (array of strings)
- Main game quests go in `questData.main` array
- DLC quests go in `questData.dlc` array
- Use HTML spans for warnings: `<span class="blocker-warning">`

### Best Practices

1. **State Management**: State is stored in localStorage under key `'er-quest-tracker-state'`
2. **URL Sharing**: Progress can be shared via URL hash encoding
3. **Profile Support**: Multiple profiles can be managed for different playthroughs
4. **Accessibility**: Use semantic HTML, proper labels for form elements

### Common Patterns

#### Event Listeners
```javascript
tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Handle click
    });
});
```

#### Conditional Rendering
```javascript
if (searchTerm && !regionMatches && matchingTasks.length === 0) {
    return; // Skip rendering
}
```

#### LocalStorage Operations
```javascript
// Save
localStorage.setItem(saveKey, JSON.stringify(appData));

// Load
let rawState = localStorage.getItem(saveKey);
let appData = rawState ? JSON.parse(rawState) : null;
```

## Testing

There are currently no automated tests for this project. If tests are added:
- Use a simple test runner compatible with vanilla JS
- Test critical functions: encoding/decoding, state management, progress calculation
- Run individual tests with: `npx jest --testNamePattern="test name"` or equivalent

## Adding New Features

1. **Quest Data**: Edit `data.js` - follow the existing JSON structure
2. **UI Changes**: Edit `style.css` for styling, `script.js` for behavior
3. **New Functionality**: Add to `script.js` - follow existing code patterns and naming conventions

## Important Notes

- This is a client-side only application (no backend)
- All data persists in browser localStorage
- No authentication or user accounts
- URL-based sharing encodes state in the hash fragment

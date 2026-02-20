document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const contentArea = document.getElementById('content-area');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const progressFill = document.getElementById('progress-fill');
    const resetBtn = document.getElementById('reset-btn');
    const searchInput = document.getElementById('search-input');
    const profileSelect = document.getElementById('profile-select');
    const newProfileBtn = document.getElementById('new-profile-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    // State
    let currentTab = 'main';
    let saveKey = 'er-quest-tracker-state';
    let searchTerm = '';
    
    // Load state from local storage and migrate if necessary
    let rawState = localStorage.getItem(saveKey);
    let appData = rawState ? JSON.parse(rawState) : null;
    
    // Migration: If data exists but has no profiles, wrap it
    if (!appData || !appData.profiles) {
        let oldState = appData || { main: {}, dlc: {} };
        appData = {
            currentProfile: 'Default',
            profiles: {
                'Default': oldState
            }
        };
    }
    // Clean up
    if (!appData.profiles['Default'].main) {
        appData.profiles['Default'] = { main: {}, dlc: {} };
    }

    let currentProfile = appData.currentProfile;
    let appState = appData.profiles[currentProfile];

    // Initialize App
    function init() {
        populateProfiles();
        renderContent();
        updateProgress();
        setupEventListeners();
    }
    
    function populateProfiles() {
        profileSelect.innerHTML = '';
        for (let p in appData.profiles) {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            if (p === currentProfile) opt.selected = true;
            profileSelect.appendChild(opt);
        }
    }

    // Highlight helper
    function highlightText(text, term) {
        if (!term) return text;
        const regex = new RegExp(`(${term})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Render Content based on current tab
    function renderContent() {
        const data = currentTab === 'main' ? questData.main : questData.dlc;
        contentArea.innerHTML = '';
        
        data.forEach((region, rIndex) => {
            const regionId = `region-${currentTab}-${rIndex}`;
            
            // Search Filtering
            const regionMatches = searchTerm && region.title.toLowerCase().includes(searchTerm);
            const matchingTasks = region.tasks.filter(t => t.toLowerCase().includes(searchTerm));
            
            if (searchTerm && !regionMatches && matchingTasks.length === 0) {
                return; // Hide this region if no match
            }
            
            // Create Section Wrapper
            const section = document.createElement('div');
            section.className = 'region-section fade-in';
            section.style.animationDelay = `${rIndex * 0.05}s`;

            // Calculate Region Progress
            const totalTasks = region.tasks.length;
            let completedTasks = 0;
            region.tasks.forEach((_, tIndex) => {
                const taskId = `${regionId}-task-${tIndex}`;
                if (appState[currentTab][taskId]) completedTasks++;
            });

            // Create Header
            const header = document.createElement('div');
            header.className = 'region-header';
            header.innerHTML = `
                <div class="region-title">${highlightText(region.title, searchTerm)}</div>
                <div class="region-progress" id="prog-${regionId}">${completedTasks}/${totalTasks}</div>
            `;
            
            // Create Content Area
            const content = document.createElement('div');
            content.className = 'region-content';
            if (searchTerm) {
                content.classList.add('open');
                content.style.maxHeight = 'none';
            }
            content.id = `content-${regionId}`;

            // Create Task List
            const taskList = document.createElement('ul');
            taskList.className = 'task-list';

            region.tasks.forEach((taskText, tIndex) => {
                // If searching, only show matching tasks (unless region matches)
                if (searchTerm && !regionMatches && !taskText.toLowerCase().includes(searchTerm)) {
                    return;
                }

                const taskId = `${regionId}-task-${tIndex}`;
                const isCompleted = appState[currentTab][taskId] || false;

                const listItem = document.createElement('li');
                listItem.className = `task-item ${isCompleted ? 'completed' : ''}`;
                
                listItem.innerHTML = `
                    <input type="checkbox" id="${taskId}" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
                    <label for="${taskId}" class="task-label">${highlightText(taskText, searchTerm)}</label>
                `;

                // Checkbox Event
                const checkbox = listItem.querySelector('.task-checkbox');
                checkbox.addEventListener('change', (e) => {
                    appState[currentTab][taskId] = e.target.checked;
                    saveState();
                    
                    if (e.target.checked) {
                        listItem.classList.add('completed');
                    } else {
                        listItem.classList.remove('completed');
                    }
                    
                    updateRegionProgress(regionId, region.tasks.length);
                    updateProgress();
                });

                taskList.appendChild(listItem);
            });

            content.appendChild(taskList);

            // Accordion Toggle Event
            header.addEventListener('click', () => {
                const isOpen = content.classList.contains('open');
                
                if (isOpen) {
                    content.style.maxHeight = '0';
                    content.classList.remove('open');
                } else {
                    content.classList.add('open');
                    content.style.maxHeight = 'none';
                }
            });

            section.appendChild(header);
            section.appendChild(content);
            contentArea.appendChild(section);
        });
    }

    function updateRegionProgress(regionId, total) {
        let completed = 0;
        for (let key in appState[currentTab]) {
            if (key.startsWith(regionId) && appState[currentTab][key]) {
                completed++;
            }
        }
        const progSpan = document.getElementById(`prog-${regionId}`);
        if (progSpan) {
            progSpan.textContent = `${completed}/${total}`;
        }
    }

    // Update Global Progress Bar
    function updateProgress() {
        const data = currentTab === 'main' ? questData.main : questData.dlc;
        let total = 0;
        let completed = 0;

        // Calculate total possible tasks
        data.forEach((region, rIndex) => {
            const regionId = `region-${currentTab}-${rIndex}`;
            total += region.tasks.length;
            
            // Calculate completed
            region.tasks.forEach((_, tIndex) => {
                const taskId = `${regionId}-task-${tIndex}`;
                if (appState[currentTab][taskId]) completed++;
            });
        });

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        progressText.textContent = `${completed} / ${total} Completed`;
        progressPercent.textContent = `${percent}%`;
        progressFill.style.width = `${percent}%`;
    }

    // Save to LocalStorage
    function saveState() {
        appData.currentProfile = currentProfile;
        appData.profiles[currentProfile] = appState;
        localStorage.setItem(saveKey, JSON.stringify(appData));
    }

    // Event Listeners
    function setupEventListeners() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentTab = e.target.getAttribute('data-target');
                renderContent();
                updateProgress();
            });
        });

        resetBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to reset all progress for ${currentTab === 'main' ? 'the Main Game' : 'the DLC'} in profile "${currentProfile}"?`)) {
                appState[currentTab] = {};
                saveState();
                renderContent();
                updateProgress();
            }
        });

        // Search
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase().trim();
            renderContent();
        });

        // Profiles
        profileSelect.addEventListener('change', (e) => {
            currentProfile = e.target.value;
            appState = appData.profiles[currentProfile];
            appData.currentProfile = currentProfile;
            saveState();
            renderContent();
            updateProgress();
        });

        newProfileBtn.addEventListener('click', () => {
            let name = prompt("Enter new profile name:");
            if (name && name.trim()) {
                name = name.trim();
                if (!appData.profiles[name]) {
                    appData.profiles[name] = { main: {}, dlc: {} };
                    appData.currentProfile = name;
                    saveState();
                    populateProfiles();
                    profileSelect.value = name;
                    profileSelect.dispatchEvent(new Event('change'));
                } else {
                    alert("Profile already exists!");
                }
            }
        });

        // Import / Export
        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(appData, null, 2);
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `elden-ring-tracker-save.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        importBtn.addEventListener('click', () => {
            importFile.click();
        });

        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const parsed = JSON.parse(evt.target.result);
                    if (parsed && parsed.profiles && parsed.currentProfile) {
                        appData = parsed;
                        currentProfile = appData.currentProfile;
                        appState = appData.profiles[currentProfile];
                        saveState();
                        populateProfiles();
                        renderContent();
                        updateProgress();
                        alert("Save imported successfully!");
                    } else {
                        alert("Invalid save file format.");
                    }
                } catch (err) {
                    alert("Error parsing save file.");
                }
            };
            reader.readAsText(file);
            // Reset input so same file can be selected again if needed
            e.target.value = '';
        });
    }

    // Run
    init();
});

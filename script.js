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
    const shareUrlBtn = document.getElementById('share-url-btn');

    // State
    let currentTab = 'main';
    let saveKey = 'er-quest-tracker-state';
    let searchTerm = '';
    
    // Base64 encode/decode with unicode support
    function utf8_to_b64(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode('0x' + p1);
        }));
    }

    function b64_to_utf8(str) {
        return decodeURIComponent(atob(str).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    // Encode/Decode Data for URL sharing
    function encodeSave(data) {
        const minified = { c: data.currentProfile, p: {} };
        for (let profile in data.profiles) {
            minified.p[profile] = { m: [], d: [] };
            const state = data.profiles[profile];
            if (state.main) {
                for (let key in state.main) {
                    if (state.main[key]) minified.p[profile].m.push(key.replace('region-main-', '').replace('-task-', '-'));
                }
            }
            if (state.dlc) {
                for (let key in state.dlc) {
                    if (state.dlc[key]) minified.p[profile].d.push(key.replace('region-dlc-', '').replace('-task-', '-'));
                }
            }
        }
        return utf8_to_b64(JSON.stringify(minified));
    }

    function decodeSave(encoded) {
        try {
            const minified = JSON.parse(b64_to_utf8(encoded));
            const decoded = { currentProfile: minified.c || 'Default', profiles: {} };
            
            for (let profile in minified.p) {
                decoded.profiles[profile] = { main: {}, dlc: {} };
                const m = minified.p[profile].m || [];
                const d = minified.p[profile].d || [];
                m.forEach(shortKey => {
                    const parts = shortKey.split('-');
                    if (parts.length === 2) decoded.profiles[profile].main[`region-main-${parts[0]}-task-${parts[1]}`] = true;
                });
                d.forEach(shortKey => {
                    const parts = shortKey.split('-');
                    if (parts.length === 2) decoded.profiles[profile].dlc[`region-dlc-${parts[0]}-task-${parts[1]}`] = true;
                });
            }
            return decoded;
        } catch (e) {
            console.error('Error decoding save', e);
            return null;
        }
    }
    
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
    // Clean up empty profiles
    if (!appData.profiles['Default']) {
        appData.profiles['Default'] = { main: {}, dlc: {} };
    }
    if (!appData.profiles['Default'].main) {
        appData.profiles['Default'].main = {};
    }
    if (!appData.profiles['Default'].dlc) {
        appData.profiles['Default'].dlc = {};
    }

    // Check URL for imported save on load
    if (window.location.hash.startsWith('#save=')) {
        const encoded = window.location.hash.replace('#save=', '');
        const currentEncoded = encodeSave(appData);
        
        if (encoded !== currentEncoded) {
            const importedData = decodeSave(encoded);
            if (importedData && importedData.profiles) {
                if (confirm('Import save from URL? This will overwrite your current progress.')) {
                    appData = importedData;
                    localStorage.setItem(saveKey, JSON.stringify(appData));
                }
            } else {
                alert('Invalid or corrupted save URL.');
            }
        }
    }

    let currentProfile = appData.currentProfile || 'Default';
    if (!appData.profiles[currentProfile]) {
        currentProfile = Object.keys(appData.profiles)[0] || 'Default';
    }
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

    // Save to LocalStorage and update URL
    function saveState() {
        appData.currentProfile = currentProfile;
        appData.profiles[currentProfile] = appState;
        localStorage.setItem(saveKey, JSON.stringify(appData));
        
        const encoded = encodeSave(appData);
        window.history.replaceState(null, null, window.location.pathname + window.location.search + '#save=' + encoded);
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

        // Share URL (Robust Copy)
        shareUrlBtn.addEventListener('click', () => {
            const url = window.location.href;
            
            function fallbackCopyTextToClipboard(text) {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";
                textArea.style.opacity = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                document.body.removeChild(textArea);
            }

            function success() {
                const originalText = shareUrlBtn.textContent;
                shareUrlBtn.textContent = '✅ Copied!';
                setTimeout(() => shareUrlBtn.textContent = originalText, 2000);
            }

            if (!navigator.clipboard) {
                fallbackCopyTextToClipboard(url);
                success();
                return;
            }
            
            navigator.clipboard.writeText(url).then(function() {
                success();
            }, function(err) {
                fallbackCopyTextToClipboard(url);
                success();
            });
        });
    }

    // Run
    init();
});

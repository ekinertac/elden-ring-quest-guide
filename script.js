document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const contentArea = document.getElementById('content-area');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const progressFill = document.getElementById('progress-fill');
    const resetBtn = document.getElementById('reset-btn');

    // State
    let currentTab = 'main';
    let saveKey = 'er-quest-tracker-state';
    
    // Load state from local storage
    let appState = JSON.parse(localStorage.getItem(saveKey)) || {
        main: {},
        dlc: {}
    };

    // Initialize App
    function init() {
        renderContent();
        updateProgress();
        setupEventListeners();
    }

    // Render Content based on current tab
    function renderContent() {
        const data = currentTab === 'main' ? questData.main : questData.dlc;
        contentArea.innerHTML = '';
        
        data.forEach((region, rIndex) => {
            const regionId = `region-${currentTab}-${rIndex}`;
            
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
                <div class="region-title">${region.title}</div>
                <div class="region-progress" id="prog-${regionId}">${completedTasks}/${totalTasks}</div>
            `;
            
            // Create Content Area
            const content = document.createElement('div');
            content.className = 'region-content';
            content.id = `content-${regionId}`;

            // Create Task List
            const taskList = document.createElement('ul');
            taskList.className = 'task-list';

            region.tasks.forEach((taskText, tIndex) => {
                const taskId = `${regionId}-task-${tIndex}`;
                const isCompleted = appState[currentTab][taskId] || false;

                const listItem = document.createElement('li');
                listItem.className = `task-item ${isCompleted ? 'completed' : ''}`;
                
                listItem.innerHTML = `
                    <input type="checkbox" id="${taskId}" class="task-checkbox" ${isCompleted ? 'checked' : ''}>
                    <label for="${taskId}" class="task-label">${taskText}</label>
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
                
                // Close all others optionally, but let's keep them independent for better UX
                if (isOpen) {
                    content.style.maxHeight = '0';
                    content.classList.remove('open');
                } else {
                    content.classList.add('open');
                    content.style.maxHeight = content.scrollHeight + 'px';
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
        localStorage.setItem(saveKey, JSON.stringify(appState));
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
            if (confirm(`Are you sure you want to reset all progress for ${currentTab === 'main' ? 'the Main Game' : 'the DLC'}?`)) {
                appState[currentTab] = {};
                saveState();
                renderContent();
                updateProgress();
            }
        });
    }

    // Run
    init();
});
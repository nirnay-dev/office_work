document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const prevYearButton = document.getElementById('prevYear');
    const nextYearButton = document.getElementById('nextYear');
    const todayButton = document.getElementById('todayButton');
    const taskModal = document.getElementById('taskModal');
    const closeButton = taskModal.querySelector('.close-button');
    const modalTitleHeader = document.getElementById('modalTitle');
    const modalTaskList = document.getElementById('modalTaskList');
    const addTaskForm = document.getElementById('addTaskForm');
    const newTaskDescriptionInput = document.getElementById('newTaskDescription');
    const newTaskNotesInput = document.getElementById('newTaskNotes');
    const newTaskCategorySelect = document.getElementById('newTaskCategorySelect');
    const addNewCategoryInput = document.getElementById('addNewCategoryInput');
    const newTaskTimeInput = document.getElementById('newTaskTime');
    const newTaskPrioritySelect = document.getElementById('newTaskPriority');
    const newTaskRecurrenceSelect = document.getElementById('newTaskRecurrence');
    const modalDateInput = document.getElementById('modalDate');
    const isHolidayCheckbox = document.getElementById('isHolidayCheckbox');
    const editTaskModal = document.getElementById('editTaskModal');
    const closeEditModalButton = document.getElementById('closeEditModal');
    const editTaskDescriptionInput = document.getElementById('editTaskDescription');
    const editTaskNotesInput = document.getElementById('editTaskNotes');
    const editTaskCategorySelect = document.getElementById('editTaskCategorySelect');
    const editTaskTimeInput = document.getElementById('editTaskTime');
    const editTaskPrioritySelect = document.getElementById('editTaskPriority');
    const editTaskRecurrenceSelect = document.getElementById('editTaskRecurrence');
    const editTaskCompletedSelect = document.getElementById('editTaskCompleted');
    const confirmSaveTaskButton = document.getElementById('confirmSaveTaskButton');
    const confirmDeleteTaskButton = document.getElementById('confirmDeleteTaskButton');
    const confirmDeleteRecurringTaskButton = document.getElementById('confirmDeleteRecurringTaskButton');
    const confirmDeleteAllRecurringTaskButton = document.getElementById('confirmDeleteAllRecurringTaskButton');
    const editModalDateInput = document.getElementById('editModalDate');
    const editModalTaskIndexInput = document.getElementById('editModalTaskIndex');
    const editModalIsRecurringInstance = document.getElementById('editModalIsRecurringInstance');
    const editModalInstanceDateInput = document.getElementById('editModalInstanceDate');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const installAppBtn = document.getElementById('installAppBtn');
    const body = document.body;
    const downloadTasksButton = document.getElementById('downloadTasksButton');
    const importFile = document.getElementById('importFile');
    const importTasksButton = document.getElementById('importTasksButton');
    const downloadWordReportButton = document.getElementById('downloadWordReportButton');
    const monthTaskView = document.getElementById('monthTaskView');
    const toggleMonthViewButton = document.getElementById('toggleMonthViewButton');
    const monthTaskViewMonthYear = document.getElementById('monthTaskViewMonthYear');
    const monthTaskListContainer = document.getElementById('monthTaskListContainer');
    const closeMonthViewButton = document.getElementById('closeMonthView');
    const searchInput = document.getElementById('searchInput');
    const filterCategorySelect = document.getElementById('filterCategory');
    const filterCompletionSelect = document.getElementById('filterCompletion');
    const hideCompletedToggle = document.getElementById('hideCompletedToggle');
    const manageCategoriesButton = document.getElementById('manageCategoriesButton');
    const manageCategoriesPanel = document.getElementById('manageCategoriesPanel');
    const categoryListContainer = document.getElementById('categoryListContainer');
    // Stats bar
    const statTotal = document.getElementById('statTotal');
    const statDone = document.getElementById('statDone');
    const statPending = document.getElementById('statPending');
    const statsProgressFill = document.getElementById('statsProgressFill');
    const statsProgressLabel = document.getElementById('statsProgressLabel');
    // Confirm overlay
    const confirmOverlay = document.getElementById('confirmOverlay');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');

    // Google Sheets Elements
    const sheetsSettingsButton = document.getElementById('sheetsSettingsButton');
    const sheetsSettingsPanel = document.getElementById('sheetsSettingsPanel');
    const sheetsWebhookUrlInput = document.getElementById('sheetsWebhookUrlInput');
    const sheetsConnectBtn = document.getElementById('sheetsConnectBtn');
    const sheetsPushBtn = document.getElementById('sheetsPushBtn');
    const sheetsPullBtn = document.getElementById('sheetsPullBtn');
    const sheetsDisconnectBtn = document.getElementById('sheetsDisconnectBtn');
    const syncStatusBadge = document.getElementById('syncStatusBadge');

    // --- Category Color Palette ---
    const CATEGORY_COLORS = [
        '#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444',
        '#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b'
    ];
    let categoryColors = {}; // { categoryName: hexColor }

    function getCategoryColor(cat) {
        if (!categoryColors[cat]) {
            const idx = Object.keys(categoryColors).length % CATEGORY_COLORS.length;
            categoryColors[cat] = CATEGORY_COLORS[idx];
        }
        return categoryColors[cat];
    }

    // --- Toast Notifications ---
    const toastContainer = document.getElementById('toastContainer');
    function showToast(msg, type = 'info', duration = 3200) {
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        const icons = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
        t.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${msg}</span>`;
        toastContainer.appendChild(t);
        t.addEventListener('click', () => removeToast(t));
        setTimeout(() => removeToast(t), duration);
    }
    function removeToast(t) {
        if (!t.parentNode) return;
        t.classList.add('removing');
        setTimeout(() => t.parentNode && t.parentNode.removeChild(t), 300);
    }

    // --- Custom Confirm Dialog ---
    let _confirmResolve = null;
    function showConfirm(msg, okLabel = 'Confirm', _okClass = 'danger') {
        return new Promise(resolve => {
            _confirmResolve = resolve;
            confirmMessage.textContent = msg;
            confirmOkBtn.textContent = okLabel;
            confirmOverlay.classList.add('is-open');
        });
    }
    confirmOkBtn.addEventListener('click', () => {
        confirmOverlay.classList.remove('is-open');
        if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
    });
    confirmCancelBtn.addEventListener('click', () => {
        confirmOverlay.classList.remove('is-open');
        if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
    });

    // --- State Variables ---
    let currentDate = new Date();
    let tasks = {};
    let holidays = {};
    let categories = ['General', 'Work', 'Personal'];
    let currentMode = 'light';
    let isMonthViewVisible = false;
    let hideCompleted = false;
    let currentSearchTerm = '';
    let currentFilterCategory = 'all';
    let currentFilterCompletion = 'all';
    let draggedTaskData = null;
    let googleSheetsUrl = '';
    let deferredPrompt = null;

    // --- Initialization ---
    loadData();
    applySavedModePreference();
    applySavedMonthViewPreference();
    applyHideCompletedPreference();
    populateCategorySelects();
    populateFilterCategorySelect();
    renderCalendar();
    renderMonthTasksView();
    updateStatsBar();

    // Initialize Google Sheets Sync state
    if (googleSheetsUrl) {
        sheetsWebhookUrlInput.value = googleSheetsUrl;
        updateSyncStatus('synced');
        fetchFromGoogleSheets();
    } else {
        updateSyncStatus('local');
    }

    // --- Load/Save Data ---
    function loadData() {
        const loadedTasks = JSON.parse(localStorage.getItem('calendarTasks')) || {};
        const loadedHolidays = JSON.parse(localStorage.getItem('calendarHolidays')) || {};
        const loadedCategories = JSON.parse(localStorage.getItem('calendarCategories')) || ['General', 'Work', 'Personal'];
        const loadedMode = localStorage.getItem('calendarMode') || 'light';
        const loadedMonthView = localStorage.getItem('monthViewVisible') === 'true';
        const loadedHideCompleted = localStorage.getItem('hideCompleted') === 'true';
        const loadedColors = JSON.parse(localStorage.getItem('calendarCategoryColors')) || {};
        googleSheetsUrl = localStorage.getItem('googleSheetsUrl') || 'https://script.google.com/macros/s/AKfycbzH4fnzriPvPa1kGnnPW0sx84AmiYFV728pABB20E_3gftwzYDswwWX4-EIlGvyfkB76w/exec';

        const validatedTasks = {};
        Object.keys(loadedTasks).forEach(date => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
            if (!Array.isArray(loadedTasks[date])) return;
            validatedTasks[date] = loadedTasks[date].map((task, index) => {
                const defaultId = `${date}-${index}-${Date.now()}`;
                if (typeof task === 'string') {
                    return { id: defaultId, description: task, notes: '', category: 'General', completed: false, time: '', priority: 'medium', recurrence: 'none', originalDate: date, exceptions: [] };
                }
                return {
                    id: task?.id || defaultId,
                    description: task?.description || '',
                    notes: task?.notes || '',
                    category: task?.category || 'General',
                    completed: task?.completed || false,
                    time: task?.time || '',
                    priority: task?.priority || 'medium',
                    recurrence: task?.recurrence || 'none',
                    originalDate: task?.originalDate || date,
                    exceptions: Array.isArray(task?.exceptions) ? task.exceptions : [],
                };
            }).filter(Boolean);
        });
        tasks = validatedTasks;
        holidays = typeof loadedHolidays === 'object' && loadedHolidays !== null ? loadedHolidays : {};
        categories = Array.isArray(loadedCategories) ? loadedCategories : ['General', 'Work', 'Personal'];
        categoryColors = typeof loadedColors === 'object' && loadedColors !== null ? loadedColors : {};
        currentMode = loadedMode || 'light';
        isMonthViewVisible = loadedMonthView === true;
        hideCompleted = loadedHideCompleted === true;
        if (!categories.includes('General')) categories.unshift('General');
    }

    function saveData() {
        localStorage.setItem('calendarTasks', JSON.stringify(tasks));
        localStorage.setItem('calendarHolidays', JSON.stringify(holidays));
        localStorage.setItem('calendarCategories', JSON.stringify(categories));
        localStorage.setItem('calendarCategoryColors', JSON.stringify(categoryColors));
        localStorage.setItem('calendarMode', currentMode);
        localStorage.setItem('monthViewVisible', isMonthViewVisible);
        localStorage.setItem('hideCompleted', hideCompleted);
        localStorage.setItem('googleSheetsUrl', googleSheetsUrl);
        if (googleSheetsUrl) {
            pushToGoogleSheets();
        }
    }

    // --- Google Sheets Sync Engine ---
    function updateSyncStatus(status) {
        syncStatusBadge.className = `sync-badge ${status}`;
        const label = syncStatusBadge.querySelector('.status-text');
        if (status === 'local') {
            label.textContent = 'Local Mode';
            sheetsPushBtn.disabled = true;
            sheetsPullBtn.disabled = true;
            sheetsDisconnectBtn.style.display = 'none';
            sheetsConnectBtn.style.display = 'inline-block';
            sheetsConnectBtn.disabled = false;
        } else if (status === 'synced') {
            label.textContent = 'Synced';
            sheetsPushBtn.disabled = false;
            sheetsPullBtn.disabled = false;
            sheetsDisconnectBtn.style.display = 'inline-block';
            sheetsConnectBtn.style.display = 'none';
        } else if (status === 'syncing') {
            label.textContent = 'Syncing...';
        } else if (status === 'offline') {
            label.textContent = 'Offline';
            sheetsPushBtn.disabled = false;
            sheetsPullBtn.disabled = false;
            sheetsDisconnectBtn.style.display = 'inline-block';
            sheetsConnectBtn.style.display = 'none';
        }
    }

    async function fetchFromGoogleSheets() {
        if (!googleSheetsUrl) return;
        updateSyncStatus('syncing');
        try {
            const response = await fetch(googleSheetsUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            // Validate and merge categories
            if (Array.isArray(data.categories)) {
                categories = ['General'];
                data.categories.forEach(c => {
                    const name = typeof c === 'string' ? c : (c.name || '');
                    if (name && name !== 'General') {
                        categories.push(name);
                    }
                    if (c.color) {
                        categoryColors[name] = c.color;
                    }
                });
            }

            // Validate and merge settings
            if (data.settings) {
                if (data.settings.currentMode) currentMode = data.settings.currentMode;
                if (data.settings.isMonthViewVisible !== undefined) {
                    isMonthViewVisible = data.settings.isMonthViewVisible === true || String(data.settings.isMonthViewVisible).toLowerCase() === 'true';
                }
                if (data.settings.hideCompleted !== undefined) {
                    hideCompleted = data.settings.hideCompleted === true || String(data.settings.hideCompleted).toLowerCase() === 'true';
                }
            }

            // Validate and overwrite tasks
            if (data.tasks && typeof data.tasks === 'object') {
                const validatedTasks = {};
                Object.keys(data.tasks).forEach(date => {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
                    if (!Array.isArray(data.tasks[date])) return;
                    validatedTasks[date] = data.tasks[date].map((task, index) => {
                        const defaultId = `${date}-${index}-${Date.now()}`;
                        return {
                            id: task?.id || defaultId,
                            description: task?.description || '',
                            notes: task?.notes || '',
                            category: task?.category || 'General',
                            completed: task?.completed === true || String(task?.completed).toLowerCase() === 'true',
                            time: task?.time || '',
                            priority: task?.priority || 'medium',
                            recurrence: task?.recurrence || 'none',
                            originalDate: task?.originalDate || date,
                            exceptions: Array.isArray(task?.exceptions) ? task.exceptions : (task?.exceptions ? String(task.exceptions).split(',') : []),
                        };
                    }).filter(Boolean);
                });
                tasks = validatedTasks;
            }

            applySavedModePreference();
            applySavedMonthViewPreference();
            applyHideCompletedPreference();
            populateCategorySelects();
            populateFilterCategorySelect();

            // Store local fallback copy
            localStorage.setItem('calendarTasks', JSON.stringify(tasks));
            localStorage.setItem('calendarCategories', JSON.stringify(categories));
            localStorage.setItem('calendarCategoryColors', JSON.stringify(categoryColors));
            localStorage.setItem('calendarMode', currentMode);
            localStorage.setItem('monthViewVisible', isMonthViewVisible);
            localStorage.setItem('hideCompleted', hideCompleted);

            rerenderViews();
            updateSyncStatus('synced');
            showToast('Google Sheet successfully synchronized!', 'success');
        } catch (error) {
            console.error('Error fetching from Google Sheets:', error);
            updateSyncStatus('offline');
            showToast('Failed to pull from Google Sheets. Operating in local mode.', 'warning');
        }
    }

    async function pushToGoogleSheets() {
        if (!googleSheetsUrl) return;
        updateSyncStatus('syncing');
        try {
            const categoriesPayload = categories.map(cat => ({
                name: cat,
                color: getCategoryColor(cat)
            }));

            const payload = {
                tasks: tasks,
                categories: categoriesPayload,
                settings: {
                    currentMode: currentMode,
                    isMonthViewVisible: isMonthViewVisible,
                    hideCompleted: hideCompleted
                }
            };

            await fetch(googleSheetsUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(payload)
            });

            updateSyncStatus('synced');
        } catch (error) {
            console.error('Error pushing to Google Sheets:', error);
            updateSyncStatus('offline');
            showToast('Failed to push to Google Sheets. Saved locally.', 'warning');
        }
    }

    // --- Stats Bar ---
    function updateStatsBar() {
        const year = currentDate.getFullYear(), month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let total = 0, done = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = formatDate(new Date(year, month, d));
            getTasksForDate(ds).forEach(t => { total++; if (t.completed) done++; });
        }
        const pending = total - done;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        statTotal.textContent = total;
        statDone.textContent = done;
        statPending.textContent = pending;
        statsProgressFill.style.width = pct + '%';
        statsProgressLabel.textContent = pct + '% complete';
    }

    // --- Category Management ---
    function renderManageCategories() {
        categoryListContainer.innerHTML = '';
        categories.forEach(cat => {
            const row = document.createElement('div');
            row.className = 'cat-manage-item';
            const dot = document.createElement('span');
            dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:50%;background:${getCategoryColor(cat)};margin-right:8px;flex-shrink:0;`;
            const name = document.createElement('span');
            name.textContent = cat;
            row.appendChild(dot); row.appendChild(name);
            if (cat !== 'General') {
                const btn = document.createElement('button');
                btn.className = 'cat-delete-btn'; btn.textContent = '✕';
                btn.addEventListener('click', () => deleteCategory(cat));
                row.appendChild(btn);
            }
            categoryListContainer.appendChild(row);
        });
    }
    async function deleteCategory(cat) {
        const ok = await showConfirm(`Delete category "${cat}"? All tasks in it will be moved to General.`, 'Delete');
        if (!ok) return;
        categories = categories.filter(c => c !== cat);
        Object.keys(tasks).forEach(date => {
            tasks[date].forEach(t => { if (t.category === cat) t.category = 'General'; });
        });
        saveData();
        populateCategorySelects(); populateFilterCategorySelect();
        renderManageCategories(); rerenderViews();
        showToast(`Category "${cat}" deleted.`, 'info');
    }

    // --- Task Management Functions ---
    function generateTaskId(date) {
        return `${date}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    function addTask(taskData) {
        const date = taskData.originalDate;
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            console.error("Attempted to add task with invalid date:", taskData);
            return;
        }
        if (!tasks[date]) {
            tasks[date] = [];
        }
        tasks[date].push(taskData);
        saveData();
        rerenderViews(date);
    }

    function updateTask(originalDate, taskIndex, updatedTaskData, isRecurringInstance = false, instanceDate = null) {
         if (!originalDate || !tasks[originalDate] || typeof taskIndex !== 'number' || !tasks[originalDate][taskIndex]) {
             console.error("Task not found for update:", originalDate, taskIndex);
             showToast("Error: Could not find task to update.", "error");
             return;
         }

        const taskToUpdate = tasks[originalDate][taskIndex];
        const dateToRerender = [originalDate];

        if (isRecurringInstance && instanceDate && taskToUpdate.recurrence !== 'none') {
             console.log(`Updating series definition for recurring task: ${taskToUpdate.id} based on instance edit.`);
             Object.assign(taskToUpdate, updatedTaskData);
             if (updatedTaskData.originalDate && updatedTaskData.originalDate !== originalDate) {
                  showToast("Changing the start date of a recurring series is not fully supported via instance edit.", "warning");
                  updatedTaskData.originalDate = originalDate;
             }
             if (instanceDate) dateToRerender.push(instanceDate);

        } else {
            const previousOriginalDate = taskToUpdate.originalDate;
            Object.assign(taskToUpdate, updatedTaskData);
            const newOriginalDate = taskToUpdate.originalDate;
            if (newOriginalDate && newOriginalDate !== originalDate) {
                 console.log(`Moving task ${taskToUpdate.id} from key ${originalDate} to ${newOriginalDate}`);
                 if (!/^\d{4}-\d{2}-\d{2}$/.test(newOriginalDate)) {
                      console.error("Invalid new original date during update:", newOriginalDate);
                      showToast("Error: Invalid date format for moving task.", "error");
                      taskToUpdate.originalDate = originalDate;
                 } else {
                      if (!tasks[newOriginalDate]) tasks[newOriginalDate] = [];
                      tasks[newOriginalDate].push(taskToUpdate);
                      tasks[originalDate].splice(taskIndex, 1);
                      if (tasks[originalDate].length === 0) delete tasks[originalDate];
                      dateToRerender.push(newOriginalDate);
                 }
            } else if (newOriginalDate && newOriginalDate !== previousOriginalDate && newOriginalDate === originalDate) {
                 console.log(`Task ${taskToUpdate.id} originalDate property updated to match key ${originalDate}`);
            }
        }
        saveData();
        dateToRerender.forEach(d => rerenderViews(d));
    }

    function deleteTask(originalDate, taskIndex, isRecurringInstance = false, instanceDate = null) {
         if (!originalDate || !tasks[originalDate] || typeof taskIndex !== 'number' || !tasks[originalDate][taskIndex]) {
             console.error("Task not found for deletion:", originalDate, taskIndex);
             showToast("Error: Could not find task to delete.", "error");
             return;
         }

        const taskToDelete = tasks[originalDate][taskIndex];
        const datesToRerender = [originalDate];

        if (isRecurringInstance && instanceDate && taskToDelete.recurrence !== 'none') {
            if (!Array.isArray(taskToDelete.exceptions)) taskToDelete.exceptions = [];
            if (!taskToDelete.exceptions.includes(instanceDate)) {
                 taskToDelete.exceptions.push(instanceDate);
                 console.log(`Added exception for task ${taskToDelete.id} on ${instanceDate}`);
                 datesToRerender.push(instanceDate);
            } else {
                 console.log(`Exception already exists for task ${taskToDelete.id} on ${instanceDate}`);
            }
        } else {
            console.log(`Deleting original task definition ${taskToDelete.id} from ${originalDate}`);
            tasks[originalDate].splice(taskIndex, 1);
            if (tasks[originalDate].length === 0) delete tasks[originalDate];
        }
        saveData();
        datesToRerender.forEach(d => rerenderViews(d));
    }

    // --- Helper Functions ---
    function getUTCDateFromString(dateString) {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return null;
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    function formatDateDisplay(dateString) {
        const date = getUTCDateFromString(dateString);
        if (!date) return "Invalid Date";
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
    }

    // --- Recurrence Logic ---
    function getTasksForDate(targetDateString) {
        const targetDate = getUTCDateFromString(targetDateString);
        if (!targetDate) return [];
        const tasksOnDate = [];
        if (tasks[targetDateString]) {
            tasksOnDate.push(...tasks[targetDateString]
                .filter(task => !task.recurrence || task.recurrence === 'none')
                .map((task, index) => ({ ...task, date: targetDateString, isRecurringInstance: false, originalTaskIndex: index }))
            );
        }
        Object.keys(tasks).forEach(keyDateString => {
            if (!tasks[keyDateString]) return;
            tasks[keyDateString].forEach((task, index) => {
                if (task.recurrence && task.recurrence !== 'none' && task.originalDate) {
                    const originalTaskDate = getUTCDateFromString(task.originalDate);
                    if (!originalTaskDate || targetDate < originalTaskDate || (Array.isArray(task.exceptions) && task.exceptions.includes(targetDateString))) return;
                    let isMatch = false;
                    switch (task.recurrence) {
                        case 'daily': isMatch = targetDate >= originalTaskDate; break;
                        case 'weekly': isMatch = targetDate >= originalTaskDate && targetDate.getUTCDay() === originalTaskDate.getUTCDay(); break;
                        case 'monthly': isMatch = targetDate >= originalTaskDate && targetDate.getUTCDate() === originalTaskDate.getUTCDate(); break;
                        case 'yearly': isMatch = targetDate >= originalTaskDate && targetDate.getUTCMonth() === originalTaskDate.getUTCMonth() && targetDate.getUTCDate() === originalTaskDate.getUTCDate(); break;
                    }
                    if (isMatch) {
                        const isFirstOccurrence = targetDateString === task.originalDate;
                        tasksOnDate.push({ ...task, date: targetDateString, isRecurringInstance: !isFirstOccurrence, originalTaskIndex: index, keyDate: keyDateString });
                    }
                }
            });
        });
        const uniqueTasks = [];
        const seenKeys = new Set();
        tasksOnDate.forEach(task => {
            const uniqueKey = task.id || `${task.keyDate || task.originalDate}-${task.originalTaskIndex}`;
            if (!seenKeys.has(uniqueKey)) {
                uniqueTasks.push(task);
                seenKeys.add(uniqueKey);
            } else {
                const existingIndex = uniqueTasks.findIndex(t => (t.id || `${t.keyDate || t.originalDate}-${t.originalTaskIndex}`) === uniqueKey);
                if (existingIndex > -1 && uniqueTasks[existingIndex].isRecurringInstance && !task.isRecurringInstance) {
                    uniqueTasks[existingIndex] = task;
                }
            }
        });
        const filteredTasks = uniqueTasks.filter(task => {
            if (!task) return false;
            const descMatch = !currentSearchTerm || (task.description && task.description.toLowerCase().includes(currentSearchTerm));
            const catMatch = currentFilterCategory === 'all' || task.category === currentFilterCategory;
            const compMatch = currentFilterCompletion === 'all' || (currentFilterCompletion === 'completed' && task.completed) || (currentFilterCompletion === 'incomplete' && !task.completed);
            const hideMatch = !hideCompleted || !task.completed;
            return descMatch && catMatch && compMatch && hideMatch;
        });
        filteredTasks.sort((a, b) => {
            const prioOrder = { high: 0, medium: 1, low: 2, null: 3, undefined: 3 };
            const prioDiff = (prioOrder[a.priority] ?? 3) - (prioOrder[b.priority] ?? 3);
            if (prioDiff !== 0) return prioDiff;
            const timeA = a.time || '99:99'; const timeB = b.time || '99:99';
            if (timeA !== timeB) return timeA.localeCompare(timeB);
            return (a.description || '').localeCompare(b.description || '');
        });
        return filteredTasks;
    }

    // --- Rendering Functions ---
    function renderCalendar() {
        const dayLabels = Array.from(calendarGrid.querySelectorAll('.day-label'));
        calendarGrid.innerHTML = '';
        dayLabels.forEach(label => calendarGrid.appendChild(label));
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay();
        currentMonthYear.textContent = `${firstDayOfMonth.toLocaleString('default', { month: 'long' })} ${year}`;
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty');
            calendarGrid.appendChild(emptyDay);
        }
        const todayLocalDate = new Date(); todayLocalDate.setHours(0, 0, 0, 0);
        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div'); dayCell.classList.add('day');
            const currentDayLocalDate = new Date(year, month, i);
            const dateString = formatDate(currentDayLocalDate);
            dayCell.dataset.date = dateString; dayCell.setAttribute('role', 'gridcell');
            dayCell.setAttribute('tabindex', 0); dayCell.setAttribute('aria-label', `Date ${i}, ${firstDayOfMonth.toLocaleString('default', { month: 'long' })}`);
            const tasksForDate = getTasksForDate(dateString);
            const dayOfWeek = currentDayLocalDate.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) dayCell.classList.add('weekend');
            if (holidays[dateString]) dayCell.classList.add('holiday');
            if (tasksForDate.length > 0) {
                dayCell.classList.add('has-task');
                if (tasksForDate.length > 5) dayCell.classList.add('high-density');
                const currentDayNormalized = new Date(currentDayLocalDate); currentDayNormalized.setHours(0,0,0,0);
                const timeDiff = currentDayNormalized.getTime() - todayLocalDate.getTime();
                const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
                const hasIncompleteTaskDueSoon = tasksForDate.some(task => !task.completed);
                if (dayDiff >= 0 && dayDiff <= 7 && hasIncompleteTaskDueSoon) dayCell.classList.add('due-soon');
            }
            if (currentDayLocalDate.getFullYear() === todayLocalDate.getFullYear() && currentDayLocalDate.getMonth() === todayLocalDate.getMonth() && currentDayLocalDate.getDate() === todayLocalDate.getDate()) dayCell.classList.add('today');
            const dayNumber = document.createElement('div'); dayNumber.classList.add('day-number');
            dayNumber.textContent = i; dayCell.appendChild(dayNumber);
            const taskListPreview = document.createElement('ul'); taskListPreview.classList.add('task-list-preview'); dayCell.appendChild(taskListPreview);
            const previewTasks = tasksForDate.slice(0, 3);
            previewTasks.forEach((task) => {
                if (!task) return; const taskItem = document.createElement('li'); taskItem.draggable = true;
                taskItem.dataset.taskId = task.id; const definitionDate = task.keyDate || task.originalDate;
                taskItem.dataset.originalDate = definitionDate; taskItem.dataset.currentDate = dateString;
                taskItem.dataset.taskIndex = findTaskIndex(task.id, definitionDate); taskItem.dataset.isRecurringInstance = task.isRecurringInstance;
                const priorityIcon = document.createElement('span'); priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
                priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`); taskItem.appendChild(priorityIcon);
                const taskText = document.createElement('span'); taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`; taskItem.appendChild(taskText);
                if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                    const recurrenceIcon = document.createElement('span'); recurrenceIcon.classList.add('recurrence-icon');
                    recurrenceIcon.textContent = '↻'; recurrenceIcon.title = `Recurring: ${task.recurrence}`; taskItem.appendChild(recurrenceIcon);
                }
                if (task.completed) taskItem.classList.add('completed');
                taskListPreview.appendChild(taskItem);
            });
            if (tasksForDate.length > 3) {
                const moreItem = document.createElement('li'); moreItem.textContent = `+${tasksForDate.length - 3} more...`;
                moreItem.style.cursor = 'default'; taskListPreview.appendChild(moreItem);
            }
            dayCell.addEventListener('click', () => openTaskModal(dateString));
            dayCell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTaskModal(dateString); } });
            dayCell.addEventListener('dragover', handleDragOver); dayCell.addEventListener('dragenter', handleDragEnter);
            dayCell.addEventListener('dragleave', handleDragLeave); dayCell.addEventListener('drop', handleDrop);
            calendarGrid.appendChild(dayCell);
        }
        addDragListenersToTasks();
    }
    function findTaskIndex(taskId, definitionDate) {
        if (!taskId || !definitionDate || !tasks[definitionDate]) return -1;
        return tasks[definitionDate].findIndex(t => t.id === taskId);
    }
    function renderModalTasks(dateString) {
        modalTaskList.innerHTML = '';
        const tasksForDate = getTasksForDate(dateString);
        if (tasksForDate.length === 0) { modalTaskList.innerHTML = '<li>No tasks for this date (matching filters).</li>'; return; }
        tasksForDate.forEach((task) => {
            if (!task) return;
            const listItem = document.createElement('li'); listItem.classList.add('modal-task-item');
            if (task.completed) listItem.classList.add('completed');
            // Checkbox
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', `Mark task ${task.description || ''} as complete`);
            const definitionDate = task.keyDate || task.originalDate;
            const taskIdx = findTaskIndex(task.id, definitionDate);
            checkbox.dataset.originalDate = definitionDate; checkbox.dataset.taskIndex = taskIdx;
            checkbox.addEventListener('change', (e) => {
                const od = e.target.dataset.originalDate; const ti = parseInt(e.target.dataset.taskIndex);
                if (od && !isNaN(ti) && tasks[od]?.[ti] !== undefined) {
                    tasks[od][ti].completed = e.target.checked; saveData();
                    renderModalTasks(dateString); rerenderViews(dateString);
                } else { showToast('Error toggling task.', 'error'); rerenderViews(dateString); }
            });
            // Content
            const taskContentWrapper = document.createElement('div'); taskContentWrapper.classList.add('task-content-wrapper');
            const priorityIcon = document.createElement('span'); priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
            const taskText = document.createElement('span'); taskText.classList.add('task-text');
            taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`;
            if (task.completed) taskText.classList.add('completed');
            taskContentWrapper.appendChild(priorityIcon); taskContentWrapper.appendChild(taskText);
            if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                const recurrenceIcon = document.createElement('span'); recurrenceIcon.classList.add('recurrence-icon');
                recurrenceIcon.textContent = '\u21BB'; recurrenceIcon.title = `Recurring: ${task.recurrence}`; taskContentWrapper.appendChild(recurrenceIcon);
            }
            if (task.notes) {
                const notesEl = document.createElement('span'); notesEl.className = 'task-notes-preview';
                notesEl.title = task.notes; notesEl.textContent = `// ${task.notes}`;
                taskContentWrapper.appendChild(notesEl);
            }
            if (task.category) {
                const pill = document.createElement('span'); pill.className = 'category-pill';
                pill.style.background = getCategoryColor(task.category);
                pill.textContent = task.category; taskContentWrapper.appendChild(pill);
            }
            // Buttons
            const actionsDiv = document.createElement('div'); actionsDiv.classList.add('modal-task-actions');
            const editButton = document.createElement('button'); editButton.classList.add('edit-task-button'); editButton.textContent = 'Edit';
            editButton.dataset.originalDate = definitionDate; editButton.dataset.taskIndex = taskIdx;
            editButton.dataset.isRecurringInstance = task.isRecurringInstance; editButton.dataset.currentDate = task.date;
            editButton.setAttribute('aria-label', `Edit task: ${task.description || ''}`);
            editButton.addEventListener('click', (e) => {
                const od = e.target.dataset.originalDate; const ti = parseInt(e.target.dataset.taskIndex);
                if (od && !isNaN(ti) && tasks[od]?.[ti]) {
                    openEditTaskModal(e.target.dataset.currentDate, od, ti, tasks[od][ti], e.target.dataset.isRecurringInstance === 'true');
                } else { showToast('Could not load task for editing.', 'error'); }
            });
            const deleteButton = document.createElement('button'); deleteButton.classList.add('delete-task-button'); deleteButton.textContent = 'Delete';
            deleteButton.dataset.originalDate = definitionDate; deleteButton.dataset.taskIndex = taskIdx;
            deleteButton.dataset.isRecurringInstance = task.isRecurringInstance; deleteButton.dataset.currentDate = task.date;
            deleteButton.setAttribute('aria-label', `Delete task: ${task.description || ''}`);
            deleteButton.addEventListener('click', async (e) => {
                const od = e.target.dataset.originalDate; const ti = parseInt(e.target.dataset.taskIndex);
                const isRecurring = e.target.dataset.isRecurringInstance === 'true';
                const occDate = e.target.dataset.currentDate;
                const isActuallyRecurring = tasks[od]?.[ti]?.recurrence !== 'none';
                if (isActuallyRecurring && isRecurring) {
                    const ok = await showConfirm(`Delete only the occurrence on ${formatDateDisplay(occDate)}, or Cancel to delete the entire series?`, 'Delete Occurrence');
                    if (ok) { deleteTask(od, ti, true, occDate); showToast('Occurrence deleted.', 'info'); }
                    else {
                        const okAll = await showConfirm(`Delete ENTIRE SERIES starting ${tasks[od][ti].originalDate}? Cannot be undone.`, 'Delete All');
                        if (okAll) { deleteTask(od, ti, false, null); showToast('Series deleted.', 'info'); }
                    }
                } else {
                    const ok = await showConfirm('Delete this task? Cannot be undone.', 'Delete');
                    if (ok) { deleteTask(od, ti, false, null); showToast('Task deleted.', 'info'); }
                }
            });
            actionsDiv.appendChild(editButton); actionsDiv.appendChild(deleteButton);
            listItem.appendChild(checkbox); listItem.appendChild(taskContentWrapper); listItem.appendChild(actionsDiv);
            modalTaskList.appendChild(listItem);
        });
    }

    function renderMonthTasksView() {
        monthTaskListContainer.innerHTML = '';
        const year = currentDate.getFullYear(); const month = currentDate.getMonth();
        monthTaskViewMonthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
        const sortedTasksByDate = {};
        for (let day = 1; day <= lastDayOfMonth; day++) {
            const ds = formatDate(new Date(year, month, day));
            const tfd = getTasksForDate(ds);
            if (tfd.length > 0) sortedTasksByDate[ds] = tfd;
        }
        if (!Object.keys(sortedTasksByDate).length) { monthTaskListContainer.innerHTML = '<p>No tasks scheduled for this month (matching filters).</p>'; return; }
        Object.keys(sortedTasksByDate).sort().forEach(dateString => {
            const tasksForDate = sortedTasksByDate[dateString];
            const dateGroup = document.createElement('div'); dateGroup.classList.add('task-date-group');
            const dateHeader = document.createElement('div'); dateHeader.classList.add('task-date');
            dateHeader.textContent = formatDateDisplay(dateString); dateGroup.appendChild(dateHeader);
            const taskList = document.createElement('ul');
            tasksForDate.forEach((task) => {
                if (!task) return;
                const taskItem = document.createElement('li');
                const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.completed;
                checkbox.setAttribute('aria-label', `Mark task ${task.description || ''} as complete`);
                const definitionDate = task.keyDate || task.originalDate;
                const taskIndex = findTaskIndex(task.id, definitionDate);
                checkbox.dataset.originalDate = definitionDate; checkbox.dataset.taskIndex = taskIndex;
                checkbox.addEventListener('change', (e) => {
                    const od = e.target.dataset.originalDate; const ti = parseInt(e.target.dataset.taskIndex);
                    if (od && !isNaN(ti) && tasks[od]?.[ti] !== undefined) {
                        tasks[od][ti].completed = e.target.checked; saveData(); rerenderViews();
                        if (taskModal.classList.contains('is-open') && modalDateInput.value === task.date) renderModalTasks(task.date);
                    } else { showToast('Error toggling task.', 'error'); renderMonthTasksView(); }
                });
                const taskContentWrapper = document.createElement('div'); taskContentWrapper.classList.add('task-content-wrapper');
                const priorityIcon = document.createElement('span'); priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
                const taskText = document.createElement('span'); taskText.classList.add('task-text');
                taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`;
                if (task.completed) taskText.classList.add('completed');
                taskContentWrapper.appendChild(priorityIcon); taskContentWrapper.appendChild(taskText);
                if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                    const recurrenceIcon = document.createElement('span'); recurrenceIcon.classList.add('recurrence-icon');
                    recurrenceIcon.textContent = '\u21BB'; recurrenceIcon.title = `Recurring: ${task.recurrence}`; taskContentWrapper.appendChild(recurrenceIcon);
                }
                if (task.notes) {
                    const notesEl = document.createElement('span'); notesEl.className = 'task-notes-preview';
                    notesEl.title = task.notes; notesEl.textContent = `// ${task.notes}`;
                    taskContentWrapper.appendChild(notesEl);
                }
                if (task.category) {
                    const pill = document.createElement('span'); pill.className = 'category-pill';
                    pill.style.background = getCategoryColor(task.category);
                    pill.textContent = task.category; taskContentWrapper.appendChild(pill);
                }
                const actionsDiv = document.createElement('div'); actionsDiv.classList.add('task-actions');
                const editButton = document.createElement('button'); editButton.classList.add('edit-task-button'); editButton.textContent = 'Edit';
                editButton.dataset.originalDate = definitionDate; editButton.dataset.taskIndex = taskIndex;
                editButton.dataset.isRecurringInstance = task.isRecurringInstance; editButton.dataset.currentDate = task.date;
                editButton.addEventListener('click', (e) => {
                    const od = e.target.dataset.originalDate; const ti = parseInt(e.target.dataset.taskIndex);
                    if (od && !isNaN(ti) && tasks[od]?.[ti]) {
                        openEditTaskModal(e.target.dataset.currentDate, od, ti, tasks[od][ti], e.target.dataset.isRecurringInstance === 'true');
                    } else { showToast('Could not load task for editing.', 'error'); }
                });
                const deleteButton = document.createElement('button'); deleteButton.classList.add('delete-task-button'); deleteButton.textContent = 'Delete';
                deleteButton.dataset.originalDate = definitionDate; deleteButton.dataset.taskIndex = taskIndex;
                deleteButton.dataset.isRecurringInstance = task.isRecurringInstance; deleteButton.dataset.currentDate = task.date;
                deleteButton.addEventListener('click', async (e) => {
                    const od = e.target.dataset.originalDate; const ti = parseInt(e.target.dataset.taskIndex);
                    const isRecurring = e.target.dataset.isRecurringInstance === 'true';
                    const occDate = e.target.dataset.currentDate;
                    const isActuallyRecurring = tasks[od]?.[ti]?.recurrence !== 'none';
                    if (isActuallyRecurring && isRecurring) {
                        const ok = await showConfirm(`Delete only occurrence on ${formatDateDisplay(occDate)}?`, 'Delete Occurrence');
                        if (ok) { deleteTask(od, ti, true, occDate); showToast('Occurrence deleted.', 'info'); }
                        else {
                            const okAll = await showConfirm(`Delete ENTIRE SERIES starting ${tasks[od][ti].originalDate}?`, 'Delete All');
                            if (okAll) { deleteTask(od, ti, false, null); showToast('Series deleted.', 'info'); }
                        }
                    } else {
                        const ok = await showConfirm('Delete this task? Cannot be undone.', 'Delete');
                        if (ok) { deleteTask(od, ti, false, null); showToast('Task deleted.', 'info'); }
                    }
                });
                actionsDiv.appendChild(editButton); actionsDiv.appendChild(deleteButton);
                taskItem.appendChild(checkbox); taskItem.appendChild(taskContentWrapper); taskItem.appendChild(actionsDiv);
                taskList.appendChild(taskItem);
            });
            dateGroup.appendChild(taskList); monthTaskListContainer.appendChild(dateGroup);
        });
    }

    function rerenderViews(_dateString = null) {
        const currentViewYear = currentDate.getFullYear(); const currentViewMonth = currentDate.getMonth();
        renderCalendar(); renderMonthTasksView(); updateStatsBar();
        if (taskModal.classList.contains('is-open')) {
            const modalDateStr = modalDateInput.value;
            if (modalDateStr) {
                const modalDateObj = getUTCDateFromString(modalDateStr);
                if (modalDateObj && modalDateObj.getUTCFullYear() === currentViewYear && modalDateObj.getUTCMonth() === currentViewMonth) {
                    renderModalTasks(modalDateStr);
                } else if (!modalDateObj) { closeTaskModal(); }
            }
        }
    }

    // --- Modal Handling ---
    function openTaskModal(dateString) {
        modalTitleHeader.textContent = `Tasks for: ${formatDateDisplay(dateString)}`;
        modalDateInput.value = dateString;
        isHolidayCheckbox.checked = !!holidays[dateString];
        renderModalTasks(dateString);
        populateCategorySelects();
        taskModal.classList.add('is-open');
        addTaskForm.reset();
        newTaskCategorySelect.value = 'General';
        newTaskPrioritySelect.value = 'medium';
        newTaskRecurrenceSelect.value = 'none';
        newTaskDescriptionInput.focus();
    }
    function openEditTaskModal(currentInstanceDate, originalDefDate, taskIndex, taskObject, isRecurringInstance) {
        if (!taskObject) { showToast('Error: Cannot load task data for editing.', 'error'); return; }
        editTaskModalTitle.textContent = `Edit Task on ${formatDateDisplay(currentInstanceDate)}`;
        editTaskDescriptionInput.value = taskObject.description || '';
        editTaskNotesInput.value = taskObject.notes || '';
        editTaskTimeInput.value = taskObject.time || '';
        populateCategorySelects();
        editTaskCategorySelect.value = taskObject.category || 'General';
        editTaskPrioritySelect.value = taskObject.priority || 'medium';
        editTaskRecurrenceSelect.value = taskObject.recurrence || 'none';
        editTaskCompletedSelect.value = taskObject.completed ? 'true' : 'false';
        editModalDateInput.value = originalDefDate;
        editModalTaskIndexInput.value = taskIndex;
        editModalIsRecurringInstance.value = isRecurringInstance ? 'true' : 'false';
        editModalInstanceDateInput.value = currentInstanceDate;
        const isActuallyRecurring = taskObject.recurrence && taskObject.recurrence !== 'none';
        confirmDeleteRecurringTaskButton.style.display = isActuallyRecurring && isRecurringInstance ? 'inline-block' : 'none';
        confirmDeleteAllRecurringTaskButton.style.display = isActuallyRecurring ? 'inline-block' : 'none';
        confirmDeleteTaskButton.style.display = !isActuallyRecurring ? 'inline-block' : 'none';
        editTaskModal.classList.add('is-open');
        editTaskDescriptionInput.focus();
    }
    function closeTaskModal() { taskModal.classList.remove('is-open'); }
    function closeEditModal() { editTaskModal.classList.remove('is-open'); }

    // --- Event Handlers ---
    addTaskForm.addEventListener('submit', (e) => { e.preventDefault(); handleAddNewTask(); });
    function handleAddNewTask() {
        const description = newTaskDescriptionInput.value.trim();
        const notes = newTaskNotesInput.value.trim();
        const time = newTaskTimeInput.value;
        let category = newTaskCategorySelect.value;
        const newCategory = addNewCategoryInput.value.trim();
        const priority = newTaskPrioritySelect.value;
        const recurrence = newTaskRecurrenceSelect.value;
        const date = modalDateInput.value;
        if (!description) { showToast('Please enter a task description.', 'warning'); return; }
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { showToast('Invalid date selected.', 'error'); return; }
        if (newCategory) {
            category = newCategory;
            if (!categories.includes(category)) {
                categories.push(category);
                getCategoryColor(category); // assign color immediately
                saveData(); populateCategorySelects(); populateFilterCategorySelect();
                renderManageCategories();
            }
        }
        const newTask = { id: generateTaskId(date), description, notes, category: category || 'General', completed: false, time, priority, recurrence, originalDate: date, exceptions: [] };
        addTask(newTask);
        addTaskForm.reset();
        newTaskCategorySelect.value = 'General'; newTaskPrioritySelect.value = 'medium';
        newTaskRecurrenceSelect.value = 'none'; newTaskDescriptionInput.focus();
        renderModalTasks(date);
        showToast('Task added!', 'success');
    }
    confirmSaveTaskButton.addEventListener('click', () => {
        const description = editTaskDescriptionInput.value.trim();
        const notes = editTaskNotesInput.value.trim();
        const time = editTaskTimeInput.value;
        const category = editTaskCategorySelect.value;
        const priority = editTaskPrioritySelect.value;
        const recurrence = editTaskRecurrenceSelect.value;
        const completed = editTaskCompletedSelect.value === 'true';
        const originalDefDate = editModalDateInput.value;
        const taskIndex = parseInt(editModalTaskIndexInput.value);
        const isRecurringInstance = editModalIsRecurringInstance.value === 'true';
        const instanceDate = editModalInstanceDateInput.value || null;
        if (!description || !originalDefDate || isNaN(taskIndex)) { showToast('Could not save: invalid data.', 'error'); return; }
        const updatedTaskData = { description, notes, time, category, priority, recurrence, completed };
        updateTask(originalDefDate, taskIndex, updatedTaskData, isRecurringInstance, instanceDate);
        closeEditModal();
        showToast('Task saved!', 'success');
    });
    confirmDeleteTaskButton.addEventListener('click', async () => {
        const originalDefDate = editModalDateInput.value;
        const taskIndex = parseInt(editModalTaskIndexInput.value);
        const taskToDelete = tasks[originalDefDate]?.[taskIndex];
        const msg = taskToDelete?.recurrence !== 'none'
            ? `Delete entire recurring series starting ${taskToDelete.originalDate}? Cannot be undone.`
            : 'Delete this task? Cannot be undone.';
        const ok = await showConfirm(msg, 'Delete');
        if (ok) { deleteTask(originalDefDate, taskIndex, false, null); closeEditModal(); showToast('Task deleted.', 'info'); }
    });
    confirmDeleteRecurringTaskButton.addEventListener('click', async () => {
        const originalDefDate = editModalDateInput.value;
        const taskIndex = parseInt(editModalTaskIndexInput.value);
        const instanceDateForDelete = editModalInstanceDateInput.value;
        if (!instanceDateForDelete) { showToast('Error: Could not determine occurrence date.', 'error'); return; }
        const ok = await showConfirm(`Delete only occurrence on ${formatDateDisplay(instanceDateForDelete)}?`, 'Delete Occurrence');
        if (ok) { deleteTask(originalDefDate, taskIndex, true, instanceDateForDelete); closeEditModal(); showToast('Occurrence deleted.', 'info'); }
    });
    confirmDeleteAllRecurringTaskButton.addEventListener('click', async () => {
        const originalDefDate = editModalDateInput.value;
        const taskIndex = parseInt(editModalTaskIndexInput.value);
        const taskToDelete = tasks[originalDefDate]?.[taskIndex];
        const ok = await showConfirm(`Delete entire recurring series starting ${taskToDelete?.originalDate}? Cannot be undone.`, 'Delete All');
        if (ok) { deleteTask(originalDefDate, taskIndex, false, null); closeEditModal(); showToast('Series deleted.', 'info'); }
    });
    prevMonthButton.addEventListener('click', () => navigateMonth(-1));
    nextMonthButton.addEventListener('click', () => navigateMonth(1));
    prevYearButton.addEventListener('click', () => navigateYear(-1));
    nextYearButton.addEventListener('click', () => navigateYear(1));
    todayButton.addEventListener('click', () => { currentDate = new Date(); rerenderViews(); });
    darkModeToggle.addEventListener('click', toggleMode);
    downloadTasksButton.addEventListener('click', downloadTasks);
    importTasksButton.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importTasks);
    downloadWordReportButton.addEventListener('click', downloadWordReport);
    toggleMonthViewButton.addEventListener('click', toggleMonthView);
    closeButton.addEventListener('click', closeTaskModal);
    closeEditModalButton.addEventListener('click', closeEditModal);
    closeMonthViewButton.addEventListener('click', () => toggleMonthView(false));
    globalThis.addEventListener('click', (event) => {
        if (event.target === taskModal) closeTaskModal();
        if (event.target === editTaskModal) closeEditModal();
    });
    manageCategoriesButton.addEventListener('click', (e) => {
        e.stopPropagation();
        manageCategoriesPanel.classList.toggle('open');
        sheetsSettingsPanel.classList.remove('open');
        if (manageCategoriesPanel.classList.contains('open')) renderManageCategories();
    });
    document.addEventListener('click', (e) => {
        if (!manageCategoriesPanel.contains(e.target) && e.target !== manageCategoriesButton) {
            manageCategoriesPanel.classList.remove('open');
        }
    });

    // Google Sheets integration listeners
    sheetsSettingsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        sheetsSettingsPanel.classList.toggle('open');
        manageCategoriesPanel.classList.remove('open');
    });

    sheetsConnectBtn.addEventListener('click', async () => {
        const url = sheetsWebhookUrlInput.value.trim();
        if (!url) {
            showToast('Please enter a valid Google Apps Script Web App URL.', 'warning');
            return;
        }
        googleSheetsUrl = url;
        saveData();
        showToast('Connecting to Google Sheets...', 'info');
        await fetchFromGoogleSheets();
    });

    sheetsPushBtn.addEventListener('click', async () => {
        showToast('Pushing data to Google Sheets...', 'info');
        await pushToGoogleSheets();
        showToast('Data successfully pushed!', 'success');
    });

    sheetsPullBtn.addEventListener('click', async () => {
        showToast('Pulling data from Google Sheets...', 'info');
        await fetchFromGoogleSheets();
    });

    sheetsDisconnectBtn.addEventListener('click', async () => {
        const ok = await showConfirm('Disconnect from Google Sheets? Local backup copy will be kept.', 'Disconnect');
        if (ok) {
            googleSheetsUrl = '';
            sheetsWebhookUrlInput.value = '';
            saveData();
            updateSyncStatus('local');
            showToast('Disconnected from Google Sheets.', 'info');
        }
    });

    document.addEventListener('click', (e) => {
        if (!sheetsSettingsPanel.contains(e.target) && e.target !== sheetsSettingsButton) {
            sheetsSettingsPanel.classList.remove('open');
        }
    });
    isHolidayCheckbox.addEventListener('change', () => {
        const dateString = modalDateInput.value; if (!dateString) return;
        if (isHolidayCheckbox.checked) holidays[dateString] = true; else delete holidays[dateString];
        saveData(); renderCalendar();
    });
    searchInput.addEventListener('input', (e) => { currentSearchTerm = e.target.value.toLowerCase(); rerenderViews(); });
    filterCategorySelect.addEventListener('change', (e) => { currentFilterCategory = e.target.value; rerenderViews(); });
    filterCompletionSelect.addEventListener('change', (e) => { currentFilterCompletion = e.target.value; rerenderViews(); });
    hideCompletedToggle.addEventListener('click', () => {
        hideCompleted = !hideCompleted;
        hideCompletedToggle.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed';
        hideCompletedToggle.setAttribute('aria-pressed', hideCompleted);
        localStorage.setItem('hideCompleted', hideCompleted);
        rerenderViews();
    });


    // --- Report Generation ---
    function generateMonthlyReportHTML() {
        const year = currentDate.getFullYear(); const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('default', { month: 'long' }); const daysInMonth = new Date(year, month + 1, 0).getDate();
        let htmlContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Monthly Task Report - ${monthName} ${year}</title><style>body{font-family:sans-serif;line-height:1.4;font-size:10pt;}h1,h2,h3{margin-bottom:0.5em;color:#333;}h1{font-size:16pt;text-align:center;margin-bottom:1em;}h2{font-size:14pt;}h3{font-size:12pt;margin-top:1.5em;border-bottom:1px solid #ccc;padding-bottom:0.2em;}ul{list-style:none;padding-left:0;margin-top:0.5em;}li{margin-bottom:0.4em;padding-left:1em;text-indent:-1em;border-bottom:1px dotted #eee;padding-bottom:0.3em;}li:last-child{border-bottom:none;}li.completed{text-decoration:line-through;color:#888;}li.completed .details{color:#999;}strong{font-weight:bold;}.priority-high{color:#C00;}.priority-medium{color:#F80;}.priority-low{color:#777;}.details{font-size:9pt;color:#555;margin-left:8px;}</style></head><body><h1>Monthly Task Report</h1><h2>${monthName} ${year}</h2>`;
        let tasksFound = false;
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDayLocalDate = new Date(year, month, i); const dateString = formatDate(currentDayLocalDate);
            const tasksForDay = getTasksForDate(dateString);
            if (tasksForDay.length > 0) {
                tasksFound = true; htmlContent += `<h3>${formatDateDisplay(dateString)}</h3><ul>`;
                tasksForDay.forEach(task => {
                    const completed = task.completed; const time = task.time ? `<strong>${task.time}</strong> - ` : '';
                    const description = task.description || '(No description)'; const priorityClass = `priority-${task.priority || 'medium'}`;
                    const priorityText = task.priority ? `(P: ${task.priority.charAt(0).toUpperCase()})` : '';
                    const category = task.category && task.category !== 'General' ? `[${task.category}]` : '';
                    const recurrence = task.recurrence && task.recurrence !== 'none' ? `(R)` : '';
                    htmlContent += `<li class="${completed ? 'completed' : ''}">${time}${description}<span class="details ${priorityClass}">${priorityText} ${category} ${recurrence}</span></li>`;
                });
                htmlContent += `</ul>`;
            }
        }
        if (!tasksFound) htmlContent += `<p>No tasks found for ${monthName} ${year} matching the current filters.</p>`;
        htmlContent += `</body></html>`; return htmlContent;
    }
    function downloadWordReport() {
        try {
            const year = currentDate.getFullYear(); const monthName = currentDate.toLocaleString('default', { month: 'long' });
            const filename = `Monthly_Report_${monthName}_${year}.doc`;
            const htmlContent = generateMonthlyReportHTML();
            const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
            if (globalThis.navigator && globalThis.navigator.msSaveOrOpenBlob) { globalThis.navigator.msSaveOrOpenBlob(blob, filename); }
            else { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); }
            showToast('Word report downloaded!', 'success');
        } catch (error) { console.error("Error generating or downloading Word report:", error); showToast("Could not download Word report. See console for details.", "error"); }
    }

    // --- Utility and Mode Functions ---
    function populateCategorySelects() {
        const currentNewTaskVal = newTaskCategorySelect.value; const currentEditTaskVal = editTaskCategorySelect.value;
        newTaskCategorySelect.innerHTML = ''; editTaskCategorySelect.innerHTML = '';
        if (!categories.includes('General')) categories.unshift('General');
        else categories = ['General', ...categories.filter(c => c !== 'General')];
        categories.forEach(category => { const option = document.createElement('option'); option.value = category; option.textContent = category; newTaskCategorySelect.appendChild(option.cloneNode(true)); editTaskCategorySelect.appendChild(option.cloneNode(true)); });
        newTaskCategorySelect.value = categories.includes(currentNewTaskVal) ? currentNewTaskVal : 'General';
        editTaskCategorySelect.value = categories.includes(currentEditTaskVal) ? currentEditTaskVal : 'General';
    }
    function populateFilterCategorySelect() {
        const currentFilterVal = filterCategorySelect.value; filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => { const option = document.createElement('option'); option.value = category; option.textContent = category; filterCategorySelect.appendChild(option); });
        filterCategorySelect.value = categories.includes(currentFilterVal) || currentFilterVal === 'all' ? currentFilterVal : 'all';
    }
    function toggleMode() {
        body.classList.remove('light-mode', 'dark-mode', 'gray-mode');
        if (currentMode === 'light') { currentMode = 'dark'; body.classList.add('dark-mode'); darkModeToggle.textContent = 'Dark Mode'; }
        else if (currentMode === 'dark') { currentMode = 'gray'; body.classList.add('gray-mode'); darkModeToggle.textContent = 'Gray Mode'; }
        else { currentMode = 'light'; darkModeToggle.textContent = 'Light Mode'; } saveData();
    }
    function applySavedModePreference() {
        body.classList.remove('light-mode', 'dark-mode', 'gray-mode');
        if (currentMode === 'dark') { body.classList.add('dark-mode'); darkModeToggle.textContent = 'Dark Mode'; }
        else if (currentMode === 'gray') { body.classList.add('gray-mode'); darkModeToggle.textContent = 'Gray Mode'; }
        else { darkModeToggle.textContent = 'Light Mode'; }
    }
    function toggleMonthView(forceState = null) {
        isMonthViewVisible = typeof forceState === 'boolean' ? forceState : !isMonthViewVisible;
        monthTaskView.style.display = isMonthViewVisible ? 'block' : 'none';
        toggleMonthViewButton.textContent = isMonthViewVisible ? 'Hide Month Tasks' : 'Show Month Tasks';
        toggleMonthViewButton.setAttribute('aria-expanded', isMonthViewVisible); saveData();
    }
    function applySavedMonthViewPreference() {
        monthTaskView.style.display = isMonthViewVisible ? 'block' : 'none';
        toggleMonthViewButton.textContent = isMonthViewVisible ? 'Hide Month Tasks' : 'Show Month Tasks';
        toggleMonthViewButton.setAttribute('aria-expanded', isMonthViewVisible);
    }
    function applyHideCompletedPreference() {
        hideCompletedToggle.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed';
        hideCompletedToggle.setAttribute('aria-pressed', hideCompleted);
    }
    function downloadTasks() {
        try {
            const dataToSave = { tasks: tasks, holidays: holidays, categories: categories, mode: currentMode, monthViewVisible: isMonthViewVisible, hideCompleted: hideCompleted };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToSave, null, 2));
            const downloadAnchorNode = document.createElement('a'); downloadAnchorNode.setAttribute("href", dataStr);
            const dateStamp = new Date().toISOString().split('T')[0];
            downloadAnchorNode.setAttribute("download", `calendar_backup_${dateStamp}.json`);
            document.body.appendChild(downloadAnchorNode); downloadAnchorNode.click(); downloadAnchorNode.remove();
            showToast('JSON backup downloaded!', 'success');
        } catch (error) { console.error("Error downloading JSON tasks:", error); showToast("Could not download tasks JSON. See console for details.", "error"); }
    }

    // --- CORRECTED importTasks ---
    function importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (typeof importedData !== 'object' || importedData === null) {
                    throw new Error("Invalid file format: Root is not an object.");
                }

                const confirmImport = await showConfirm("Importing JSON will overwrite current tasks, holidays, and settings. Continue?", "Import Data");
                if (confirmImport) {
                    tasks = importedData.tasks || {};
                    holidays = importedData.holidays || {};
                    categories = importedData.categories || ['General', 'Work', 'Personal'];
                    currentMode = importedData.mode || 'light';
                    isMonthViewVisible = importedData.monthViewVisible || false;
                    hideCompleted = importedData.hideCompleted || false;

                    const validatedTasks = {};
                    Object.keys(tasks).forEach(date => {
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
                        if (!Array.isArray(tasks[date])) return;
                        validatedTasks[date] = tasks[date].map((task, index) => {
                             const defaultId = `${date}-${index}-${Date.now()}`;
                             if (typeof task === 'string') { return { id: defaultId, description: task, category: 'General', completed: false, time: '', priority: 'medium', recurrence: 'none', originalDate: date, exceptions: [] }; }
                             return { id: task?.id || defaultId, description: task?.description || '', category: task?.category || 'General', completed: task?.completed || false, time: task?.time || '', priority: task?.priority || 'medium', recurrence: task?.recurrence || 'none', originalDate: task?.originalDate || date, exceptions: Array.isArray(task?.exceptions) ? task.exceptions : [] };
                        }).filter(Boolean);
                    });
                    tasks = validatedTasks;

                    if (!categories.includes('General')) categories.unshift('General');

                    applySavedModePreference();
                    applySavedMonthViewPreference();
                    applyHideCompletedPreference();
                    populateCategorySelects();
                    populateFilterCategorySelect();
                    saveData();
                    rerenderViews();
                    showToast("Data imported successfully!", "success");
                }
            } catch (error) {
                console.error("Error importing tasks:", error);
                showToast(`Could not import tasks: ${error.message}`, "error");
            } finally {
                importFile.value = null;
            }
        };
        reader.onerror = function() {
            showToast("Error reading file.", "error");
            importFile.value = null;
        };
        reader.readAsText(file);
    }
    // --- End CORRECTED importTasks ---


    // --- Drag and Drop Handlers ---
    function addDragListenersToTasks() {
        const taskItems = calendarGrid.querySelectorAll('.task-list-preview li[draggable="true"]');
        taskItems.forEach(item => {
            item.removeEventListener('dragstart', handleDragStart); item.removeEventListener('dragend', handleDragEnd);
            item.addEventListener('dragstart', handleDragStart); item.addEventListener('dragend', handleDragEnd);
        });
    }
    function handleDragStart(e) {
        if (e.target.matches('.task-list-preview li[draggable="true"]')) {
            const taskId = e.target.dataset.taskId; const originalDate = e.target.dataset.originalDate;
            const taskIndexStr = e.target.dataset.taskIndex; const isRecurringInstance = e.target.dataset.isRecurringInstance === 'true';
            const currentDate = e.target.dataset.currentDate;
            if (!taskId || !originalDate || taskIndexStr === undefined || isNaN(parseInt(taskIndexStr))) { console.error("Missing data on dragged item:", e.target.dataset); e.preventDefault(); return; }
            draggedTaskData = { taskId: taskId, originalDate: originalDate, taskIndex: parseInt(taskIndexStr), isRecurringInstance: isRecurringInstance, currentDate: currentDate };
            e.dataTransfer.effectAllowed = 'move'; e.target.classList.add('dragging');
        } else { e.preventDefault(); }
    }
    function handleDragEnd(e) {
        if (e.target.matches('.task-list-preview li[draggable="true"]')) e.target.classList.remove('dragging');
        calendarGrid.querySelectorAll('.day.drag-over').forEach(d => d.classList.remove('drag-over'));
        draggedTaskData = null;
    }
    function handleDragOver(e) {
        e.preventDefault(); if (draggedTaskData) { e.dataTransfer.dropEffect = 'move'; const dayTarget = e.target.closest('.day:not(.empty)'); if (dayTarget) { calendarGrid.querySelectorAll('.day.drag-over').forEach(d => { if (d !== dayTarget) d.classList.remove('drag-over'); }); dayTarget.classList.add('drag-over'); } } else { e.dataTransfer.dropEffect = 'none'; }
    }
    function handleDragEnter(e) { if (draggedTaskData) { const dayTarget = e.target.closest('.day:not(.empty)'); if (dayTarget) dayTarget.classList.add('drag-over'); } }
    function handleDragLeave(e) { const dayTarget = e.target.closest('.day'); if (dayTarget && !dayTarget.contains(e.relatedTarget)) dayTarget.classList.remove('drag-over'); }
    async function handleDrop(e) {
        e.preventDefault(); const dropTargetDay = e.target.closest('.day:not(.empty)');
        if (dropTargetDay) dropTargetDay.classList.remove('drag-over');
        calendarGrid.querySelectorAll('.day.drag-over').forEach(d => d.classList.remove('drag-over'));
        if (dropTargetDay && draggedTaskData) {
            const targetDate = dropTargetDay.dataset.date;
            if (targetDate === draggedTaskData.currentDate) { draggedTaskData = null; return; }
            const { taskId, originalDate: definitionDate, taskIndex, currentDate: sourceDate } = draggedTaskData;
            const taskToMove = tasks[definitionDate]?.[taskIndex];
            if (!taskToMove) { console.error("Cannot find task definition to move:", draggedTaskData); showToast("Error: Could not find the task data to move.", "error"); draggedTaskData = null; return; }
            const isTaskDefinitionRecurring = taskToMove.recurrence && taskToMove.recurrence !== 'none';
            if (isTaskDefinitionRecurring) {
                const moveOnlySingle = await showConfirm(`Move only occurrence from ${formatDateDisplay(sourceDate)} to ${formatDateDisplay(targetDate)}? (Cancel to move the entire series)`, 'Move Occurrence');
                if (moveOnlySingle) {
                    console.log(`Moving single instance of ${taskId} from ${sourceDate} to ${targetDate}`);
                    if (!Array.isArray(taskToMove.exceptions)) taskToMove.exceptions = [];
                    if(!taskToMove.exceptions.includes(sourceDate)) taskToMove.exceptions.push(sourceDate);
                    const newSingleTask = { ...taskToMove, id: generateTaskId(targetDate), originalDate: targetDate, recurrence: 'none', exceptions: [], /* completed: false, */ };
                    addTask(newSingleTask);
                    showToast('Occurrence moved!', 'success');
                } else {
                    const moveAll = await showConfirm(`MOVE ENTIRE SERIES starting ${formatDateDisplay(targetDate)}? This will adjust all occurrences.`, 'Move Series');
                    if (moveAll) {
                        console.log(`Moving entire series ${taskId} to start on ${targetDate}`);
                        taskToMove.originalDate = targetDate; taskToMove.exceptions = [];
                        if (definitionDate !== targetDate) {
                            const taskDefinition = tasks[definitionDate].splice(taskIndex, 1)[0];
                            if (tasks[definitionDate].length === 0) delete tasks[definitionDate];
                            if (!tasks[targetDate]) tasks[targetDate] = [];
                            tasks[targetDate].push(taskDefinition); console.log(`Definition moved from key ${definitionDate} to ${targetDate}`);
                        } else { console.log(`Definition originalDate updated to ${targetDate}, key remains the same.`); }
                        showToast('Entire series moved!', 'success');
                    } else { draggedTaskData = null; return; }
                }
            } else {
                console.log(`Moving non-recurring task ${taskId} from ${definitionDate} to ${targetDate}`);
                const taskDefinition = tasks[definitionDate].splice(taskIndex, 1)[0];
                if (tasks[definitionDate].length === 0) delete tasks[definitionDate];
                taskDefinition.originalDate = targetDate;
                if (!tasks[targetDate]) tasks[targetDate] = [];
                tasks[targetDate].push(taskDefinition);
                showToast('Task moved!', 'success');
            }
            saveData(); rerenderViews();
        } else { console.log("Drop occurred on invalid target or no valid task data."); }
        draggedTaskData = null;
    }

    // --- Nav Helpers ---
    function navigateMonth(delta) { currentDate.setMonth(currentDate.getMonth() + delta); rerenderViews(); }
    function navigateYear(delta) { currentDate.setFullYear(currentDate.getFullYear() + delta); rerenderViews(); }

    // --- PWA Service Worker & Installation Promoters ---
    if ('serviceWorker' in navigator) {
        globalThis.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('[PWA] Service Worker registered successfully:', reg.scope))
                .catch(err => console.error('[PWA] Service Worker registration failed:', err));
        });
    }

    globalThis.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installAppBtn) installAppBtn.style.display = 'inline-block';
    });

    if (installAppBtn) {
        installAppBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`[PWA] User choice outcome: ${outcome}`);
            deferredPrompt = null;
            installAppBtn.style.display = 'none';
        });
    }

    globalThis.addEventListener('appinstalled', () => {
        console.log('[PWA] Calendar Task Scheduler installed successfully!');
        if (installAppBtn) installAppBtn.style.display = 'none';
        showToast('Application successfully installed!', 'success');
    });

}); // End DOMContentLoaded

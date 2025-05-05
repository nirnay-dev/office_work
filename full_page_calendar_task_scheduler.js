document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthButton = document.getElementById('prevMonth');
    const nextMonthButton = document.getElementById('nextMonth');
    const prevYearButton = document.getElementById('prevYear');
    const nextYearButton = document.getElementById('nextYear');
    const taskModal = document.getElementById('taskModal');
    const closeButton = taskModal.querySelector('.close-button');
    const modalTitleHeader = document.getElementById('modalTitle');
    const modalTaskList = document.getElementById('modalTaskList');
    const addTaskForm = document.getElementById('addTaskForm');
    const newTaskDescriptionInput = document.getElementById('newTaskDescription');
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
    const darkModeToggle = document.getElementById('darkModeToggle');
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

    // --- Initialization ---
    loadData(); // Load initial data ONCE
    applySavedModePreference();
    applySavedMonthViewPreference();
    applyHideCompletedPreference();
    populateCategorySelects();
    populateFilterCategorySelect();
    renderCalendar();
    renderMonthTasksView();

    // --- Load/Save Data ---
    function loadData() {
        const loadedTasks = JSON.parse(localStorage.getItem('calendarTasks')) || {};
        const loadedHolidays = JSON.parse(localStorage.getItem('calendarHolidays')) || {};
        const loadedCategories = JSON.parse(localStorage.getItem('calendarCategories')) || ['General', 'Work', 'Personal'];
        const loadedMode = localStorage.getItem('calendarMode') || 'light';
        const loadedMonthView = localStorage.getItem('monthViewVisible') === 'true';
        const loadedHideCompleted = localStorage.getItem('hideCompleted') === 'true';

        // --- Migration/Validation Logic ---
        const validatedTasks = {};
        Object.keys(loadedTasks).forEach(date => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                console.warn(`Skipping invalid date key during load: ${date}`);
                return;
            }
            if (!Array.isArray(loadedTasks[date])) {
                console.warn(`Skipping invalid task array for date ${date}`);
                return;
            }
            validatedTasks[date] = loadedTasks[date].map((task, index) => {
                const defaultId = `${date}-${index}-${Date.now()}`;
                if (typeof task === 'string') {
                    return {
                        id: defaultId, description: task, category: 'General', completed: false, time: '',
                        priority: 'medium', recurrence: 'none', originalDate: date, exceptions: [],
                    };
                }
                return {
                    id: task?.id || defaultId,
                    description: task?.description || '',
                    category: task?.category || 'General',
                    completed: task?.completed || false,
                    time: task?.time || '',
                    priority: task?.priority || 'medium',
                    recurrence: task?.recurrence || 'none',
                    originalDate: task?.originalDate || date,
                    exceptions: Array.isArray(task?.exceptions) ? task.exceptions : [],
                };
            }).filter(task => task !== null); // Filter out any potential nulls from errors
        });
        tasks = validatedTasks;
        // --- End Migration ---

        holidays = typeof loadedHolidays === 'object' && loadedHolidays !== null ? loadedHolidays : {};
        categories = Array.isArray(loadedCategories) ? loadedCategories : ['General', 'Work', 'Personal'];
        currentMode = loadedMode || 'light';
        isMonthViewVisible = loadedMonthView === true;
        hideCompleted = loadedHideCompleted === true;

         // Ensure General category exists after load/migration
         if (!categories.includes('General')) {
             categories.unshift('General');
         }
    }

    function saveData() {
        localStorage.setItem('calendarTasks', JSON.stringify(tasks));
        localStorage.setItem('calendarHolidays', JSON.stringify(holidays));
        localStorage.setItem('calendarCategories', JSON.stringify(categories));
        localStorage.setItem('calendarMode', currentMode);
        localStorage.setItem('monthViewVisible', isMonthViewVisible);
        localStorage.setItem('hideCompleted', hideCompleted);
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
             alert("Error: Could not find task to update.");
             return;
         }

        const taskToUpdate = tasks[originalDate][taskIndex];
        let dateToRerender = [originalDate];

        if (isRecurringInstance && instanceDate && taskToUpdate.recurrence !== 'none') {
             console.log(`Updating series definition for recurring task: ${taskToUpdate.id} based on instance edit.`);
             Object.assign(taskToUpdate, updatedTaskData);
             if (updatedTaskData.originalDate && updatedTaskData.originalDate !== originalDate) {
                  alert("Changing the start date of a recurring series is not fully supported via instance edit.");
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
                      alert("Error: Invalid date format for moving task.");
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
             alert("Error: Could not find task to delete.");
             return;
         }

        const taskToDelete = tasks[originalDate][taskIndex];
        let datesToRerender = [originalDate];

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
        let tasksOnDate = [];
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
        modalTaskList.innerHTML = ''; const tasksForDate = getTasksForDate(dateString);
        if (tasksForDate.length === 0) { modalTaskList.innerHTML = '<li>No tasks for this date (matching filters).</li>'; return; }
        tasksForDate.forEach((task) => {
            if (!task) return; const listItem = document.createElement('li'); listItem.classList.add('modal-task-item');
            if (task.completed) listItem.classList.add('completed');
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', `Mark task ${task.description || ''} as complete`); checkbox.dataset.taskId = task.id;
            const definitionDate = task.keyDate || task.originalDate; checkbox.dataset.originalDate = definitionDate;
            checkbox.dataset.taskIndex = findTaskIndex(task.id, definitionDate); checkbox.dataset.isRecurringInstance = task.isRecurringInstance;
            checkbox.dataset.currentDate = task.date;
            checkbox.addEventListener('change', (e) => {
                const target = e.target; const originalDefDate = target.dataset.originalDate; const taskIdx = parseInt(target.dataset.taskIndex);
                if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx] !== undefined) {
                    tasks[originalDefDate][taskIdx].completed = target.checked; saveData();
                    renderModalTasks(dateString); rerenderViews(dateString);
                } else { console.error("Task not found for completion toggle:", originalDefDate, taskIdx); alert("Error toggling task completion."); rerenderViews(dateString); }
            });
            const taskContentWrapper = document.createElement('div'); taskContentWrapper.classList.add('task-content-wrapper');
            const priorityIcon = document.createElement('span'); priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
            priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);
            const taskText = document.createElement('span'); taskText.classList.add('task-text'); taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`;
            if (task.completed) taskText.classList.add('completed');
            taskContentWrapper.appendChild(priorityIcon); taskContentWrapper.appendChild(taskText);
            if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                const recurrenceIcon = document.createElement('span'); recurrenceIcon.classList.add('recurrence-icon');
                recurrenceIcon.textContent = '↻'; recurrenceIcon.title = `Recurring: ${task.recurrence}`; taskContentWrapper.appendChild(recurrenceIcon);
            }
            if (task.category && task.category !== 'General') {
                const categorySpan = document.createElement('span'); categorySpan.classList.add('category-span');
                categorySpan.textContent = `[${task.category}]`; taskContentWrapper.appendChild(categorySpan);
            }
            const actionsDiv = document.createElement('div'); actionsDiv.classList.add('modal-task-actions');
            const editButton = document.createElement('button'); editButton.classList.add('edit-task-button'); editButton.textContent = 'Edit';
            const definitionDateForEdit = task.keyDate || task.originalDate; const taskIndexForEdit = findTaskIndex(task.id, definitionDateForEdit);
            editButton.dataset.taskId = task.id; editButton.dataset.originalDate = definitionDateForEdit; editButton.dataset.taskIndex = taskIndexForEdit;
            editButton.dataset.isRecurringInstance = task.isRecurringInstance; editButton.dataset.currentDate = task.date;
            editButton.setAttribute('aria-label', `Edit task: ${task.description || ''}`);
            editButton.addEventListener('click', (e) => {
                const target = e.target; const originalDefDate = target.dataset.originalDate; const taskIdx = parseInt(target.dataset.taskIndex);
                if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx]) {
                    const taskToEdit = tasks[originalDefDate][taskIdx];
                    openEditTaskModal(target.dataset.currentDate, originalDefDate, taskIdx, taskToEdit, target.dataset.isRecurringInstance === 'true');
                } else { console.error("Could not find task data to edit:", target.dataset); alert("Error: Could not load task data for editing."); }
            });
            const deleteButton = document.createElement('button'); deleteButton.classList.add('delete-task-button'); deleteButton.textContent = 'Delete';
            const definitionDateForDelete = task.keyDate || task.originalDate; const taskIndexForDelete = findTaskIndex(task.id, definitionDateForDelete);
            deleteButton.dataset.taskId = task.id; deleteButton.dataset.originalDate = definitionDateForDelete; deleteButton.dataset.taskIndex = taskIndexForDelete;
            deleteButton.dataset.isRecurringInstance = task.isRecurringInstance; deleteButton.dataset.currentDate = task.date;
            deleteButton.setAttribute('aria-label', `Delete task: ${task.description || ''}`);
            deleteButton.addEventListener('click', (e) => {
                const target = e.target; const originalDefDate = target.dataset.originalDate; const taskIdx = parseInt(target.dataset.taskIndex);
                const isRecurring = target.dataset.isRecurringInstance === 'true'; const currentDate = target.dataset.currentDate;
                const isActuallyRecurringDefined = tasks[originalDefDate]?.[taskIdx]?.recurrence !== 'none';
                if (isActuallyRecurringDefined && isRecurring) {
                    if (confirm(`Delete only the occurrence on ${currentDate}? (Cancel to delete the entire series)`)) {
                        deleteTask(originalDefDate, taskIdx, true, currentDate);
                    } else { if (confirm(`DELETE ENTIRE SERIES starting ${tasks[originalDefDate][taskIdx].originalDate}? This action cannot be undone.`)) { deleteTask(originalDefDate, taskIdx, false, null); } }
                } else { if (confirm('Are you sure you want to delete this task?')) { deleteTask(originalDefDate, taskIdx, false, null); } }
            });
            actionsDiv.appendChild(editButton); actionsDiv.appendChild(deleteButton);
            listItem.appendChild(checkbox); listItem.appendChild(taskContentWrapper); listItem.appendChild(actionsDiv);
            modalTaskList.appendChild(listItem);
        });
    }
    function renderMonthTasksView() {
        monthTaskListContainer.innerHTML = ''; const year = currentDate.getFullYear(); const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('default', { month: 'long' }); monthTaskViewMonthYear.textContent = `${monthName} ${year}`;
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); let tasksFoundInMonth = false; let sortedTasksByDate = {};
        for (let day = 1; day <= lastDayOfMonth; day++) {
            const currentDayDate = new Date(year, month, day); const dateString = formatDate(currentDayDate);
            const tasksForThisDay = getTasksForDate(dateString);
            if (tasksForThisDay.length > 0) { tasksFoundInMonth = true; sortedTasksByDate[dateString] = tasksForThisDay; }
        }
        if (!tasksFoundInMonth) { monthTaskListContainer.innerHTML = '<p>No tasks scheduled for this month (matching filters).</p>'; return; }
        Object.keys(sortedTasksByDate).sort().forEach(dateString => {
            const tasksForDate = sortedTasksByDate[dateString]; const dateGroup = document.createElement('div');
            dateGroup.classList.add('task-date-group'); const dateHeader = document.createElement('div');
            dateHeader.classList.add('task-date'); dateHeader.textContent = formatDateDisplay(dateString); dateGroup.appendChild(dateHeader);
            const taskList = document.createElement('ul');
            tasksForDate.forEach((task) => {
                if (!task) return; const taskItem = document.createElement('li'); const checkbox = document.createElement('input');
                checkbox.type = 'checkbox'; checkbox.checked = task.completed; checkbox.setAttribute('aria-label', `Mark task ${task.description || ''} as complete`);
                const definitionDate = task.keyDate || task.originalDate; const taskIndex = findTaskIndex(task.id, definitionDate);
                checkbox.dataset.taskId = task.id; checkbox.dataset.originalDate = definitionDate; checkbox.dataset.taskIndex = taskIndex;
                checkbox.dataset.isRecurringInstance = task.isRecurringInstance; checkbox.dataset.currentDate = task.date;
                checkbox.addEventListener('change', (e) => {
                    const target = e.target; const originalDefDate = target.dataset.originalDate; const taskIdx = parseInt(target.dataset.taskIndex);
                    if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx] !== undefined) {
                        tasks[originalDefDate][taskIdx].completed = target.checked; saveData(); renderMonthTasksView(); renderCalendar();
                        if (taskModal.style.display === 'flex' && modalDateInput.value === task.date) renderModalTasks(task.date);
                    } else { console.error("Task not found for completion toggle (Month View):", originalDefDate, taskIdx); alert("Error toggling task completion."); renderMonthTasksView(); }
                });
                const taskContentWrapper = document.createElement('div'); taskContentWrapper.classList.add('task-content-wrapper');
                const priorityIcon = document.createElement('span'); priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
                priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);
                const taskText = document.createElement('span'); taskText.classList.add('task-text'); taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`;
                if (task.completed) taskText.classList.add('completed');
                taskContentWrapper.appendChild(priorityIcon); taskContentWrapper.appendChild(taskText);
                if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                    const recurrenceIcon = document.createElement('span'); recurrenceIcon.classList.add('recurrence-icon');
                    recurrenceIcon.textContent = '↻'; recurrenceIcon.title = `Recurring: ${task.recurrence}`; taskContentWrapper.appendChild(recurrenceIcon);
                }
                if (task.category && task.category !== 'General') {
                    const categorySpan = document.createElement('span'); categorySpan.classList.add('category-span');
                    categorySpan.textContent = `[${task.category}]`; taskContentWrapper.appendChild(categorySpan);
                }
                const actionsDiv = document.createElement('div'); actionsDiv.classList.add('task-actions');
                const editButton = document.createElement('button'); editButton.classList.add('edit-task-button'); editButton.textContent = 'Edit';
                editButton.dataset.taskId = task.id; editButton.dataset.originalDate = definitionDate; editButton.dataset.taskIndex = taskIndex;
                editButton.dataset.isRecurringInstance = task.isRecurringInstance; editButton.dataset.currentDate = task.date;
                editButton.setAttribute('aria-label', `Edit task: ${task.description || ''}`);
                editButton.addEventListener('click', (e) => {
                    const target = e.target; const originalDefDate = target.dataset.originalDate; const taskIdx = parseInt(target.dataset.taskIndex);
                    if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx]) {
                        const taskToEdit = tasks[originalDefDate][taskIdx];
                        openEditTaskModal(target.dataset.currentDate, originalDefDate, taskIdx, taskToEdit, target.dataset.isRecurringInstance === 'true');
                    } else { console.error("Could not find task data to edit (Month View):", target.dataset); alert("Error: Could not load task data for editing."); }
                });
                const deleteButton = document.createElement('button'); deleteButton.classList.add('delete-task-button'); deleteButton.textContent = 'Delete';
                deleteButton.dataset.taskId = task.id; deleteButton.dataset.originalDate = definitionDate; deleteButton.dataset.taskIndex = taskIndex;
                deleteButton.dataset.isRecurringInstance = task.isRecurringInstance; deleteButton.dataset.currentDate = task.date;
                deleteButton.setAttribute('aria-label', `Delete task: ${task.description || ''}`);
                deleteButton.addEventListener('click', (e) => {
                    const target = e.target; const originalDefDate = target.dataset.originalDate; const taskIdx = parseInt(target.dataset.taskIndex);
                    const isRecurring = target.dataset.isRecurringInstance === 'true'; const currentDate = target.dataset.currentDate;
                    const isActuallyRecurringDefined = tasks[originalDefDate]?.[taskIdx]?.recurrence !== 'none';
                    if (isActuallyRecurringDefined && isRecurring) {
                        if (confirm(`Delete only the occurrence on ${currentDate}? (Cancel to delete the entire series)`)) { deleteTask(originalDefDate, taskIdx, true, currentDate); }
                        else { if (confirm(`DELETE ENTIRE SERIES starting ${tasks[originalDefDate][taskIdx].originalDate}? This action cannot be undone.`)) { deleteTask(originalDefDate, taskIdx, false, null); } }
                    } else { if (confirm('Are you sure you want to delete this task?')) { deleteTask(originalDefDate, taskIdx, false, null); } }
                });
                actionsDiv.appendChild(editButton); actionsDiv.appendChild(deleteButton);
                taskItem.appendChild(checkbox); taskItem.appendChild(taskContentWrapper); taskItem.appendChild(actionsDiv);
                taskList.appendChild(taskItem);
            });
            dateGroup.appendChild(taskList); monthTaskListContainer.appendChild(dateGroup);
        });
    }
    function rerenderViews(dateString = null) {
        const currentViewYear = currentDate.getFullYear(); const currentViewMonth = currentDate.getMonth();
        renderCalendar(); renderMonthTasksView();
        if (taskModal.style.display === 'flex') {
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
        modalDateInput.value = dateString; isHolidayCheckbox.checked = !!holidays[dateString];
        renderModalTasks(dateString); populateCategorySelects(); taskModal.style.display = 'flex';
        addTaskForm.reset(); newTaskCategorySelect.value = 'General'; newTaskPrioritySelect.value = 'medium';
        newTaskRecurrenceSelect.value = 'none'; newTaskDescriptionInput.focus();
    }
    function openEditTaskModal(currentInstanceDate, originalDefDate, taskIndex, taskObject, isRecurringInstance) {
        if (!taskObject) { alert("Error: Cannot load task data for editing."); console.error("Task object is undefined in openEditTaskModal", currentInstanceDate, originalDefDate, taskIndex); return; }
        editTaskModalTitle.textContent = `Edit Task on ${formatDateDisplay(currentInstanceDate)}`;
        editTaskDescriptionInput.value = taskObject.description || ''; editTaskTimeInput.value = taskObject.time || '';
        populateCategorySelects(); editTaskCategorySelect.value = taskObject.category || 'General';
        editTaskPrioritySelect.value = taskObject.priority || 'medium'; editTaskRecurrenceSelect.value = taskObject.recurrence || 'none';
        editTaskCompletedSelect.value = taskObject.completed ? 'true' : 'false';
        editModalDateInput.value = originalDefDate; editModalTaskIndexInput.value = taskIndex;
        editModalIsRecurringInstance.value = isRecurringInstance ? 'true' : 'false';
        const isActuallyRecurring = taskObject.recurrence && taskObject.recurrence !== 'none';
        confirmDeleteRecurringTaskButton.style.display = isActuallyRecurring && isRecurringInstance ? 'inline-block' : 'none';
        confirmDeleteAllRecurringTaskButton.style.display = isActuallyRecurring ? 'inline-block' : 'none';
        confirmDeleteTaskButton.style.display = !isActuallyRecurring ? 'inline-block' : 'none';
        editTaskModal.style.display = 'flex'; editTaskDescriptionInput.focus();
    }
    function closeTaskModal() { taskModal.style.display = 'none'; }
    function closeEditModal() { editTaskModal.style.display = 'none'; }

    // --- Event Handlers ---
    addTaskForm.addEventListener('submit', (e) => { e.preventDefault(); handleAddNewTask(); });
    function handleAddNewTask() {
        const description = newTaskDescriptionInput.value.trim(); const time = newTaskTimeInput.value;
        let category = newTaskCategorySelect.value; const newCategory = addNewCategoryInput.value.trim();
        const priority = newTaskPrioritySelect.value; const recurrence = newTaskRecurrenceSelect.value;
        const date = modalDateInput.value;
        if (!description) { alert('Please enter a task description.'); return; }
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('Invalid date selected. Cannot add task.'); return; }
        if (newCategory) {
            category = newCategory;
            if (!categories.includes(category)) { categories.push(category); saveData(); populateCategorySelects(); populateFilterCategorySelect(); }
        }
        const newTask = { id: generateTaskId(date), description: description, category: category || 'General', completed: false, time: time, priority: priority, recurrence: recurrence, originalDate: date, exceptions: [] };
        addTask(newTask);
        addTaskForm.reset(); newTaskCategorySelect.value = 'General'; newTaskPrioritySelect.value = 'medium';
        newTaskRecurrenceSelect.value = 'none'; newTaskDescriptionInput.focus(); renderModalTasks(date);
    }
    confirmSaveTaskButton.addEventListener('click', () => {
        const description = editTaskDescriptionInput.value.trim(); const time = editTaskTimeInput.value;
        const category = editTaskCategorySelect.value; const priority = editTaskPrioritySelect.value;
        const recurrence = editTaskRecurrenceSelect.value; const completed = editTaskCompletedSelect.value === 'true';
        const originalDefDate = editModalDateInput.value; const taskIndex = parseInt(editModalTaskIndexInput.value);
        const isRecurringInstance = editModalIsRecurringInstance.value === 'true'; let instanceDate = null;
        if(originalDefDate && !isNaN(taskIndex) && tasks[originalDefDate] && tasks[originalDefDate][taskIndex]){ /* instanceDate = taskBeingEdited.date; */ }
        if (!description || !originalDefDate || isNaN(taskIndex)) { alert('Error: Could not save task. Invalid data.'); console.error("Invalid data for save:", description, originalDefDate, taskIndex); return; }
        const updatedTaskData = { description: description, time: time, category: category, priority: priority, recurrence: recurrence, completed: completed, };
        updateTask(originalDefDate, taskIndex, updatedTaskData, isRecurringInstance, instanceDate); closeEditModal();
    });
    confirmDeleteTaskButton.addEventListener('click', () => {
        const originalDefDate = editModalDateInput.value; const taskIndex = parseInt(editModalTaskIndexInput.value);
        const taskToDelete = tasks[originalDefDate]?.[taskIndex]; const isActuallyRecurring = taskToDelete && taskToDelete.recurrence !== 'none';
        const message = isActuallyRecurring ? `Are you sure you want to delete the entire recurring series starting ${taskToDelete.originalDate}? This cannot be undone.` : 'Are you sure you want to delete this task?';
        if (confirm(message)) { deleteTask(originalDefDate, taskIndex, false, null); closeEditModal(); }
    });
    confirmDeleteRecurringTaskButton.addEventListener('click', () => {
        const originalDefDate = editModalDateInput.value; const taskIndex = parseInt(editModalTaskIndexInput.value);
        const title = editTaskModalTitle.textContent; const dateMatch = title.match(/on\s+(.+)/); let instanceDateForDelete = null;
        if(dateMatch && dateMatch[1]){ try { const parsedDate = new Date(dateMatch[1]); if (!isNaN(parsedDate)) instanceDateForDelete = formatDate(parsedDate); else console.warn("Could not parse instance date from title for deletion:", dateMatch[1]); } catch (e) { console.error("Error parsing instance date from title:", e); } }
        if (!instanceDateForDelete) { alert("Error: Could not determine the specific date of this occurrence to delete."); console.error("Failed to get instanceDateForDelete", title); return; }
        if (confirm(`Delete only the task occurrence on ${formatDateDisplay(instanceDateForDelete)}?`)) { deleteTask(originalDefDate, taskIndex, true, instanceDateForDelete); closeEditModal(); }
    });
    confirmDeleteAllRecurringTaskButton.addEventListener('click', () => {
        const originalDefDate = editModalDateInput.value; const taskIndex = parseInt(editModalTaskIndexInput.value);
        const taskToDelete = tasks[originalDefDate]?.[taskIndex];
        if (confirm(`Are you sure you want to delete the entire recurring series starting ${taskToDelete?.originalDate}? This cannot be undone.`)) { deleteTask(originalDefDate, taskIndex, false, null); closeEditModal(); }
    });
    prevMonthButton.addEventListener('click', () => navigateMonth(-1)); nextMonthButton.addEventListener('click', () => navigateMonth(1));
    prevYearButton.addEventListener('click', () => navigateYear(-1)); nextYearButton.addEventListener('click', () => navigateYear(1));
    darkModeToggle.addEventListener('click', toggleMode); downloadTasksButton.addEventListener('click', downloadTasks);
    importTasksButton.addEventListener('click', () => importFile.click()); importFile.addEventListener('change', importTasks);
    downloadWordReportButton.addEventListener('click', downloadWordReport); toggleMonthViewButton.addEventListener('click', toggleMonthView);
    closeButton.addEventListener('click', closeTaskModal); closeEditModalButton.addEventListener('click', closeEditModal);
    closeMonthViewButton.addEventListener('click', () => toggleMonthView(false));
    window.addEventListener('click', (event) => { if (event.target === taskModal) closeTaskModal(); if (event.target === editTaskModal) closeEditModal(); });
    isHolidayCheckbox.addEventListener('change', () => {
        const dateString = modalDateInput.value; if (!dateString) return;
        if (isHolidayCheckbox.checked) holidays[dateString] = true; else delete holidays[dateString];
        saveData(); renderCalendar();
    });
    searchInput.addEventListener('input', (e) => { currentSearchTerm = e.target.value.toLowerCase(); rerenderViews(); });
    filterCategorySelect.addEventListener('change', (e) => { currentFilterCategory = e.target.value; rerenderViews(); });
    filterCompletionSelect.addEventListener('change', (e) => { currentFilterCompletion = e.target.value; rerenderViews(); });
    hideCompletedToggle.addEventListener('click', () => { hideCompleted = !hideCompleted; hideCompletedToggle.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed'; hideCompletedToggle.setAttribute('aria-pressed', hideCompleted); localStorage.setItem('hideCompleted', hideCompleted); rerenderViews(); });

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
            if (window.navigator && window.navigator.msSaveOrOpenBlob) { window.navigator.msSaveOrOpenBlob(blob, filename); }
            else { const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); }
        } catch (error) { console.error("Error generating or downloading Word report:", error); alert("Could not download Word report. See console for details."); }
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
        } catch (error) { console.error("Error downloading JSON tasks:", error); alert("Could not download tasks JSON. See console for details."); }
    }

    // --- CORRECTED importTasks ---
    function importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (typeof importedData !== 'object' || importedData === null) {
                    throw new Error("Invalid file format: Root is not an object.");
                }

                // Optional: Add more validation here if needed
                // e.g., check if importedData.tasks is an object, etc.

                if (confirm("Importing JSON will overwrite current tasks, holidays, and settings. Continue?")) {
                    // Directly assign imported data (with defaults) to state variables
                    tasks = importedData.tasks || {};
                    holidays = importedData.holidays || {};
                    categories = importedData.categories || ['General', 'Work', 'Personal'];
                    currentMode = importedData.mode || 'light';
                    isMonthViewVisible = importedData.monthViewVisible || false;
                    hideCompleted = importedData.hideCompleted || false;

                    // Run data through a validation/migration step similar to loadData
                    // This ensures consistency, especially if importing older formats
                    const validatedTasks = {};
                    Object.keys(tasks).forEach(date => {
                        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return; // Skip invalid keys
                        if (!Array.isArray(tasks[date])) return; // Skip non-arrays
                        validatedTasks[date] = tasks[date].map((task, index) => {
                             const defaultId = `${date}-${index}-${Date.now()}`;
                             if (typeof task === 'string') { /* ... old format ... */ return { id: defaultId, description: task, category: 'General', completed: false, time: '', priority: 'medium', recurrence: 'none', originalDate: date, exceptions: [] }; }
                             return { id: task?.id || defaultId, description: task?.description || '', category: task?.category || 'General', completed: task?.completed || false, time: task?.time || '', priority: task?.priority || 'medium', recurrence: task?.recurrence || 'none', originalDate: task?.originalDate || date, exceptions: Array.isArray(task?.exceptions) ? task.exceptions : [] };
                        }).filter(Boolean);
                    });
                    tasks = validatedTasks; // Assign validated tasks

                    // Ensure General category exists
                    if (!categories.includes('General')) categories.unshift('General');


                    // Apply settings and Save the NEW state
                    applySavedModePreference();
                    applySavedMonthViewPreference();
                    applyHideCompletedPreference();
                    populateCategorySelects();
                    populateFilterCategorySelect();
                    saveData(); // Save the newly assigned state
                    rerenderViews(); // Update UI fully
                    alert("Data imported successfully!");
                }
            } catch (error) {
                console.error("Error importing tasks:", error);
                alert(`Could not import tasks. Error: ${error.message}. Please ensure the file is a valid JSON backup.`);
            } finally {
                importFile.value = null; // Reset file input
            }
        };
        reader.onerror = function() {
            alert("Error reading file.");
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
    function handleDrop(e) {
        e.preventDefault(); const dropTargetDay = e.target.closest('.day:not(.empty)');
        if (dropTargetDay) dropTargetDay.classList.remove('drag-over');
        calendarGrid.querySelectorAll('.day.drag-over').forEach(d => d.classList.remove('drag-over'));
        if (dropTargetDay && draggedTaskData) {
            const targetDate = dropTargetDay.dataset.date;
            if (targetDate === draggedTaskData.currentDate) { draggedTaskData = null; return; }
            const { taskId, originalDate: definitionDate, taskIndex, isRecurringInstance, currentDate: sourceDate } = draggedTaskData;
            const taskToMove = tasks[definitionDate]?.[taskIndex];
            if (!taskToMove) { console.error("Cannot find task definition to move:", draggedTaskData); alert("Error: Could not find the task data to move."); draggedTaskData = null; return; }
            const isTaskDefinitionRecurring = taskToMove.recurrence && taskToMove.recurrence !== 'none';
            if (isTaskDefinitionRecurring) {
                if (confirm(`Move only the occurrence from ${formatDateDisplay(sourceDate)} to ${formatDateDisplay(targetDate)}? (Cancel to move the entire series starting from ${formatDateDisplay(targetDate)})`)) {
                    console.log(`Moving single instance of ${taskId} from ${sourceDate} to ${targetDate}`);
                    if (!Array.isArray(taskToMove.exceptions)) taskToMove.exceptions = [];
                    if(!taskToMove.exceptions.includes(sourceDate)) taskToMove.exceptions.push(sourceDate);
                    const newSingleTask = { ...taskToMove, id: generateTaskId(targetDate), originalDate: targetDate, recurrence: 'none', exceptions: [], /* completed: false, */ };
                    addTask(newSingleTask);
                } else {
                    if (confirm(`MOVE ENTIRE SERIES? The start date will change to ${formatDateDisplay(targetDate)} and all future occurrences will adjust. This cannot be easily undone.`)) {
                        console.log(`Moving entire series ${taskId} to start on ${targetDate}`);
                        taskToMove.originalDate = targetDate; taskToMove.exceptions = [];
                        if (definitionDate !== targetDate) {
                            const taskDefinition = tasks[definitionDate].splice(taskIndex, 1)[0];
                            if (tasks[definitionDate].length === 0) delete tasks[definitionDate];
                            if (!tasks[targetDate]) tasks[targetDate] = [];
                            tasks[targetDate].push(taskDefinition); console.log(`Definition moved from key ${definitionDate} to ${targetDate}`);
                        } else { console.log(`Definition originalDate updated to ${targetDate}, key remains the same.`); }
                    } else { draggedTaskData = null; return; }
                }
            } else {
                console.log(`Moving non-recurring task ${taskId} from ${definitionDate} to ${targetDate}`);
                const taskDefinition = tasks[definitionDate].splice(taskIndex, 1)[0];
                if (tasks[definitionDate].length === 0) delete tasks[definitionDate];
                taskDefinition.originalDate = targetDate;
                if (!tasks[targetDate]) tasks[targetDate] = [];
                tasks[targetDate].push(taskDefinition);
            }
            saveData(); rerenderViews();
        } else { console.log("Drop occurred on invalid target or no valid task data."); }
        draggedTaskData = null;
    }

    // --- Nav Helpers ---
    function navigateMonth(delta) { currentDate.setMonth(currentDate.getMonth() + delta); rerenderViews(); }
    function navigateYear(delta) { currentDate.setFullYear(currentDate.getFullYear() + delta); rerenderViews(); }

}); // End DOMContentLoaded

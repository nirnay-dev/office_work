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
    const addTaskForm = document.getElementById('addTaskForm'); // Get form
    const newTaskDescriptionInput = document.getElementById('newTaskDescription');
    const newTaskCategorySelect = document.getElementById('newTaskCategorySelect');
    const addNewCategoryInput = document.getElementById('addNewCategoryInput');
    const newTaskTimeInput = document.getElementById('newTaskTime');
    const newTaskPrioritySelect = document.getElementById('newTaskPriority'); // Priority select
    const newTaskRecurrenceSelect = document.getElementById('newTaskRecurrence'); // Recurrence select
    // const addNewTaskButton = document.getElementById('addNewTaskButton'); // Now handled by form submit
    const modalDateInput = document.getElementById('modalDate');
    const isHolidayCheckbox = document.getElementById('isHolidayCheckbox');

    // Edit Task Modal elements
    const editTaskModal = document.getElementById('editTaskModal');
    const closeEditModalButton = document.getElementById('closeEditModal');
    const editTaskDescriptionInput = document.getElementById('editTaskDescription');
    const editTaskCategorySelect = document.getElementById('editTaskCategorySelect');
    const editTaskTimeInput = document.getElementById('editTaskTime');
    const editTaskPrioritySelect = document.getElementById('editTaskPriority'); // Edit Priority
    const editTaskRecurrenceSelect = document.getElementById('editTaskRecurrence'); // Edit Recurrence
    const editTaskCompletedSelect = document.getElementById('editTaskCompleted'); // Edit Completion Status
    const confirmSaveTaskButton = document.getElementById('confirmSaveTaskButton');
    const confirmDeleteTaskButton = document.getElementById('confirmDeleteTaskButton');
    const confirmDeleteRecurringTaskButton = document.getElementById('confirmDeleteRecurringTaskButton'); // Delete single recurring instance
    const confirmDeleteAllRecurringTaskButton = document.getElementById('confirmDeleteAllRecurringTaskButton'); // Delete all recurring instances
    const editModalDateInput = document.getElementById('editModalDate');
    const editModalTaskIndexInput = document.getElementById('editModalTaskIndex');
    const editModalIsRecurringInstance = document.getElementById('editModalIsRecurringInstance'); // Flag for recurring instance edit

    // Mode, Download, Import, Month View
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    const downloadTasksButton = document.getElementById('downloadTasksButton');
    const importFile = document.getElementById('importFile');
    const importTasksButton = document.getElementById('importTasksButton');
    const downloadWordReportButton = document.getElementById('downloadWordReportButton'); // <<< NEW
    const monthTaskView = document.getElementById('monthTaskView');
    const toggleMonthViewButton = document.getElementById('toggleMonthViewButton');
    const monthTaskViewMonthYear = document.getElementById('monthTaskViewMonthYear');
    const monthTaskListContainer = document.getElementById('monthTaskListContainer');
    const closeMonthViewButton = document.getElementById('closeMonthView');

    // Search and Filter Elements
    const searchInput = document.getElementById('searchInput');
    const filterCategorySelect = document.getElementById('filterCategory');
    const filterCompletionSelect = document.getElementById('filterCompletion');
    const hideCompletedToggle = document.getElementById('hideCompletedToggle');

    // --- State Variables ---
    let currentDate = new Date(); // Represents the *month* being viewed (local time)
    let tasks = {}; // { "YYYY-MM-DD": [{id, description, category, completed, time, priority, recurrence, originalDate, exceptions: ["YYYY-MM-DD"] }, ...] }
    let holidays = {}; // { "YYYY-MM-DD": true }
    let categories = ['General', 'Work', 'Personal'];
    let currentMode = 'light';
    let isMonthViewVisible = false;
    let hideCompleted = false;
    let currentSearchTerm = '';
    let currentFilterCategory = 'all';
    let currentFilterCompletion = 'all';
    let draggedTaskData = null; // For drag and drop

    // --- Initialization ---
    loadData();
    applySavedModePreference();
    applySavedMonthViewPreference();
    applyHideCompletedPreference();
    populateCategorySelects();
    populateFilterCategorySelect(); // Populate filter dropdown
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

        // Basic validation/migration for task structure
        tasks = Object.keys(loadedTasks).reduce((acc, date) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { // Basic check for valid date string key
                console.warn(`Skipping invalid date key during load: ${date}`);
                return acc;
            }
            acc[date] = loadedTasks[date].map((task, index) => {
                const defaultId = `${date}-${index}-${Date.now()}`; // Generate default ID if needed
                if (typeof task === 'string') {
                    // Old format conversion
                    return {
                        id: defaultId,
                        description: task,
                        category: 'General',
                        completed: false,
                        time: '',
                        priority: 'medium',
                        recurrence: 'none',
                        originalDate: date,
                        exceptions: [],
                    };
                }
                // Ensure all new properties exist
                return {
                    id: task.id || defaultId,
                    description: task.description || '',
                    category: task.category || 'General',
                    completed: task.completed || false,
                    time: task.time || '',
                    priority: task.priority || 'medium',
                    recurrence: task.recurrence || 'none',
                    originalDate: task.originalDate || date,
                    exceptions: Array.isArray(task.exceptions) ? task.exceptions : [], // Ensure exceptions is an array
                };
            });
            return acc;
        }, {});


        holidays = loadedHolidays;
        categories = loadedCategories;
        currentMode = loadedMode;
        isMonthViewVisible = loadedMonthView;
        hideCompleted = loadedHideCompleted;
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
            return; // Prevent adding task with bad date
        }
        if (!tasks[date]) {
            tasks[date] = [];
        }
        tasks[date].push(taskData);
        saveData();
        rerenderViews(date);
    }

    function updateTask(originalDate, taskIndex, updatedTaskData, isRecurringInstance = false, instanceDate = null) {
         // Validate inputs
         if (!originalDate || !tasks[originalDate] || typeof taskIndex !== 'number' || !tasks[originalDate][taskIndex]) {
             console.error("Task not found for update:", originalDate, taskIndex);
             alert("Error: Could not find task to update.");
             return;
         }

        const taskToUpdate = tasks[originalDate][taskIndex];
        let dateToRerender = [originalDate]; // Start with original date

        if (isRecurringInstance && instanceDate && taskToUpdate.recurrence !== 'none') {
            // Option 1: Edit applies to series (current implementation)
             // Apply changes to the main task definition
             console.log(`Updating series definition for recurring task: ${taskToUpdate.id} based on instance edit.`);
             Object.assign(taskToUpdate, updatedTaskData);
             // If the original date itself was changed (not recommended for recurring), handle move
             if (updatedTaskData.originalDate && updatedTaskData.originalDate !== originalDate) {
                  // This is complex - requires moving the *definition*
                  alert("Changing the start date of a recurring series is not fully supported via instance edit.");
                  // Revert the originalDate change for now to prevent breaking things
                  updatedTaskData.originalDate = originalDate;
             }

             // Rerender the instance date as well
             if (instanceDate) dateToRerender.push(instanceDate);

        } else {
            // --- Update Non-Recurring or Original Task Definition ---
            const previousOriginalDate = taskToUpdate.originalDate; // Store before potential change

            Object.assign(taskToUpdate, updatedTaskData);

            // Handle if the originalDate property itself was changed (e.g., moving a non-recurring task)
            const newOriginalDate = taskToUpdate.originalDate;
            if (newOriginalDate && newOriginalDate !== originalDate) {
                 // Move the task definition in the `tasks` object
                 console.log(`Moving task ${taskToUpdate.id} from key ${originalDate} to ${newOriginalDate}`);
                 if (!/^\d{4}-\d{2}-\d{2}$/.test(newOriginalDate)) {
                      console.error("Invalid new original date during update:", newOriginalDate);
                      alert("Error: Invalid date format for moving task.");
                      taskToUpdate.originalDate = originalDate; // Revert change
                 } else {
                      if (!tasks[newOriginalDate]) {
                           tasks[newOriginalDate] = [];
                      }
                      // Push the updated task to the new date array
                      tasks[newOriginalDate].push(taskToUpdate);
                      // Remove from the old date array using the original index
                      tasks[originalDate].splice(taskIndex, 1);
                      if (tasks[originalDate].length === 0) {
                           delete tasks[originalDate]; // Clean up old key
                      }
                      dateToRerender.push(newOriginalDate); // Rerender new date too
                 }
            } else if (newOriginalDate && newOriginalDate !== previousOriginalDate && newOriginalDate === originalDate) {
                 // Case where originalDate property was changed but ended up being the same as the key
                 // This might happen if recurrence was changed, ensure the key matches the property
                 console.log(`Task ${taskToUpdate.id} originalDate property updated to match key ${originalDate}`);
                 // No move needed, just ensure consistency
            }
        }

        saveData();
        // Rerender all affected dates
        dateToRerender.forEach(d => rerenderViews(d));
    }

    function deleteTask(originalDate, taskIndex, isRecurringInstance = false, instanceDate = null) {
         // Validate inputs
         if (!originalDate || !tasks[originalDate] || typeof taskIndex !== 'number' || !tasks[originalDate][taskIndex]) {
             console.error("Task not found for deletion:", originalDate, taskIndex);
             alert("Error: Could not find task to delete.");
             return;
         }

        const taskToDelete = tasks[originalDate][taskIndex];
        let datesToRerender = [originalDate];

        if (isRecurringInstance && instanceDate && taskToDelete.recurrence !== 'none') {
            // --- Delete Single Instance ---
            // Add the specific instance date to the exceptions list
            if (!Array.isArray(taskToDelete.exceptions)) { // Ensure exceptions is an array
                taskToDelete.exceptions = [];
            }
            if (!taskToDelete.exceptions.includes(instanceDate)) { // Avoid duplicates
                 taskToDelete.exceptions.push(instanceDate);
                 console.log(`Added exception for task ${taskToDelete.id} on ${instanceDate}`);
                 datesToRerender.push(instanceDate); // Rerender the instance date
            } else {
                 console.log(`Exception already exists for task ${taskToDelete.id} on ${instanceDate}`);
            }
        } else {
            // --- Delete Original Task Definition (and thus all recurrences) ---
            console.log(`Deleting original task definition ${taskToDelete.id} from ${originalDate}`);
            tasks[originalDate].splice(taskIndex, 1);
            if (tasks[originalDate].length === 0) {
                delete tasks[originalDate];
            }
            // We might need to rerender other dates where this task *would* have appeared,
            // but simply rerendering the original date often suffices for UI update.
        }

        saveData();
        // Rerender affected dates
        datesToRerender.forEach(d => rerenderViews(d));
    }


    // --- Helper Functions ---

    function getUTCDateFromString(dateString) {
        if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            console.warn("Invalid date string passed to getUTCDateFromString:", dateString);
            return null;
        }
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
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        });
    }

    // --- Recurrence Logic ---

    function getTasksForDate(targetDateString) {
        const targetDate = getUTCDateFromString(targetDateString);
        if (!targetDate) {
             console.error("getTasksForDate called with invalid date string:", targetDateString);
             return [];
        }

        let tasksOnDate = [];

        // 1. Non-recurring tasks specifically for this date string
        if (tasks[targetDateString]) {
            tasksOnDate.push(...tasks[targetDateString]
                .filter(task => !task.recurrence || task.recurrence === 'none')
                .map((task, index) => ({
                    ...task,
                    date: targetDateString,
                    isRecurringInstance: false,
                    originalTaskIndex: index
                }))
            );
        }

        // 2. Recurring tasks calculation
        Object.keys(tasks).forEach(keyDateString => { // Iterate over keys where tasks are defined
            if (!tasks[keyDateString]) return;

            tasks[keyDateString].forEach((task, index) => {
                if (task.recurrence && task.recurrence !== 'none' && task.originalDate) {
                     // Ensure the task definition itself uses the correct key
                     if (keyDateString !== task.originalDate) {
                          // This indicates a potential inconsistency - task definition stored under wrong key
                          // console.warn(`Task ${task.id} has originalDate ${task.originalDate} but is stored under key ${keyDateString}`);
                          // We should still process based on its `originalDate` property
                     }

                    const originalTaskDate = getUTCDateFromString(task.originalDate);

                    if (!originalTaskDate || targetDate < originalTaskDate || (Array.isArray(task.exceptions) && task.exceptions.includes(targetDateString))) {
                        return;
                    }

                    let isMatch = false;
                    switch (task.recurrence) {
                        case 'daily':
                            isMatch = targetDate >= originalTaskDate;
                            break;
                        case 'weekly':
                            isMatch = targetDate >= originalTaskDate && targetDate.getUTCDay() === originalTaskDate.getUTCDay();
                            break;
                        case 'monthly':
                            isMatch = targetDate >= originalTaskDate && targetDate.getUTCDate() === originalTaskDate.getUTCDate();
                            break;
                    }

                    if (isMatch) {
                        const isFirstOccurrence = targetDateString === task.originalDate;
                        tasksOnDate.push({
                            ...task,
                            date: targetDateString,
                            isRecurringInstance: !isFirstOccurrence,
                             originalTaskIndex: index, // Index within the original definition array (keyDateString)
                             keyDate: keyDateString // Remember the key where the definition is stored
                        });
                    }
                }
            });
        });

        // Deduplicate (important if a task exists non-recurringly and as first recurring instance)
        const uniqueTasks = [];
        const seenKeys = new Set(); // Use task ID if available, else keyDate+index
        tasksOnDate.forEach(task => {
             const uniqueKey = task.id || `${task.keyDate || task.originalDate}-${task.originalTaskIndex}`; // Use keyDate if available from recurring calc
            if (!seenKeys.has(uniqueKey)) {
                uniqueTasks.push(task);
                seenKeys.add(uniqueKey);
            } else {
                 // If duplicate found, prefer the non-instance representation if available
                 const existingIndex = uniqueTasks.findIndex(t => (t.id || `${t.keyDate || t.originalDate}-${t.originalTaskIndex}`) === uniqueKey);
                 if (existingIndex > -1 && uniqueTasks[existingIndex].isRecurringInstance && !task.isRecurringInstance) {
                      uniqueTasks[existingIndex] = task; // Replace instance with original entry
                 }
            }
        });


        // Filter based on current global filters
        const filteredTasks = uniqueTasks.filter(task => {
            if (!task) return false;
            const descriptionMatch = !currentSearchTerm || (task.description && task.description.toLowerCase().includes(currentSearchTerm));
            const categoryMatch = currentFilterCategory === 'all' || task.category === currentFilterCategory;
            const completionMatch = currentFilterCompletion === 'all' ||
                                    (currentFilterCompletion === 'completed' && task.completed) ||
                                    (currentFilterCompletion === 'incomplete' && !task.completed);
            const hiddenMatch = !hideCompleted || !task.completed;

            return descriptionMatch && categoryMatch && completionMatch && hiddenMatch;
        });

        // Sort tasks
        filteredTasks.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2, null: 3, undefined: 3 };
            const priorityDiff = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
            if (priorityDiff !== 0) return priorityDiff;

            const timeA = a.time || '99:99';
            const timeB = b.time || '99:99';
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

        const todayLocalDate = new Date();
        todayLocalDate.setHours(0, 0, 0, 0);

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');

            const currentDayLocalDate = new Date(year, month, i);
            const dateString = formatDate(currentDayLocalDate); // YYYY-MM-DD for this local day

            dayCell.dataset.date = dateString;
            dayCell.setAttribute('role', 'gridcell');
            dayCell.setAttribute('tabindex', 0);
            dayCell.setAttribute('aria-label', `Date ${i}, ${firstDayOfMonth.toLocaleString('default', { month: 'long' })}`);

            const tasksForDate = getTasksForDate(dateString); // Use correct date string
            const dayOfWeek = currentDayLocalDate.getDay();

            // Add classes
            if (dayOfWeek === 0 || dayOfWeek === 6) dayCell.classList.add('weekend');
            if (holidays[dateString]) dayCell.classList.add('holiday');
            if (tasksForDate.length > 0) {
                dayCell.classList.add('has-task');
                if (tasksForDate.length > 5) dayCell.classList.add('high-density');

                const currentDayNormalized = new Date(currentDayLocalDate);
                currentDayNormalized.setHours(0,0,0,0);
                const timeDiff = currentDayNormalized.getTime() - todayLocalDate.getTime();
                const dayDiff = Math.round(timeDiff / (1000 * 3600 * 24));
                const hasIncompleteTaskDueSoon = tasksForDate.some(task => !task.completed);

                if (dayDiff >= 0 && dayDiff <= 7 && hasIncompleteTaskDueSoon) {
                    dayCell.classList.add('due-soon');
                }
            }

            // Highlight today (local comparison)
             if (currentDayLocalDate.getFullYear() === todayLocalDate.getFullYear() &&
                 currentDayLocalDate.getMonth() === todayLocalDate.getMonth() &&
                 currentDayLocalDate.getDate() === todayLocalDate.getDate()) {
                  dayCell.classList.add('today');
             }


            // Day Number
            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = i;
            dayCell.appendChild(dayNumber);

            // Task List Preview
            const taskListPreview = document.createElement('ul');
            taskListPreview.classList.add('task-list-preview');
            dayCell.appendChild(taskListPreview);

            const previewTasks = tasksForDate.slice(0, 3);
            previewTasks.forEach((task) => {
                 if (!task) return; // Safety check
                 const taskItem = document.createElement('li');
                 taskItem.draggable = true;
                 taskItem.dataset.taskId = task.id;
                  // Use keyDate if available (from recurring calc), otherwise originalDate
                 taskItem.dataset.originalDate = task.keyDate || task.originalDate;
                 taskItem.dataset.currentDate = dateString; // Date cell where it appears
                 // Find index within the definition array
                 const definitionDate = task.keyDate || task.originalDate;
                 taskItem.dataset.taskIndex = findTaskIndex(task.id, definitionDate);
                 taskItem.dataset.isRecurringInstance = task.isRecurringInstance;

                 // Priority Indicator
                 const priorityIcon = document.createElement('span');
                 priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
                 priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);
                 taskItem.appendChild(priorityIcon);

                 const taskText = document.createElement('span');
                 taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`;
                 taskItem.appendChild(taskText);

                  // Show recurrence icon for actual instances OR the original date of a recurring task
                 if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                      const recurrenceIcon = document.createElement('span');
                      recurrenceIcon.classList.add('recurrence-icon');
                      recurrenceIcon.textContent = '?';
                      recurrenceIcon.title = `Recurring: ${task.recurrence}`;
                      taskItem.appendChild(recurrenceIcon);
                 }

                 if (task.completed) {
                      taskItem.classList.add('completed');
                 }
                 taskListPreview.appendChild(taskItem);
            });
            if (tasksForDate.length > 3) {
                const moreItem = document.createElement('li');
                moreItem.textContent = `+${tasksForDate.length - 3} more...`;
                moreItem.style.cursor = 'default';
                taskListPreview.appendChild(moreItem);
            }

            // Event Listeners
            dayCell.addEventListener('click', () => openTaskModal(dateString));
            dayCell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openTaskModal(dateString);
                }
            });
            dayCell.addEventListener('dragover', handleDragOver);
            dayCell.addEventListener('dragenter', handleDragEnter);
            dayCell.addEventListener('dragleave', handleDragLeave);
            dayCell.addEventListener('drop', handleDrop);

            calendarGrid.appendChild(dayCell);
        }
        addDragListenersToTasks();
    }

     // Helper to find task index using ID and the date where the definition is stored
     function findTaskIndex(taskId, definitionDate) {
          if (!taskId || !definitionDate || !tasks[definitionDate]) return -1;
          return tasks[definitionDate].findIndex(t => t.id === taskId);
     }


    function renderModalTasks(dateString) {
        modalTaskList.innerHTML = '';
        const tasksForDate = getTasksForDate(dateString); // Includes recurring, filtered, sorted

        if (tasksForDate.length === 0) {
            modalTaskList.innerHTML = '<li>No tasks for this date (matching filters).</li>';
            return;
        }

        tasksForDate.forEach((task) => {
             if (!task) return; // Safety
            const listItem = document.createElement('li');
            listItem.classList.add('modal-task-item');
            if (task.completed) listItem.classList.add('completed'); // Add class to li for potential styling

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', `Mark task ${task.description || ''} as complete`);
            checkbox.dataset.taskId = task.id;
            // Important: use the keyDate (where definition lives) or originalDate
            const definitionDate = task.keyDate || task.originalDate;
            checkbox.dataset.originalDate = definitionDate;
            checkbox.dataset.taskIndex = findTaskIndex(task.id, definitionDate); // Find index dynamically
            checkbox.dataset.isRecurringInstance = task.isRecurringInstance;
            checkbox.dataset.currentDate = task.date; // The date of this instance

            checkbox.addEventListener('change', (e) => {
                const target = e.target;
                const originalDefDate = target.dataset.originalDate;
                const taskIdx = parseInt(target.dataset.taskIndex);
                 // const isRecurring = target.dataset.isRecurringInstance === 'true';
                 // const currentDate = target.dataset.currentDate;

                if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx] !== undefined) {
                    // Modify the original task's completed status
                    tasks[originalDefDate][taskIdx].completed = target.checked;
                    saveData();
                    renderModalTasks(dateString); // Re-render modal list immediately
                    rerenderViews(dateString); // Update calendar and month view too
                } else {
                    console.error("Task not found for completion toggle:", originalDefDate, taskIdx);
                    alert("Error toggling task completion.");
                     // Force refresh to try and recover state display
                     rerenderViews(dateString);
                }
            });

            // Task Content Wrapper
            const taskContentWrapper = document.createElement('div');
            taskContentWrapper.classList.add('task-content-wrapper');

            const priorityIcon = document.createElement('span');
            priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
            priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);

            const taskText = document.createElement('span');
             taskText.classList.add('task-text'); // Add class for potential styling
            taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`;
            if (task.completed) {
                taskText.classList.add('completed'); // Apply styling class
            }

            taskContentWrapper.appendChild(priorityIcon);
            taskContentWrapper.appendChild(taskText);

            if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                 const recurrenceIcon = document.createElement('span');
                 recurrenceIcon.classList.add('recurrence-icon');
                 recurrenceIcon.textContent = '?';
                 recurrenceIcon.title = `Recurring: ${task.recurrence}`;
                 taskContentWrapper.appendChild(recurrenceIcon);
            }

            if (task.category && task.category !== 'General') {
                const categorySpan = document.createElement('span');
                 categorySpan.classList.add('category-span');
                categorySpan.textContent = `[${task.category}]`;
                taskContentWrapper.appendChild(categorySpan);
            }

            // Actions
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('modal-task-actions');

            const editButton = document.createElement('button');
            editButton.classList.add('edit-task-button');
            editButton.textContent = 'Edit';
             const definitionDateForEdit = task.keyDate || task.originalDate;
             const taskIndexForEdit = findTaskIndex(task.id, definitionDateForEdit);
             editButton.dataset.taskId = task.id;
             editButton.dataset.originalDate = definitionDateForEdit; // Date where definition lives
             editButton.dataset.taskIndex = taskIndexForEdit; // Index in that definition array
             editButton.dataset.isRecurringInstance = task.isRecurringInstance;
             editButton.dataset.currentDate = task.date; // Instance date

            editButton.setAttribute('aria-label', `Edit task: ${task.description || ''}`);
            editButton.addEventListener('click', (e) => {
                const target = e.target;
                 const originalDefDate = target.dataset.originalDate;
                 const taskIdx = parseInt(target.dataset.taskIndex);
                 if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx]) {
                      const taskToEdit = tasks[originalDefDate][taskIdx];
                      openEditTaskModal(
                           target.dataset.currentDate, // Instance date
                           originalDefDate, // Definition date key
                           taskIdx, // Index in definition array
                           taskToEdit, // The task object
                           target.dataset.isRecurringInstance === 'true'
                      );
                 } else {
                      console.error("Could not find task data to edit:", target.dataset);
                      alert("Error: Could not load task data for editing.");
                 }
            });

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-task-button');
            deleteButton.textContent = 'Delete';
            const definitionDateForDelete = task.keyDate || task.originalDate;
            const taskIndexForDelete = findTaskIndex(task.id, definitionDateForDelete);
            deleteButton.dataset.taskId = task.id;
            deleteButton.dataset.originalDate = definitionDateForDelete;
            deleteButton.dataset.taskIndex = taskIndexForDelete;
            deleteButton.dataset.isRecurringInstance = task.isRecurringInstance;
            deleteButton.dataset.currentDate = task.date;

            deleteButton.setAttribute('aria-label', `Delete task: ${task.description || ''}`);
            deleteButton.addEventListener('click', (e) => {
                const target = e.target;
                const originalDefDate = target.dataset.originalDate;
                const taskIdx = parseInt(target.dataset.taskIndex);
                const isRecurring = target.dataset.isRecurringInstance === 'true';
                 const currentDate = target.dataset.currentDate;
                 const isActuallyRecurringDefined = tasks[originalDefDate]?.[taskIdx]?.recurrence !== 'none';


                if (isActuallyRecurringDefined && isRecurring) {
                    // Offer choice for recurring deletion
                    if (confirm(`Delete only the occurrence on ${currentDate}? (Cancel to delete the entire series)`)) {
                        deleteTask(originalDefDate, taskIdx, true, currentDate); // Delete instance (adds exception)
                    } else {
                        if (confirm(`DELETE ENTIRE SERIES starting ${tasks[originalDefDate][taskIdx].originalDate}? This action cannot be undone.`)) {
                            deleteTask(originalDefDate, taskIdx, false, null); // Delete original task definition
                        }
                    }
                } else {
                    // Standard deletion confirmation
                    if (confirm('Are you sure you want to delete this task?')) {
                        deleteTask(originalDefDate, taskIdx, false, null);
                    }
                }
            });

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);

            listItem.appendChild(checkbox);
            listItem.appendChild(taskContentWrapper);
            listItem.appendChild(actionsDiv);

            modalTaskList.appendChild(listItem);
        });
    }


    function renderMonthTasksView() {
        monthTaskListContainer.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        monthTaskViewMonthYear.textContent = `${monthName} ${year}`;

        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

        let tasksFoundInMonth = false;
        let sortedTasksByDate = {};

        // Iterate through days to get tasks, respecting filters
        for (let day = 1; day <= lastDayOfMonth; day++) {
            const currentDayDate = new Date(year, month, day);
            const dateString = formatDate(currentDayDate);
            const tasksForThisDay = getTasksForDate(dateString);

            if (tasksForThisDay.length > 0) {
                tasksFoundInMonth = true;
                sortedTasksByDate[dateString] = tasksForThisDay;
            }
        }

        if (!tasksFoundInMonth) {
            monthTaskListContainer.innerHTML = '<p>No tasks scheduled for this month (matching filters).</p>';
            return;
        }

        // Render sorted tasks grouped by date
        Object.keys(sortedTasksByDate).sort().forEach(dateString => {
            const tasksForDate = sortedTasksByDate[dateString];

            const dateGroup = document.createElement('div');
            dateGroup.classList.add('task-date-group');

            const dateHeader = document.createElement('div');
            dateHeader.classList.add('task-date');
            dateHeader.textContent = formatDateDisplay(dateString); // Use display format
            dateGroup.appendChild(dateHeader);

            const taskList = document.createElement('ul');

            tasksForDate.forEach((task) => {
                 if (!task) return; // Safety
                const taskItem = document.createElement('li');
                // Checkbox
                 const checkbox = document.createElement('input');
                 checkbox.type = 'checkbox';
                 checkbox.checked = task.completed;
                 checkbox.setAttribute('aria-label', `Mark task ${task.description || ''} as complete`);
                 const definitionDate = task.keyDate || task.originalDate;
                 const taskIndex = findTaskIndex(task.id, definitionDate);
                 checkbox.dataset.taskId = task.id;
                 checkbox.dataset.originalDate = definitionDate;
                 checkbox.dataset.taskIndex = taskIndex;
                 checkbox.dataset.isRecurringInstance = task.isRecurringInstance;
                 checkbox.dataset.currentDate = task.date;

                 checkbox.addEventListener('change', (e) => {
                      const target = e.target;
                      const originalDefDate = target.dataset.originalDate;
                      const taskIdx = parseInt(target.dataset.taskIndex);

                      if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx] !== undefined) {
                           tasks[originalDefDate][taskIdx].completed = target.checked;
                           saveData();
                           renderMonthTasksView(); // Update this view
                           renderCalendar(); // Update calendar day style
                           // Update modal if open for this date
                           if (taskModal.style.display === 'flex' && modalDateInput.value === task.date) {
                                renderModalTasks(task.date);
                           }
                      } else {
                           console.error("Task not found for completion toggle (Month View):", originalDefDate, taskIdx);
                           alert("Error toggling task completion.");
                            renderMonthTasksView(); // Refresh view
                      }
                 });

                 // Task Content Wrapper
                 const taskContentWrapper = document.createElement('div');
                 taskContentWrapper.classList.add('task-content-wrapper');

                 const priorityIcon = document.createElement('span');
                 priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
                 priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);

                 const taskText = document.createElement('span');
                 taskText.classList.add('task-text');
                 taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description || ''}`;
                 if (task.completed) {
                      taskText.classList.add('completed');
                 }

                 taskContentWrapper.appendChild(priorityIcon);
                 taskContentWrapper.appendChild(taskText);

                 if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none' && task.originalDate === dateString)) {
                      const recurrenceIcon = document.createElement('span');
                      recurrenceIcon.classList.add('recurrence-icon');
                      recurrenceIcon.textContent = '?';
                      recurrenceIcon.title = `Recurring: ${task.recurrence}`;
                      taskContentWrapper.appendChild(recurrenceIcon);
                 }

                 if (task.category && task.category !== 'General') {
                      const categorySpan = document.createElement('span');
                      categorySpan.classList.add('category-span');
                      categorySpan.textContent = `[${task.category}]`;
                      taskContentWrapper.appendChild(categorySpan);
                 }

                 // Actions
                 const actionsDiv = document.createElement('div');
                 actionsDiv.classList.add('task-actions');

                 const editButton = document.createElement('button');
                 editButton.classList.add('edit-task-button');
                 editButton.textContent = 'Edit';
                 editButton.dataset.taskId = task.id;
                 editButton.dataset.originalDate = definitionDate;
                 editButton.dataset.taskIndex = taskIndex;
                 editButton.dataset.isRecurringInstance = task.isRecurringInstance;
                 editButton.dataset.currentDate = task.date;
                 editButton.setAttribute('aria-label', `Edit task: ${task.description || ''}`);
                 editButton.addEventListener('click', (e) => {
                      const target = e.target;
                      const originalDefDate = target.dataset.originalDate;
                      const taskIdx = parseInt(target.dataset.taskIndex);
                      if (originalDefDate && !isNaN(taskIdx) && tasks[originalDefDate] && tasks[originalDefDate][taskIdx]) {
                           const taskToEdit = tasks[originalDefDate][taskIdx];
                           openEditTaskModal(
                                target.dataset.currentDate,
                                originalDefDate,
                                taskIdx,
                                taskToEdit,
                                target.dataset.isRecurringInstance === 'true'
                           );
                      } else {
                           console.error("Could not find task data to edit (Month View):", target.dataset);
                           alert("Error: Could not load task data for editing.");
                      }
                 });

                 const deleteButton = document.createElement('button');
                 deleteButton.classList.add('delete-task-button');
                 deleteButton.textContent = 'Delete';
                 deleteButton.dataset.taskId = task.id;
                 deleteButton.dataset.originalDate = definitionDate;
                 deleteButton.dataset.taskIndex = taskIndex;
                 deleteButton.dataset.isRecurringInstance = task.isRecurringInstance;
                 deleteButton.dataset.currentDate = task.date;
                 deleteButton.setAttribute('aria-label', `Delete task: ${task.description || ''}`);
                 deleteButton.addEventListener('click', (e) => {
                      const target = e.target;
                      const originalDefDate = target.dataset.originalDate;
                      const taskIdx = parseInt(target.dataset.taskIndex);
                      const isRecurring = target.dataset.isRecurringInstance === 'true';
                      const currentDate = target.dataset.currentDate;
                      const isActuallyRecurringDefined = tasks[originalDefDate]?.[taskIdx]?.recurrence !== 'none';

                     if (isActuallyRecurringDefined && isRecurring) {
                          if (confirm(`Delete only the occurrence on ${currentDate}? (Cancel to delete the entire series)`)) {
                               deleteTask(originalDefDate, taskIdx, true, currentDate);
                          } else {
                               if (confirm(`DELETE ENTIRE SERIES starting ${tasks[originalDefDate][taskIdx].originalDate}? This action cannot be undone.`)) {
                                    deleteTask(originalDefDate, taskIdx, false, null);
                               }
                          }
                     } else {
                          if (confirm('Are you sure you want to delete this task?')) {
                               deleteTask(originalDefDate, taskIdx, false, null);
                          }
                     }
                 });


                 actionsDiv.appendChild(editButton);
                 actionsDiv.appendChild(deleteButton);

                 taskItem.appendChild(checkbox);
                 taskItem.appendChild(taskContentWrapper);
                 taskItem.appendChild(actionsDiv);

                taskList.appendChild(taskItem);
            });
            dateGroup.appendChild(taskList);
            monthTaskListContainer.appendChild(dateGroup);
        });
    }


    function rerenderViews(dateString = null) {
        // Determine the month currently being viewed before re-rendering
        const currentViewYear = currentDate.getFullYear();
        const currentViewMonth = currentDate.getMonth();

        renderCalendar(); // Re-renders the grid for the current month
        renderMonthTasksView(); // Re-renders the side panel for the current month

        // If the modal is open, check if its date falls within the *currently viewed* month
        if (taskModal.style.display === 'flex') {
            const modalDateStr = modalDateInput.value;
            if (modalDateStr) {
                 const modalDateObj = getUTCDateFromString(modalDateStr);
                 // Check if modal date belongs to the currently viewed month/year
                 if (modalDateObj && modalDateObj.getUTCFullYear() === currentViewYear && modalDateObj.getUTCMonth() === currentViewMonth) {
                      renderModalTasks(modalDateStr); // Re-render modal tasks if it's relevant to the current view
                 } else if (!modalDateObj) {
                      // Handle case where modal might have an invalid date somehow
                      closeTaskModal();
                 }
            }
        }
        // Similar logic could be applied to the edit modal if needed
    }

    // --- Modal Handling ---
    function openTaskModal(dateString) {
        modalTitleHeader.textContent = `Tasks for: ${formatDateDisplay(dateString)}`;
        modalDateInput.value = dateString;
        isHolidayCheckbox.checked = !!holidays[dateString];
        renderModalTasks(dateString); // Render tasks for the selected date
        populateCategorySelects(); // Ensure categories are up-to-date
        taskModal.style.display = 'flex';
        addTaskForm.reset();
        newTaskCategorySelect.value = 'General';
        newTaskPrioritySelect.value = 'medium';
        newTaskRecurrenceSelect.value = 'none';
        newTaskDescriptionInput.focus();
    }

    function openEditTaskModal(currentInstanceDate, originalDefDate, taskIndex, taskObject, isRecurringInstance) {
        if (!taskObject) {
            alert("Error: Cannot load task data for editing.");
            console.error("Task object is undefined in openEditTaskModal", currentInstanceDate, originalDefDate, taskIndex);
            return;
        }

        editTaskModalTitle.textContent = `Edit Task on ${formatDateDisplay(currentInstanceDate)}`;
        editTaskDescriptionInput.value = taskObject.description || '';
        editTaskTimeInput.value = taskObject.time || '';
        populateCategorySelects();
        editTaskCategorySelect.value = taskObject.category || 'General';
        editTaskPrioritySelect.value = taskObject.priority || 'medium';
        editTaskRecurrenceSelect.value = taskObject.recurrence || 'none';
        editTaskCompletedSelect.value = taskObject.completed ? 'true' : 'false';

        editModalDateInput.value = originalDefDate; // Store the key where definition lives
        editModalTaskIndexInput.value = taskIndex; // Store the index in that key's array
        editModalIsRecurringInstance.value = isRecurringInstance ? 'true' : 'false';

        // Show/Hide Recurring Delete Buttons
        const isActuallyRecurring = taskObject.recurrence && taskObject.recurrence !== 'none';
        confirmDeleteRecurringTaskButton.style.display = isActuallyRecurring && isRecurringInstance ? 'inline-block' : 'none';
        confirmDeleteAllRecurringTaskButton.style.display = isActuallyRecurring ? 'inline-block' : 'none';
        confirmDeleteTaskButton.style.display = !isActuallyRecurring ? 'inline-block' : 'none';

        editTaskModal.style.display = 'flex';
        editTaskDescriptionInput.focus();
    }

    function closeTaskModal() {
        taskModal.style.display = 'none';
    }

    function closeEditModal() {
        editTaskModal.style.display = 'none';
    }


    // --- Event Handlers ---
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleAddNewTask();
    });

    function handleAddNewTask() {
        const description = newTaskDescriptionInput.value.trim();
        const time = newTaskTimeInput.value;
        let category = newTaskCategorySelect.value;
        const newCategory = addNewCategoryInput.value.trim();
        const priority = newTaskPrioritySelect.value;
        const recurrence = newTaskRecurrenceSelect.value;
        const date = modalDateInput.value; // This is the date the modal was opened for

        if (!description) { // Date validation is less critical here as it comes from UI interaction
            alert('Please enter a task description.');
            return;
        }
         if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
             alert('Invalid date selected. Cannot add task.');
             return;
         }


        if (newCategory) {
            category = newCategory;
            if (!categories.includes(category)) {
                categories.push(category);
                saveData();
                populateCategorySelects();
                populateFilterCategorySelect();
            }
        }

        const newTask = {
            id: generateTaskId(date),
            description: description,
            category: category || 'General',
            completed: false,
            time: time,
            priority: priority,
            recurrence: recurrence,
            originalDate: date, // Set original date to the date it was added on
            exceptions: []
        };

        addTask(newTask);

        addTaskForm.reset();
        newTaskCategorySelect.value = 'General';
        newTaskPrioritySelect.value = 'medium';
        newTaskRecurrenceSelect.value = 'none';
        newTaskDescriptionInput.focus(); // Keep focus for adding more
        renderModalTasks(date); // Re-render modal list
    }

    confirmSaveTaskButton.addEventListener('click', () => {
        const description = editTaskDescriptionInput.value.trim();
        const time = editTaskTimeInput.value;
        const category = editTaskCategorySelect.value;
        const priority = editTaskPrioritySelect.value;
        const recurrence = editTaskRecurrenceSelect.value;
        const completed = editTaskCompletedSelect.value === 'true';

        const originalDefDate = editModalDateInput.value; // Definition date key
        const taskIndex = parseInt(editModalTaskIndexInput.value); // Index in definition array
        const isRecurringInstance = editModalIsRecurringInstance.value === 'true';
         // Get the date of the instance being edited (needed if logic changes for instances)
         // We need to reliably get this date. Let's find the task object first.
         let instanceDate = null;
         if(originalDefDate && !isNaN(taskIndex) && tasks[originalDefDate] && tasks[originalDefDate][taskIndex]){
             // If we were to store the instance date reliably, we'd retrieve it here.
             // For now, we mostly edit the series.
             // instanceDate = taskBeingEdited.date; // Assumes 'date' property holds instance date
         }


        if (!description || !originalDefDate || isNaN(taskIndex)) {
            alert('Error: Could not save task. Invalid data.');
            console.error("Invalid data for save:", description, originalDefDate, taskIndex);
            return;
        }

        const updatedTaskData = {
            description: description,
            time: time,
            category: category,
            priority: priority,
            recurrence: recurrence,
            completed: completed,
             // originalDate is NOT typically changed here, handled by move logic if needed
             // exceptions are handled by delete logic
        };

        updateTask(originalDefDate, taskIndex, updatedTaskData, isRecurringInstance, instanceDate);
        closeEditModal();
    });


    confirmDeleteTaskButton.addEventListener('click', () => { // Non-recurring / Delete Series from Edit Modal
        const originalDefDate = editModalDateInput.value;
        const taskIndex = parseInt(editModalTaskIndexInput.value);
         const taskToDelete = tasks[originalDefDate]?.[taskIndex];
         const isActuallyRecurring = taskToDelete && taskToDelete.recurrence !== 'none';
         const message = isActuallyRecurring
             ? `Are you sure you want to delete the entire recurring series starting ${taskToDelete.originalDate}? This cannot be undone.`
             : 'Are you sure you want to delete this task?';

        if (confirm(message)) {
            deleteTask(originalDefDate, taskIndex, false, null);
            closeEditModal();
        }
    });

    confirmDeleteRecurringTaskButton.addEventListener('click', () => { // Delete single instance
        const originalDefDate = editModalDateInput.value;
        const taskIndex = parseInt(editModalTaskIndexInput.value);
        const taskBeingEdited = tasks[originalDefDate]?.[taskIndex];
        // We need the date of the instance that was clicked to open the modal.
        // This isn't reliably stored in the modal currently. A potential issue.
        // Let's try to extract from title, acknowledging fragility.
        const title = editTaskModalTitle.textContent;
        const dateMatch = title.match(/on\s+(.+)/);
        let instanceDateForDelete = null;
        if(dateMatch && dateMatch[1]){
            // Attempt to parse the display date back into YYYY-MM-DD (might fail across locales)
             try {
                  // This is locale-dependent and risky. A hidden input would be better.
                  // For now, assume it can be parsed back or use a different method if available.
                   const parsedDate = new Date(dateMatch[1]); // Very locale-dependent parsing
                   if (!isNaN(parsedDate)) {
                       instanceDateForDelete = formatDate(parsedDate); // Format back to YYYY-MM-DD
                   } else {
                       console.warn("Could not parse instance date from title for deletion:", dateMatch[1]);
                   }
             } catch (e) {
                  console.error("Error parsing instance date from title:", e);
             }
        }

        if (!instanceDateForDelete) {
             // Fallback or error if we couldn't get the instance date
             alert("Error: Could not determine the specific date of this occurrence to delete.");
             console.error("Failed to get instanceDateForDelete", title);
             return;
        }


        if (confirm(`Delete only the task occurrence on ${formatDateDisplay(instanceDateForDelete)}?`)) {
            deleteTask(originalDefDate, taskIndex, true, instanceDateForDelete);
            closeEditModal();
        }
    });

    confirmDeleteAllRecurringTaskButton.addEventListener('click', () => { // Delete whole series
        const originalDefDate = editModalDateInput.value;
        const taskIndex = parseInt(editModalTaskIndexInput.value);
         const taskToDelete = tasks[originalDefDate]?.[taskIndex];

        if (confirm(`Are you sure you want to delete the entire recurring series starting ${taskToDelete?.originalDate}? This cannot be undone.`)) {
            deleteTask(originalDefDate, taskIndex, false, null);
            closeEditModal();
        }
    });


    // Navigation and Toggle Listeners
    prevMonthButton.addEventListener('click', () => navigateMonth(-1));
    nextMonthButton.addEventListener('click', () => navigateMonth(1));
    prevYearButton.addEventListener('click', () => navigateYear(-1));
    nextYearButton.addEventListener('click', () => navigateYear(1));
    darkModeToggle.addEventListener('click', toggleMode);
    downloadTasksButton.addEventListener('click', downloadTasks);
    importTasksButton.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importTasks);
    downloadWordReportButton.addEventListener('click', downloadWordReport); // <<< NEW Listener
    toggleMonthViewButton.addEventListener('click', toggleMonthView);
    closeButton.addEventListener('click', closeTaskModal);
    closeEditModalButton.addEventListener('click', closeEditModal);
    closeMonthViewButton.addEventListener('click', () => toggleMonthView(false)); // Explicitly hide

    window.addEventListener('click', (event) => {
        if (event.target === taskModal) closeTaskModal();
        if (event.target === editTaskModal) closeEditModal();
    });

    isHolidayCheckbox.addEventListener('change', () => {
        const dateString = modalDateInput.value;
         if (!dateString) return; // Don't proceed if date is missing
        if (isHolidayCheckbox.checked) {
            holidays[dateString] = true;
        } else {
            delete holidays[dateString];
        }
        saveData();
        renderCalendar(); // Re-render calendar immediately
    });

    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase();
        rerenderViews(); // Re-render with new search term
    });

    filterCategorySelect.addEventListener('change', (e) => {
        currentFilterCategory = e.target.value;
        rerenderViews(); // Re-render with new category filter
    });

    filterCompletionSelect.addEventListener('change', (e) => {
        currentFilterCompletion = e.target.value;
        rerenderViews(); // Re-render with new completion filter
    });

    hideCompletedToggle.addEventListener('click', () => {
        hideCompleted = !hideCompleted;
        hideCompletedToggle.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed';
        hideCompletedToggle.setAttribute('aria-pressed', hideCompleted);
        localStorage.setItem('hideCompleted', hideCompleted);
        rerenderViews(); // Re-render with new hide setting
    });

    // --- Report Generation ---

    function generateMonthlyReportHTML() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let htmlContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Monthly Task Report - ${monthName} ${year}</title>
        <style>
            body { font-family: sans-serif; line-height: 1.4; font-size: 10pt; }
            h1, h2, h3 { margin-bottom: 0.5em; color: #333; }
            h1 { font-size: 16pt; text-align: center; margin-bottom: 1em;}
            h2 { font-size: 14pt; }
            h3 { font-size: 12pt; margin-top: 1.5em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em;}
            ul { list-style: none; padding-left: 0; margin-top: 0.5em;}
            li { margin-bottom: 0.4em; padding-left: 1em; text-indent: -1em; border-bottom: 1px dotted #eee; padding-bottom: 0.3em;}
            li:last-child { border-bottom: none; }
            li.completed { text-decoration: line-through; color: #888; }
            li.completed .details { color: #999; }
            strong { font-weight: bold; }
            .priority-high { color: #C00; } /* Darker red for print/Word */
            .priority-medium { color: #F80; } /* Orange */
            .priority-low { color: #777; }
            .details { font-size: 9pt; color: #555; margin-left: 8px; }
        </style>
    </head>
    <body>
        <h1>Monthly Task Report</h1>
        <h2>${monthName} ${year}</h2>`;

        let tasksFound = false;
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDayLocalDate = new Date(year, month, i);
            const dateString = formatDate(currentDayLocalDate);
            const tasksForDay = getTasksForDate(dateString); // Gets tasks, respects filters

            if (tasksForDay.length > 0) {
                tasksFound = true;
                htmlContent += `<h3>${formatDateDisplay(dateString)}</h3><ul>`;

                tasksForDay.forEach(task => {
                    const completed = task.completed;
                    const time = task.time ? `<strong>${task.time}</strong> - ` : '';
                    const description = task.description || '(No description)';
                    const priorityClass = `priority-${task.priority || 'medium'}`;
                    const priorityText = task.priority ? `(P: ${task.priority.charAt(0).toUpperCase()})` : ''; // Short priority
                    const category = task.category && task.category !== 'General' ? `[${task.category}]` : '';
                    const recurrence = task.recurrence && task.recurrence !== 'none' ? `(R)` : ''; // Simple recurrence indicator

                    htmlContent += `<li class="${completed ? 'completed' : ''}">
                        ${time}${description}
                        <span class="details ${priorityClass}">${priorityText} ${category} ${recurrence}</span>
                    </li>`;
                });

                htmlContent += `</ul>`;
            }
        }

        if (!tasksFound) {
            htmlContent += `<p>No tasks found for ${monthName} ${year} matching the current filters.</p>`;
        }

        htmlContent += `
    </body>
    </html>`;

        return htmlContent;
    }

    // --- Download Function ---

    function downloadWordReport() {
        try {
            const year = currentDate.getFullYear();
            const monthName = currentDate.toLocaleString('default', { month: 'long' });
            const filename = `Monthly_Report_${monthName}_${year}.doc`;

            const htmlContent = generateMonthlyReportHTML();
            const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });

            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(blob, filename);
            } else {
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
            }
        } catch (error) {
            console.error("Error generating or downloading Word report:", error);
            alert("Could not download Word report. See console for details.");
        }
    }


    // --- Utility and Mode Functions --- (Keep existing toggleMode, applySavedModePreference, etc.)

    function populateCategorySelects() {
        const currentNewTaskVal = newTaskCategorySelect.value;
        const currentEditTaskVal = editTaskCategorySelect.value;

        newTaskCategorySelect.innerHTML = '';
        editTaskCategorySelect.innerHTML = '';

         if (!categories.includes('General')) {
              // Ensure 'General' exists and is preferably first if added
              const generalExists = categories.includes('General');
              if(!generalExists) categories.unshift('General');
         } else {
             // Ensure 'General' is first if it already exists
             categories = ['General', ...categories.filter(c => c !== 'General')];
         }


        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            newTaskCategorySelect.appendChild(option.cloneNode(true));
            editTaskCategorySelect.appendChild(option.cloneNode(true));
        });

        newTaskCategorySelect.value = categories.includes(currentNewTaskVal) ? currentNewTaskVal : 'General';
        editTaskCategorySelect.value = categories.includes(currentEditTaskVal) ? currentEditTaskVal : 'General';
    }

    function populateFilterCategorySelect() {
        const currentFilterVal = filterCategorySelect.value;
        filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            filterCategorySelect.appendChild(option);
        });
        filterCategorySelect.value = categories.includes(currentFilterVal) || currentFilterVal === 'all' ? currentFilterVal : 'all';
    }

    function toggleMode() {
        body.classList.remove('light-mode', 'dark-mode', 'gray-mode');
        if (currentMode === 'light') {
            currentMode = 'dark';
            body.classList.add('dark-mode');
            darkModeToggle.textContent = 'Dark Mode';
        } else if (currentMode === 'dark') {
            currentMode = 'gray';
            body.classList.add('gray-mode');
            darkModeToggle.textContent = 'Gray Mode';
        } else {
            currentMode = 'light';
            darkModeToggle.textContent = 'Light Mode';
        }
        saveData();
    }

    function applySavedModePreference() {
        body.classList.remove('light-mode', 'dark-mode', 'gray-mode');
        if (currentMode === 'dark') {
            body.classList.add('dark-mode');
            darkModeToggle.textContent = 'Dark Mode';
        } else if (currentMode === 'gray') {
            body.classList.add('gray-mode');
            darkModeToggle.textContent = 'Gray Mode';
        } else {
            darkModeToggle.textContent = 'Light Mode';
        }
    }

    function toggleMonthView(forceState = null) {
        isMonthViewVisible = typeof forceState === 'boolean' ? forceState : !isMonthViewVisible;
        monthTaskView.style.display = isMonthViewVisible ? 'block' : 'none';
        toggleMonthViewButton.textContent = isMonthViewVisible ? 'Hide Month Tasks' : 'Show Month Tasks';
        toggleMonthViewButton.setAttribute('aria-expanded', isMonthViewVisible);
        saveData();
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


    function downloadTasks() { // Downloads JSON backup
        try {
            const dataToSave = {
                tasks: tasks,
                holidays: holidays,
                categories: categories,
                mode: currentMode,
                monthViewVisible: isMonthViewVisible,
                hideCompleted: hideCompleted
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToSave, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
             const dateStamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            downloadAnchorNode.setAttribute("download", `calendar_backup_${dateStamp}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (error) {
            console.error("Error downloading JSON tasks:", error);
            alert("Could not download tasks JSON. See console for details.");
        }
    }

    function importTasks(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (typeof importedData !== 'object' || importedData === null) {
                    throw new Error("Invalid file format.");
                }

                if (confirm("Importing JSON will overwrite current tasks, holidays, and settings. Continue?")) {
                    // Load data with defaults if missing in file
                    tasks = importedData.tasks || {};
                    holidays = importedData.holidays || {};
                    categories = importedData.categories || ['General', 'Work', 'Personal'];
                    currentMode = importedData.mode || 'light';
                    isMonthViewVisible = importedData.monthViewVisible || false;
                    hideCompleted = importedData.hideCompleted || false;

                    // Re-initialize state and UI
                     loadData(); // Re-run load to apply migrations/defaults to potentially old imported data structures
                    applySavedModePreference();
                     applySavedMonthViewPreference();
                     applyHideCompletedPreference();
                    populateCategorySelects();
                    populateFilterCategorySelect();
                    saveData(); // Save the imported & processed data
                    rerenderViews();
                    alert("Data imported successfully!");
                }
            } catch (error) {
                console.error("Error importing tasks:", error);
                alert(`Could not import tasks. Error: ${error.message}`);
            } finally {
                importFile.value = null;
            }
        };
        reader.onerror = function() {
            alert("Error reading file.");
            importFile.value = null;
        };
        reader.readAsText(file);
    }

    // --- Drag and Drop Handlers ---
    function addDragListenersToTasks() {
        const taskItems = calendarGrid.querySelectorAll('.task-list-preview li[draggable="true"]');
        taskItems.forEach(item => {
            item.removeEventListener('dragstart', handleDragStart); // Remove old listeners first
            item.removeEventListener('dragend', handleDragEnd);
             item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
        });
    }

    function handleDragStart(e) {
        if (e.target.matches('.task-list-preview li[draggable="true"]')) {
             // Extract data robustly, checking for undefined
             const taskId = e.target.dataset.taskId;
             const originalDate = e.target.dataset.originalDate;
             const taskIndexStr = e.target.dataset.taskIndex;
             const isRecurringInstance = e.target.dataset.isRecurringInstance === 'true';
             const currentDate = e.target.dataset.currentDate;

             // Validate essential data
             if (!taskId || !originalDate || taskIndexStr === undefined || isNaN(parseInt(taskIndexStr))) {
                 console.error("Missing data on dragged item:", e.target.dataset);
                 e.preventDefault(); // Prevent drag if data is bad
                 return;
             }

            draggedTaskData = {
                taskId: taskId,
                originalDate: originalDate, // Date where definition lives
                taskIndex: parseInt(taskIndexStr), // Index in that definition array
                isRecurringInstance: isRecurringInstance,
                currentDate: currentDate // Date it's being dragged FROM
            };
            e.dataTransfer.effectAllowed = 'move';
            e.target.classList.add('dragging');
             // console.log("Drag Start:", draggedTaskData);
        } else {
            e.preventDefault();
        }
    }

    function handleDragEnd(e) {
        if (e.target.matches('.task-list-preview li[draggable="true"]')) {
            e.target.classList.remove('dragging');
        }
         // Clean up highlights universally after drag ends (successful or not)
         calendarGrid.querySelectorAll('.day.drag-over').forEach(d => d.classList.remove('drag-over'));
         draggedTaskData = null; // Always clear data
         // console.log("Drag End");
    }

    function handleDragOver(e) {
        e.preventDefault();
        if (draggedTaskData) { // Only indicate drop possibility if dragging valid data
             e.dataTransfer.dropEffect = 'move';
             // Add highlight only to valid day targets
             const dayTarget = e.target.closest('.day:not(.empty)');
             if (dayTarget) {
                 // Remove from others first for cleaner feedback
                  calendarGrid.querySelectorAll('.day.drag-over').forEach(d => {
                       if (d !== dayTarget) d.classList.remove('drag-over');
                  });
                 dayTarget.classList.add('drag-over');
             }
         } else {
             e.dataTransfer.dropEffect = 'none'; // No drop allowed if no valid data
         }
    }

    function handleDragEnter(e) {
        if (draggedTaskData) {
             const dayTarget = e.target.closest('.day:not(.empty)');
             if (dayTarget) {
                 dayTarget.classList.add('drag-over');
             }
         }
    }

    function handleDragLeave(e) {
         // More robust check: Remove highlight only if the relatedTarget is outside the current day cell
         const dayTarget = e.target.closest('.day');
         if (dayTarget && !dayTarget.contains(e.relatedTarget)) {
              dayTarget.classList.remove('drag-over');
         }
    }


    function handleDrop(e) {
        e.preventDefault();
        const dropTargetDay = e.target.closest('.day:not(.empty)');

         // Always remove highlight from the target on drop
         if (dropTargetDay) {
             dropTargetDay.classList.remove('drag-over');
         }
         // Remove highlights from all others just in case
         calendarGrid.querySelectorAll('.day.drag-over').forEach(d => d.classList.remove('drag-over'));


        if (dropTargetDay && draggedTaskData) {
            const targetDate = dropTargetDay.dataset.date;

             // console.log(`Attempting drop: Task ${draggedTaskData.taskId} from ${draggedTaskData.currentDate} onto ${targetDate}`);

            if (targetDate === draggedTaskData.currentDate) {
                // console.log("Dropped onto the same day.");
                draggedTaskData = null;
                return;
            }

            const { taskId, originalDate: definitionDate, taskIndex, isRecurringInstance, currentDate: sourceDate } = draggedTaskData;

            // Find the task definition using the definitionDate and index
            const taskToMove = tasks[definitionDate]?.[taskIndex];

            if (!taskToMove) {
                console.error("Cannot find task definition to move:", draggedTaskData);
                alert("Error: Could not find the task data to move.");
                draggedTaskData = null;
                return;
            }

             // Determine if the task definition itself is recurring
             const isTaskDefinitionRecurring = taskToMove.recurrence && taskToMove.recurrence !== 'none';

            if (isTaskDefinitionRecurring) {
                 // Handle Recurring Task Drag/Drop
                if (confirm(`Move only the occurrence from ${formatDateDisplay(sourceDate)} to ${formatDateDisplay(targetDate)}? (Cancel to move the entire series starting from ${formatDateDisplay(targetDate)})`)) {
                    // == Move Single Instance ==
                    console.log(`Moving single instance of ${taskId} from ${sourceDate} to ${targetDate}`);
                    // 1. Add an exception for the sourceDate to the original task definition
                    if (!Array.isArray(taskToMove.exceptions)) taskToMove.exceptions = [];
                     if(!taskToMove.exceptions.includes(sourceDate)) taskToMove.exceptions.push(sourceDate);

                    // 2. Create a new, non-recurring task on the targetDate
                    const newSingleTask = {
                        ...taskToMove,
                        id: generateTaskId(targetDate),
                        originalDate: targetDate, // Becomes its own task
                        recurrence: 'none',
                        exceptions: [],
                        // completed: false, // Optionally reset completion status
                    };
                    addTask(newSingleTask); // Add the new standalone task

                } else {
                    // == Move Entire Series ==
                    if (confirm(`MOVE ENTIRE SERIES? The start date will change to ${formatDateDisplay(targetDate)} and all future occurrences will adjust. This cannot be easily undone.`)) {
                         console.log(`Moving entire series ${taskId} to start on ${targetDate}`);
                         // 1. Update the originalDate property in the definition
                         taskToMove.originalDate = targetDate;
                         // 2. Clear exceptions (as they relate to the old start date)
                         taskToMove.exceptions = [];
                         // 3. Move the *task definition* in the `tasks` object if its key needs changing
                         if (definitionDate !== targetDate) {
                              const taskDefinition = tasks[definitionDate].splice(taskIndex, 1)[0]; // Remove from old array
                              if (tasks[definitionDate].length === 0) delete tasks[definitionDate];

                              if (!tasks[targetDate]) tasks[targetDate] = [];
                              tasks[targetDate].push(taskDefinition); // Add definition to new date key
                               console.log(`Definition moved from key ${definitionDate} to ${targetDate}`);
                         } else {
                              console.log(`Definition originalDate updated to ${targetDate}, key remains the same.`);
                         }
                    } else {
                        draggedTaskData = null; // User cancelled moving series
                        return;
                    }
                }

            } else {
                // == Move Non-Recurring Task ==
                console.log(`Moving non-recurring task ${taskId} from ${definitionDate} to ${targetDate}`);
                // 1. Remove task from source date array (which is definitionDate)
                const taskDefinition = tasks[definitionDate].splice(taskIndex, 1)[0];
                if (tasks[definitionDate].length === 0) {
                    delete tasks[definitionDate];
                }
                // 2. Update its originalDate property (which is also its definition key)
                taskDefinition.originalDate = targetDate;
                // 3. Add task to target date array
                if (!tasks[targetDate]) {
                    tasks[targetDate] = [];
                }
                tasks[targetDate].push(taskDefinition);
            }

            saveData();
            rerenderViews(); // Update UI fully

        } else {
            console.log("Drop occurred on invalid target or no valid task data.");
        }
        draggedTaskData = null; // Clear data after drop attempt
    }


    // --- Nav Helpers ---
     function navigateMonth(delta) {
         currentDate.setMonth(currentDate.getMonth() + delta);
         rerenderViews();
     }

     function navigateYear(delta) {
         currentDate.setFullYear(currentDate.getFullYear() + delta);
         rerenderViews();
     }


}); // End DOMContentLoaded

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
    let currentDate = new Date();
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
            acc[date] = loadedTasks[date].map((task, index) => {
                if (typeof task === 'string') {
                    // Old format conversion
                    return {
                        id: `${date}-${index}-${Date.now()}`, // Generate a simple unique ID
                        description: task,
                        category: 'General',
                        completed: false,
                        time: '',
                        priority: 'medium',
                        recurrence: 'none',
                        originalDate: date,
                        exceptions: [], // Dates where a recurring task instance is deleted
                    };
                }
                // Ensure all new properties exist
                return {
                    id: task.id || `${date}-${index}-${Date.now()}`, // Ensure ID exists
                    description: task.description || '',
                    category: task.category || 'General',
                    completed: task.completed || false,
                    time: task.time || '',
                    priority: task.priority || 'medium',
                    recurrence: task.recurrence || 'none',
                    originalDate: task.originalDate || date, // Track original date for recurrence
                    exceptions: task.exceptions || [], // Initialize exceptions
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

    // Generate a unique ID for tasks
    function generateTaskId(date) {
        return `${date}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }

    function addTask(taskData) {
        const date = taskData.originalDate;
        if (!tasks[date]) {
            tasks[date] = [];
        }
        tasks[date].push(taskData);
        saveData();
        rerenderViews(date);
    }

    function updateTask(originalDate, taskIndex, updatedTaskData, isRecurringInstance = false, instanceDate = null) {
        if (!tasks[originalDate] || tasks[originalDate][taskIndex] === undefined) {
            console.error("Task not found for update:", originalDate, taskIndex);
            return;
        }

        const taskToUpdate = tasks[originalDate][taskIndex];

        if (isRecurringInstance && instanceDate) {
             // TODO: Complex logic for handling updates to recurring instances
             // Option 1: Convert this instance into a non-recurring task with the changes.
             // Option 2: Ask user if they want to update all future instances (very complex).
             // Option 3 (Simplest): Disallow editing recurrence/date of single instances, only allow status/desc/etc.
             // For now, let's just update the description/time/priority/completion for the instance *if* it was represented separately.
             // Our current model doesn't store instances separately, they are calculated.
             // A simple approach for *deletion* is adding an exception. Editing is harder.
             alert("Editing individual recurring instances' date/recurrence is not fully supported yet. Changes apply to the series.");
             // Apply changes to the main task definition
             Object.assign(taskToUpdate, updatedTaskData);

        } else {
             // Update the original task definition
            Object.assign(taskToUpdate, updatedTaskData);

            // If the date was changed, move the task
            if (updatedTaskData.originalDate && updatedTaskData.originalDate !== originalDate) {
                 const newTaskDate = updatedTaskData.originalDate;
                 if (!tasks[newTaskDate]) {
                      tasks[newTaskDate] = [];
                 }
                 // Push a copy to the new date and remove from old
                 tasks[newTaskDate].push({...taskToUpdate}); // Push a copy with the new originalDate
                 tasks[originalDate].splice(taskIndex, 1);
                 if (tasks[originalDate].length === 0) {
                      delete tasks[originalDate];
                 }
            }
        }

        saveData();
        rerenderViews(originalDate); // Rerender based on original date
        if (updatedTaskData.originalDate && updatedTaskData.originalDate !== originalDate) {
            rerenderViews(updatedTaskData.originalDate); // Also rerender new date if moved
        }
         if (instanceDate) rerenderViews(instanceDate); // Rerender instance date if applicable
    }


    function deleteTask(originalDate, taskIndex, isRecurringInstance = false, instanceDate = null) {
        if (!tasks[originalDate] || tasks[originalDate][taskIndex] === undefined) {
            console.error("Task not found for deletion:", originalDate, taskIndex);
            return;
        }

        const taskToDelete = tasks[originalDate][taskIndex];

        if (isRecurringInstance && instanceDate && taskToDelete.recurrence !== 'none') {
            // Add the specific instance date to the exceptions list for the original task
             if (!taskToDelete.exceptions) {
                  taskToDelete.exceptions = [];
             }
            taskToDelete.exceptions.push(instanceDate);
            console.log(`Added exception for task ${taskToDelete.id} on ${instanceDate}`);
        } else {
            // Delete the original task (and thus all its recurrences)
            tasks[originalDate].splice(taskIndex, 1);
            if (tasks[originalDate].length === 0) {
                delete tasks[originalDate];
            }
             console.log(`Deleted original task ${taskToDelete.id} from ${originalDate}`);
        }

        saveData();
        rerenderViews(originalDate);
         if (instanceDate) rerenderViews(instanceDate); // Rerender instance date view too
    }


    // --- Recurrence Logic ---

    function getTasksForDate(targetDateString) {
        const [targetYear, targetMonth, targetDay] = targetDateString.split('-').map(Number);
        const targetDate = new Date(targetYear, targetMonth - 1, targetDay);
        targetDate.setHours(0,0,0,0); // Normalize time

        let tasksOnDate = [];

        // Include non-recurring tasks specifically for this date
        if (tasks[targetDateString]) {
            tasksOnDate.push(...tasks[targetDateString]
                .filter(task => task.recurrence === 'none')
                .map((task, index) => ({ ...task, isRecurringInstance: false, originalTaskIndex: index })) // Mark as non-recurring instance
            );
        }

        // Include recurring tasks that fall on this date
        Object.keys(tasks).forEach(originalDateString => {
            if (!tasks[originalDateString]) return;

            tasks[originalDateString].forEach((task, index) => {
                if (task.recurrence && task.recurrence !== 'none') {
                    const [originalYear, originalMonth, originalDay] = task.originalDate.split('-').map(Number);
                    const originalTaskDate = new Date(originalYear, originalMonth - 1, originalDay);
                     originalTaskDate.setHours(0,0,0,0); // Normalize time

                    // Skip if the target date is before the original date or is an exception
                    if (targetDate < originalTaskDate || (task.exceptions && task.exceptions.includes(targetDateString))) {
                        return;
                    }


                    let isMatch = false;
                    switch (task.recurrence) {
                        case 'daily':
                            isMatch = true; // Occurs every day after original date
                            break;
                        case 'weekly':
                            // Check if it's the same day of the week
                            isMatch = (targetDate.getDay() === originalTaskDate.getDay());
                            break;
                        case 'monthly':
                            // Check if it's the same day of the month
                            isMatch = (targetDate.getDate() === originalTaskDate.getDate());
                            break;
                        // case 'yearly': // Example for yearly
                        //     isMatch = (targetDate.getMonth() === originalTaskDate.getMonth() && targetDate.getDate() === originalTaskDate.getDate());
                        //     break;
                    }

                    // Add if it matches the recurrence pattern and isn't the original non-recurring entry itself
                    if (isMatch && targetDateString !== task.originalDate) {
                        tasksOnDate.push({
                            ...task, // Copy original task data
                            date: targetDateString, // Set the date to the current instance date
                            isRecurringInstance: true, // Mark as a recurring instance
                             originalTaskIndex: index, // Store index from original array
                             originalDate: task.originalDate // Ensure originalDate is preserved
                        });
                    } else if (isMatch && targetDateString === task.originalDate) {
                         // If it's the original date of a recurring task, include it but mark it
                         tasksOnDate.push({
                             ...task,
                             date: targetDateString,
                             isRecurringInstance: false, // Treat the first occurrence like a normal task for editing/deletion simplicity initially
                             originalTaskIndex: index,
                             originalDate: task.originalDate
                         });
                    }
                }
            });
        });

        // Filter based on current filters
        const filteredTasks = tasksOnDate.filter(task => {
            const descriptionMatch = !currentSearchTerm || task.description.toLowerCase().includes(currentSearchTerm);
            const categoryMatch = currentFilterCategory === 'all' || task.category === currentFilterCategory;
            const completionMatch = currentFilterCompletion === 'all' ||
                                     (currentFilterCompletion === 'completed' && task.completed) ||
                                     (currentFilterCompletion === 'incomplete' && !task.completed);
             const hiddenMatch = !hideCompleted || !task.completed;

            return descriptionMatch && categoryMatch && completionMatch && hiddenMatch;
        });


        // Sort tasks: Priority (High > Medium > Low), then Time, then Description
         filteredTasks.sort((a, b) => {
             const priorityOrder = { high: 0, medium: 1, low: 2 };
             const priorityDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
             if (priorityDiff !== 0) return priorityDiff;

             // Time comparison (treat empty time as later)
             const timeA = a.time || '99:99';
             const timeB = b.time || '99:99';
             if (timeA !== timeB) return timeA.localeCompare(timeB);

             // Description comparison
             return a.description.localeCompare(b.description);
         });

        return filteredTasks;
    }


    // --- Rendering Functions ---

    function renderCalendar() {
        // Clear previous days, keep labels
        const dayLabels = Array.from(calendarGrid.querySelectorAll('.day-label'));
        calendarGrid.innerHTML = '';
        dayLabels.forEach(label => calendarGrid.appendChild(label));

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0:Sun, 6:Sat

        currentMonthYear.textContent = `${firstDayOfMonth.toLocaleString('default', { month: 'long' })} ${year}`;

        // Add empty placeholders for days before the 1st
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty'); // Add empty class if needed for styling
            calendarGrid.appendChild(emptyDay);
        }

        // Add day cells
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today's date

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');
            const currentDayDate = new Date(year, month, i);
             currentDayDate.setHours(0,0,0,0); // Normalize
            const dateString = formatDate(currentDayDate);
            dayCell.dataset.date = dateString;
            dayCell.setAttribute('role', 'gridcell');
             dayCell.setAttribute('tabindex', 0); // Make days focusable
             dayCell.setAttribute('aria-label', `Date ${i}, ${firstDayOfMonth.toLocaleString('default', { month: 'long' })}`);


            const tasksForDate = getTasksForDate(dateString); // Use central function
            const dayOfWeek = currentDayDate.getDay();

            // Add classes based on conditions
            if (dayOfWeek === 0 || dayOfWeek === 6) dayCell.classList.add('weekend');
            if (holidays[dateString]) dayCell.classList.add('holiday');
            if (tasksForDate.length > 0) {
                dayCell.classList.add('has-task');
                if (tasksForDate.length > 5) dayCell.classList.add('high-density');

                 // Check for incomplete tasks due soon
                const timeDiff = currentDayDate.getTime() - today.getTime();
                const dayDiff = timeDiff / (1000 * 3600 * 24);
                const hasIncompleteTaskDueSoon = tasksForDate.some(task => !task.completed);

                if (dayDiff >= 0 && dayDiff <= 7 && hasIncompleteTaskDueSoon) {
                     dayCell.classList.add('due-soon');
                }
            }
            if (currentDayDate.getTime() === today.getTime()) dayCell.classList.add('today');

            // Day Number
            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = i;
            dayCell.appendChild(dayNumber);

            // Task List Preview
            const taskListPreview = document.createElement('ul');
            taskListPreview.classList.add('task-list-preview');
            dayCell.appendChild(taskListPreview);

            // Display limited tasks in preview (respecting filters/hide)
            const previewTasks = tasksForDate.slice(0, 3); // Show max 3
            previewTasks.forEach((task, previewIndex) => {
                const taskItem = document.createElement('li');
                taskItem.draggable = true; // Make task preview draggable
                 // Store necessary data for drag operation
                 taskItem.dataset.taskId = task.id;
                 taskItem.dataset.originalDate = task.originalDate;
                 taskItem.dataset.currentDate = dateString; // Date where this instance appears
                 taskItem.dataset.taskIndex = task.originalTaskIndex; // Index in the original date's array
                 taskItem.dataset.isRecurringInstance = task.isRecurringInstance;

                // Priority Indicator
                const priorityIcon = document.createElement('span');
                priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
                priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);
                 taskItem.appendChild(priorityIcon);

                const taskText = document.createElement('span'); // Span for text content
                 taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description}`;
                 taskItem.appendChild(taskText);

                 if (task.recurrence && task.recurrence !== 'none') {
                      const recurrenceIcon = document.createElement('span');
                      recurrenceIcon.classList.add('recurrence-icon');
                      recurrenceIcon.textContent = '?'; // Unicode for repeat
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
                 moreItem.style.cursor = 'default'; // Not draggable
                taskListPreview.appendChild(moreItem);
            }

            // Event Listeners for the Day Cell
            dayCell.addEventListener('click', () => openTaskModal(dateString));
            dayCell.addEventListener('keydown', (e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                      openTaskModal(dateString);
                 }
            });

             // Drag and Drop Event Listeners for Day Cell (as Drop Target)
             dayCell.addEventListener('dragover', handleDragOver);
             dayCell.addEventListener('dragenter', handleDragEnter);
             dayCell.addEventListener('dragleave', handleDragLeave);
             dayCell.addEventListener('drop', handleDrop);


            calendarGrid.appendChild(dayCell);
        }
         // Add drag listeners to the newly rendered task preview items
         addDragListenersToTasks();
    }

    function renderModalTasks(dateString) {
        modalTaskList.innerHTML = ''; // Clear existing tasks
        const tasksForDate = getTasksForDate(dateString); // Use central function (includes recurring)

        if (tasksForDate.length === 0) {
            modalTaskList.innerHTML = '<li>No tasks for this date.</li>';
            return;
        }

        tasksForDate.forEach((task) => {
            const listItem = document.createElement('li');
            listItem.classList.add('modal-task-item');
             if (task.completed) listItem.classList.add('completed');

            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.setAttribute('aria-label', `Mark task ${task.description} as complete`);
            checkbox.dataset.taskId = task.id;
             checkbox.dataset.originalDate = task.originalDate;
             checkbox.dataset.taskIndex = task.originalTaskIndex;
             checkbox.dataset.isRecurringInstance = task.isRecurringInstance;
             checkbox.dataset.currentDate = task.date; // The date of this instance

            checkbox.addEventListener('change', (e) => {
                const target = e.target;
                 const taskId = target.dataset.taskId;
                 const originalDate = target.dataset.originalDate;
                 const taskIndex = parseInt(target.dataset.taskIndex);
                 const isRecurring = target.dataset.isRecurringInstance === 'true';
                 const currentDate = target.dataset.currentDate;

                 if (tasks[originalDate] && tasks[originalDate][taskIndex] !== undefined) {
                     // TODO: Handle completion of recurring tasks (add exception or modify original?)
                     // Simplest: Modify the original task's completed status for now.
                     // A more complex approach would add an exception for *unchecking* a completed recurring task.
                      tasks[originalDate][taskIndex].completed = target.checked;
                      saveData();
                      renderModalTasks(dateString); // Re-render modal list
                      rerenderViews(dateString); // Update calendar and month view
                 } else {
                      console.error("Task not found for completion toggle:", originalDate, taskIndex);
                 }
            });

            // Task Content (Icon, Text, Recurrence)
            const taskContent = document.createElement('span');
             taskContent.style.display = 'flex'; // Align items within span
             taskContent.style.alignItems = 'center';
             taskContent.style.gap = '5px';

            const priorityIcon = document.createElement('span');
            priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
             priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);

            const taskText = document.createElement('span'); // Inner span for text only
             taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description}`;
              if (task.completed) {
                  taskText.style.textDecoration = 'line-through'; // Apply directly
                  taskText.style.color = 'var(--completed-text-color)';
             }

            taskContent.appendChild(priorityIcon);
             taskContent.appendChild(taskText); // Append text span


            if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none')) {
                 const recurrenceIcon = document.createElement('span');
                 recurrenceIcon.classList.add('recurrence-icon');
                 recurrenceIcon.textContent = '?';
                 recurrenceIcon.title = `Recurring: ${task.recurrence}`;
                 taskContent.appendChild(recurrenceIcon);
            }

             // Optional Category Display
             if (task.category) {
                  const categorySpan = document.createElement('span');
                  categorySpan.textContent = `[${task.category}]`;
                  categorySpan.style.fontSize = '0.8em';
                  categorySpan.style.opacity = '0.7';
                  categorySpan.style.marginLeft = 'auto'; // Push to the right before actions
                  taskContent.appendChild(categorySpan);
             }


            // Actions (Edit/Delete)
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('modal-task-actions');

            const editButton = document.createElement('button');
            editButton.classList.add('edit-task-button');
            editButton.textContent = 'Edit';
             editButton.dataset.taskId = task.id;
             editButton.dataset.originalDate = task.originalDate;
             editButton.dataset.taskIndex = task.originalTaskIndex; // Index in original array
             editButton.dataset.isRecurringInstance = task.isRecurringInstance;
             editButton.dataset.currentDate = task.date; // Instance date

            editButton.setAttribute('aria-label', `Edit task: ${task.description}`);
            editButton.addEventListener('click', (e) => {
                 const target = e.target;
                  const taskToEdit = findTaskById(target.dataset.taskId, target.dataset.originalDate, parseInt(target.dataset.taskIndex));
                  if (taskToEdit) {
                       openEditTaskModal(
                            target.dataset.currentDate, // The date of the instance being viewed/edited
                            task.originalDate, // The original date stored in tasks object
                            parseInt(target.dataset.taskIndex), // Index within the original date's array
                            taskToEdit, // The actual task object from the tasks array
                            target.dataset.isRecurringInstance === 'true' // Flag if it's a recurring instance
                       );
                  } else {
                       console.error("Could not find task to edit:", target.dataset);
                       alert("Error: Could not find task data to edit.");
                  }
            });

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-task-button');
            deleteButton.textContent = 'Delete';
             deleteButton.dataset.taskId = task.id;
             deleteButton.dataset.originalDate = task.originalDate;
             deleteButton.dataset.taskIndex = task.originalTaskIndex; // Index in original array
             deleteButton.dataset.isRecurringInstance = task.isRecurringInstance;
             deleteButton.dataset.currentDate = task.date; // Instance date

            deleteButton.setAttribute('aria-label', `Delete task: ${task.description}`);
            deleteButton.addEventListener('click', (e) => {
                const target = e.target;
                 const originalDate = target.dataset.originalDate;
                 const taskIndex = parseInt(target.dataset.taskIndex);
                 const isRecurring = target.dataset.isRecurringInstance === 'true';
                 const currentDate = target.dataset.currentDate;

                if (isRecurring) {
                    // Offer choice for recurring deletion
                    if (confirm(`Delete only the occurrence on ${currentDate}? (Cancel to delete the entire series)`)) {
                         deleteTask(originalDate, taskIndex, true, currentDate); // Delete instance (adds exception)
                    } else {
                         if (confirm(`DELETE ENTIRE SERIES? This action cannot be undone.`)) {
                              deleteTask(originalDate, taskIndex, false, null); // Delete original task
                         }
                    }
                } else {
                    // Standard deletion confirmation
                    if (confirm('Are you sure you want to delete this task?')) {
                        deleteTask(originalDate, taskIndex, false, null); // Delete non-recurring or original recurring
                    }
                }
            });

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(deleteButton);

            listItem.appendChild(checkbox);
            listItem.appendChild(taskContent); // Append the content span
            listItem.appendChild(actionsDiv);

            modalTaskList.appendChild(listItem);
        });
    }


    function renderMonthTasksView() {
        monthTaskListContainer.innerHTML = ''; // Clear existing tasks

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        monthTaskViewMonthYear.textContent = `${monthName} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

         let tasksFoundInMonth = false;
         let sortedTasksByDate = {};

        // Iterate through all days of the current month to get tasks including recurring ones
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
             const currentDayDate = new Date(year, month, day);
             const dateString = formatDate(currentDayDate);
             const tasksForThisDay = getTasksForDate(dateString); // Gets filtered and sorted tasks

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
             dateHeader.textContent = dateString; // Display the full date
             dateGroup.appendChild(dateHeader);

             const taskList = document.createElement('ul');

             tasksForDate.forEach((task) => {
                 const taskItem = document.createElement('li');
                  if (task.completed) taskItem.classList.add('completed');

                  // Checkbox
                  const checkbox = document.createElement('input');
                  checkbox.type = 'checkbox';
                  checkbox.checked = task.completed;
                  checkbox.setAttribute('aria-label', `Mark task ${task.description} as complete`);
                  checkbox.dataset.taskId = task.id;
                  checkbox.dataset.originalDate = task.originalDate;
                  checkbox.dataset.taskIndex = task.originalTaskIndex;
                  checkbox.dataset.isRecurringInstance = task.isRecurringInstance;
                  checkbox.dataset.currentDate = task.date; // Date of this instance

                  checkbox.addEventListener('change', (e) => {
                      const target = e.target;
                       const taskId = target.dataset.taskId;
                       const originalDate = target.dataset.originalDate;
                       const taskIndex = parseInt(target.dataset.taskIndex);
                       const isRecurring = target.dataset.isRecurringInstance === 'true';
                       const currentDate = target.dataset.currentDate;

                       if (tasks[originalDate] && tasks[originalDate][taskIndex] !== undefined) {
                            // Apply same logic as modal checkbox
                            tasks[originalDate][taskIndex].completed = target.checked;
                            saveData();
                            renderMonthTasksView(); // Re-render month view
                            renderCalendar(); // Update calendar day style
                            // If modal is open for this date, update it too
                            if (taskModal.style.display === 'flex' && modalDateInput.value === currentDate) {
                                 renderModalTasks(currentDate);
                            }
                       } else {
                            console.error("Task not found for completion toggle:", originalDate, taskIndex);
                       }
                  });

                  // Task Content
                  const taskContent = document.createElement('span');
                 taskContent.style.display = 'flex'; // Use flex for alignment
                 taskContent.style.alignItems = 'center';
                 taskContent.style.gap = '5px';

                  const priorityIcon = document.createElement('span');
                  priorityIcon.classList.add('priority-icon', `priority-${task.priority || 'medium'}`);
                 priorityIcon.setAttribute('aria-label', `Priority: ${task.priority || 'medium'}`);

                 const taskText = document.createElement('span'); // Inner span for text
                  taskText.textContent = `${task.time ? task.time + ' - ' : ''}${task.description}`;
                 if (task.completed) {
                     taskText.style.textDecoration = 'line-through';
                     taskText.style.color = 'var(--completed-text-color)';
                 }


                  taskContent.appendChild(priorityIcon);
                 taskContent.appendChild(taskText);


                 if (task.isRecurringInstance || (task.recurrence && task.recurrence !== 'none')) {
                      const recurrenceIcon = document.createElement('span');
                      recurrenceIcon.classList.add('recurrence-icon');
                      recurrenceIcon.textContent = '?';
                      recurrenceIcon.title = `Recurring: ${task.recurrence}`;
                      taskContent.appendChild(recurrenceIcon);
                 }

                  // Optional Category Display
                  if (task.category) {
                       const categorySpan = document.createElement('span');
                       categorySpan.textContent = `[${task.category}]`;
                       categorySpan.style.fontSize = '0.8em';
                       categorySpan.style.opacity = '0.7';
                       categorySpan.style.marginLeft = 'auto'; // Push right
                       taskContent.appendChild(categorySpan);
                  }

                  // Actions
                  const actionsDiv = document.createElement('div');
                  actionsDiv.classList.add('task-actions');

                  const editButton = document.createElement('button');
                  editButton.classList.add('edit-task-button');
                  editButton.textContent = 'Edit';
                  editButton.dataset.taskId = task.id;
                  editButton.dataset.originalDate = task.originalDate;
                  editButton.dataset.taskIndex = task.originalTaskIndex;
                  editButton.dataset.isRecurringInstance = task.isRecurringInstance;
                  editButton.dataset.currentDate = task.date; // Instance date
                  editButton.setAttribute('aria-label', `Edit task: ${task.description}`);
                  editButton.addEventListener('click', (e) => {
                      const target = e.target;
                     const taskToEdit = findTaskById(target.dataset.taskId, target.dataset.originalDate, parseInt(target.dataset.taskIndex));
                       if (taskToEdit) {
                           openEditTaskModal(
                                target.dataset.currentDate, // The date of the instance being viewed/edited
                                task.originalDate, // The original date stored in tasks object
                                parseInt(target.dataset.taskIndex), // Index within the original date's array
                                taskToEdit, // The actual task object from the tasks array
                                target.dataset.isRecurringInstance === 'true' // Flag if it's a recurring instance
                           );
                       } else {
                            console.error("Could not find task to edit:", target.dataset);
                           alert("Error: Could not find task data to edit.");
                       }
                  });

                  const deleteButton = document.createElement('button');
                  deleteButton.classList.add('delete-task-button');
                  deleteButton.textContent = 'Delete';
                  deleteButton.dataset.taskId = task.id;
                  deleteButton.dataset.originalDate = task.originalDate;
                  deleteButton.dataset.taskIndex = task.originalTaskIndex;
                  deleteButton.dataset.isRecurringInstance = task.isRecurringInstance;
                  deleteButton.dataset.currentDate = task.date; // Instance date
                  deleteButton.setAttribute('aria-label', `Delete task: ${task.description}`);
                  deleteButton.addEventListener('click', (e) => {
                      const target = e.target;
                       const originalDate = target.dataset.originalDate;
                       const taskIndex = parseInt(target.dataset.taskIndex);
                       const isRecurring = target.dataset.isRecurringInstance === 'true';
                       const currentDate = target.dataset.currentDate;

                      // Use same logic as modal delete
                       if (isRecurring) {
                           if (confirm(`Delete only the occurrence on ${currentDate}? (Cancel to delete the entire series)`)) {
                                deleteTask(originalDate, taskIndex, true, currentDate);
                           } else {
                                if (confirm(`DELETE ENTIRE SERIES? This action cannot be undone.`)) {
                                     deleteTask(originalDate, taskIndex, false, null);
                                }
                           }
                       } else {
                           if (confirm('Are you sure you want to delete this task?')) {
                                deleteTask(originalDate, taskIndex, false, null);
                           }
                       }
                  });

                  actionsDiv.appendChild(editButton);
                  actionsDiv.appendChild(deleteButton);

                  taskItem.appendChild(checkbox);
                  taskItem.appendChild(taskContent);
                  taskItem.appendChild(actionsDiv);

                  taskList.appendChild(taskItem);
             });
             dateGroup.appendChild(taskList);
             monthTaskListContainer.appendChild(dateGroup);
        });
    }

    function rerenderViews(dateString = null) {
        renderCalendar();
        renderMonthTasksView();
        if (taskModal.style.display === 'flex' && modalDateInput.value === dateString && dateString) {
            renderModalTasks(dateString); // Re-render modal if open for the affected date
        }
         // Also re-render modal if it's open for the original date of a recurring task that might have been affected
         if (taskModal.style.display === 'flex' && dateString) {
              const modalDate = modalDateInput.value;
              const tasksOnModalDate = getTasksForDate(modalDate);
              if (tasksOnModalDate.some(t => t.originalDate === dateString)) {
                   renderModalTasks(modalDate);
              }
         }
    }

    // --- Modal Handling ---
    function openTaskModal(dateString) {
        modalTitleHeader.textContent = `Tasks for: ${formatDateDisplay(dateString)}`;
        modalDateInput.value = dateString;

        isHolidayCheckbox.checked = !!holidays[dateString];

        renderModalTasks(dateString);
        populateCategorySelects(); // Ensure categories are up-to-date

        taskModal.style.display = 'flex';
         addTaskForm.reset(); // Reset the form fields
         newTaskCategorySelect.value = 'General'; // Default category
         newTaskPrioritySelect.value = 'medium'; // Default priority
         newTaskRecurrenceSelect.value = 'none'; // Default recurrence
        newTaskDescriptionInput.focus(); // Focus description input
    }

    function openEditTaskModal(currentDate, originalDate, taskIndex, taskObject, isRecurringInstance) {
         if (!taskObject) {
              alert("Error: Cannot load task data for editing.");
              console.error("Task object is undefined in openEditTaskModal", currentDate, originalDate, taskIndex);
              return;
         }

        editTaskModalTitle.textContent = `Edit Task on ${formatDateDisplay(currentDate)}`;
        editTaskDescriptionInput.value = taskObject.description;
        editTaskTimeInput.value = taskObject.time || '';
        populateCategorySelects(); // Ensure categories are populated
        editTaskCategorySelect.value = taskObject.category || 'General';
        editTaskPrioritySelect.value = taskObject.priority || 'medium';
        editTaskRecurrenceSelect.value = taskObject.recurrence || 'none';
         editTaskCompletedSelect.value = taskObject.completed ? 'true' : 'false';

        editModalDateInput.value = originalDate; // Store the ORIGINAL date key
        editModalTaskIndexInput.value = taskIndex; // Store the index in the ORIGINAL date array
         editModalIsRecurringInstance.value = isRecurringInstance ? 'true' : 'false'; // Store if it's an instance

         // Show/Hide Recurring Delete Buttons
         confirmDeleteRecurringTaskButton.style.display = isRecurringInstance ? 'block' : 'none';
         confirmDeleteAllRecurringTaskButton.style.display = isRecurringInstance ? 'block' : 'none';
         confirmDeleteTaskButton.style.display = !isRecurringInstance ? 'block' : 'none'; // Show normal delete for non-instances


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
         e.preventDefault(); // Prevent default form submission
         handleAddNewTask();
    });

    function handleAddNewTask() {
        const description = newTaskDescriptionInput.value.trim();
        const time = newTaskTimeInput.value;
        let category = newTaskCategorySelect.value;
        const newCategory = addNewCategoryInput.value.trim();
        const priority = newTaskPrioritySelect.value;
        const recurrence = newTaskRecurrenceSelect.value;
        const date = modalDateInput.value;

        if (!description || !date) {
            alert('Please enter a task description.');
            return;
        }

        // Handle new category input
        if (newCategory) {
            category = newCategory;
            if (!categories.includes(category)) {
                categories.push(category);
                saveData(); // Save new categories list
                populateCategorySelects(); // Update all dropdowns
                populateFilterCategorySelect(); // Update filter dropdown
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
            originalDate: date, // Set original date
             exceptions: [] // Initialize exceptions array
        };

        addTask(newTask); // Use the dedicated add function

        // Clear the form after adding
         addTaskForm.reset();
         newTaskCategorySelect.value = 'General'; // Reset selects to defaults
         newTaskPrioritySelect.value = 'medium';
         newTaskRecurrenceSelect.value = 'none';
         // Optionally keep the modal open to add more tasks, or close it:
         // closeTaskModal();
         newTaskDescriptionInput.focus(); // Focus for next task
         renderModalTasks(date); // Re-render just the modal list immediately
    }

    confirmSaveTaskButton.addEventListener('click', () => {
        const description = editTaskDescriptionInput.value.trim();
        const time = editTaskTimeInput.value;
        const category = editTaskCategorySelect.value;
        const priority = editTaskPrioritySelect.value;
        const recurrence = editTaskRecurrenceSelect.value;
        const completed = editTaskCompletedSelect.value === 'true';

        const originalDate = editModalDateInput.value; // Original date key
        const taskIndex = parseInt(editModalTaskIndexInput.value); // Index in original array
        const isRecurringInstance = editModalIsRecurringInstance.value === 'true';
        // const currentDate = editTaskModalTitle.textContent.split('on ')[1]; // Extract date from title - find better way if title changes

        if (!description || !originalDate || isNaN(taskIndex)) {
            alert('Error: Could not save task. Invalid data.');
            return;
        }

        const updatedTaskData = {
            description: description,
            time: time,
            category: category,
            priority: priority,
            recurrence: recurrence,
            completed: completed,
            // originalDate remains the same unless explicitly changed via a date picker (not implemented here for simplicity)
             // exceptions should be handled separately (primarily during deletion)
        };

        // Currently, updating a recurring instance applies to the series.
        // Need the *current instance date* if we were to handle instance-specific logic differently.
         // For now, pass isRecurringInstance flag to updateTask, but it doesn't change much yet.
         const taskBeingEdited = findTaskById(null, originalDate, taskIndex); // Get the task object
         const instanceDate = isRecurringInstance ? taskBeingEdited?.date : null; // Get the instance date if available

        updateTask(originalDate, taskIndex, updatedTaskData, isRecurringInstance, instanceDate);
        closeEditModal();
    });


    // Delete button listeners (now handle specific recurring deletions too)
    confirmDeleteTaskButton.addEventListener('click', () => { // For non-recurring or deleting the whole series from edit modal
         const originalDate = editModalDateInput.value;
         const taskIndex = parseInt(editModalTaskIndexInput.value);
         if (confirm('Are you sure you want to delete this task (and all recurring instances if applicable)?')) {
              deleteTask(originalDate, taskIndex, false, null);
              closeEditModal();
         }
    });

     confirmDeleteRecurringTaskButton.addEventListener('click', () => { // Delete single instance
          const originalDate = editModalDateInput.value;
          const taskIndex = parseInt(editModalTaskIndexInput.value);
          const taskBeingEdited = findTaskById(null, originalDate, taskIndex);
          const instanceDate = taskBeingEdited?.date; // Get the current instance date

          if (!instanceDate) {
               alert("Error: Could not determine the date for this specific occurrence.");
               return;
          }

          if (confirm(`Delete only the task occurrence on ${instanceDate}?`)) {
               deleteTask(originalDate, taskIndex, true, instanceDate); // Delete single instance
               closeEditModal();
          }
     });

      confirmDeleteAllRecurringTaskButton.addEventListener('click', () => { // Delete whole series
           const originalDate = editModalDateInput.value;
           const taskIndex = parseInt(editModalTaskIndexInput.value);
           if (confirm('Are you sure you want to delete the entire recurring series? This cannot be undone.')) {
                deleteTask(originalDate, taskIndex, false, null); // Delete the original task definition
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
    toggleMonthViewButton.addEventListener('click', toggleMonthView);
    closeButton.addEventListener('click', closeTaskModal);
    closeEditModalButton.addEventListener('click', closeEditModal);
    closeMonthViewButton.addEventListener('click', () => toggleMonthView(false)); // Explicitly hide


    // Close modal on outside click
    window.addEventListener('click', (event) => {
        if (event.target === taskModal) closeTaskModal();
        if (event.target === editTaskModal) closeEditModal();
    });

    // Holiday checkbox listener
    isHolidayCheckbox.addEventListener('change', () => {
        const dateString = modalDateInput.value;
        if (isHolidayCheckbox.checked) {
            holidays[dateString] = true;
        } else {
            delete holidays[dateString];
        }
        saveData();
        renderCalendar(); // Re-render calendar immediately
    });

     // Search and Filter Listeners
     searchInput.addEventListener('input', (e) => {
         currentSearchTerm = e.target.value.toLowerCase();
         rerenderViews();
     });

     filterCategorySelect.addEventListener('change', (e) => {
         currentFilterCategory = e.target.value;
         rerenderViews();
     });

     filterCompletionSelect.addEventListener('change', (e) => {
         currentFilterCompletion = e.target.value;
         rerenderViews();
     });

     hideCompletedToggle.addEventListener('click', () => {
         hideCompleted = !hideCompleted;
         hideCompletedToggle.textContent = hideCompleted ? 'Show Completed' : 'Hide Completed';
          hideCompletedToggle.setAttribute('aria-pressed', hideCompleted);
         localStorage.setItem('hideCompleted', hideCompleted); // Save preference
         rerenderViews();
     });

    // --- Helper Functions ---
    function formatDate(date) {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

     function formatDateDisplay(dateString) {
          const [year, month, day] = dateString.split('-');
          const date = new Date(year, month - 1, day);
          // Use a locale-sensitive format for display
          return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
     }

    function navigateMonth(delta) {
        currentDate.setMonth(currentDate.getMonth() + delta);
        rerenderViews();
    }

    function navigateYear(delta) {
        currentDate.setFullYear(currentDate.getFullYear() + delta);
        rerenderViews();
    }

    function findTaskById(taskId, originalDate, taskIndex) {
         // Primarily uses originalDate and index as tasks object is structured by date
         if (tasks[originalDate] && tasks[originalDate][taskIndex]) {
             // Optionally verify ID if provided, though index should be sufficient
              if (taskId && tasks[originalDate][taskIndex].id !== taskId) {
                   console.warn("Task ID mismatch for index:", taskId, originalDate, taskIndex);
                   // Fallback: search by ID if index lookup fails or mismatches?
                   // This indicates a potential data inconsistency issue.
                   return tasks[originalDate].find(t => t.id === taskId);
              }
              return tasks[originalDate][taskIndex];
         }
         return null; // Task not found
    }


    function populateCategorySelects() {
        // Store current values if they exist
        const currentNewTaskVal = newTaskCategorySelect.value;
        const currentEditTaskVal = editTaskCategorySelect.value;

        newTaskCategorySelect.innerHTML = '';
        editTaskCategorySelect.innerHTML = '';

        // Add default "General" if not present, ensure it's first common option
         if (!categories.includes('General')) {
             categories.unshift('General');
         }

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            newTaskCategorySelect.appendChild(option.cloneNode(true));
            editTaskCategorySelect.appendChild(option.cloneNode(true));
        });

         // Restore previous selection if possible, otherwise default to General
         newTaskCategorySelect.value = categories.includes(currentNewTaskVal) ? currentNewTaskVal : 'General';
         editTaskCategorySelect.value = categories.includes(currentEditTaskVal) ? currentEditTaskVal : 'General';
    }

    function populateFilterCategorySelect() {
         const currentFilterVal = filterCategorySelect.value;
         filterCategorySelect.innerHTML = '<option value="all">All Categories</option>'; // Start with 'All'
         categories.forEach(category => {
             const option = document.createElement('option');
             option.value = category;
             option.textContent = category;
             filterCategorySelect.appendChild(option);
         });
         // Restore selection if possible
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
            // No class needed for light, it's default via CSS
            darkModeToggle.textContent = 'Light Mode';
        }
        saveData(); // Save mode preference
        // Re-rendering happens automatically via filter/search changes or navigation
        // No explicit rerender needed here unless specific elements outside calendar need update
    }

    function applySavedModePreference() {
        body.classList.remove('light-mode', 'dark-mode', 'gray-mode'); // Clear first
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
         // If forceState is boolean, use it; otherwise toggle
         isMonthViewVisible = typeof forceState === 'boolean' ? forceState : !isMonthViewVisible;
         monthTaskView.style.display = isMonthViewVisible ? 'block' : 'none';
         toggleMonthViewButton.textContent = isMonthViewVisible ? 'Hide Month Tasks' : 'Show Month Tasks';
          toggleMonthViewButton.setAttribute('aria-expanded', isMonthViewVisible);
         saveData(); // Save preference
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
            const dataToSave = {
                tasks: tasks,
                holidays: holidays,
                categories: categories,
                mode: currentMode,
                 // Add other settings if needed
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToSave, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `calendar_backup_${formatDate(new Date())}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (error) {
            console.error("Error downloading tasks:", error);
            alert("Could not download tasks. See console for details.");
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

                // Basic validation
                if (typeof importedData !== 'object' || importedData === null) {
                     throw new Error("Invalid file format.");
                }

                if (confirm("Importing will overwrite current tasks, holidays, and settings. Continue?")) {
                    // Process imported data (add more robust validation as needed)
                    tasks = importedData.tasks || {};
                    holidays = importedData.holidays || {};
                    categories = importedData.categories || ['General', 'Work', 'Personal'];
                    currentMode = importedData.mode || 'light';
                     // Potentially import other settings like hideCompleted, monthViewVisible

                     // Re-initialize state based on imported data
                     applySavedModePreference();
                     populateCategorySelects();
                     populateFilterCategorySelect();
                     saveData(); // Save the newly imported data
                     rerenderViews(); // Update UI fully
                     alert("Data imported successfully!");
                }

            } catch (error) {
                console.error("Error importing tasks:", error);
                alert(`Could not import tasks. Error: ${error.message}`);
            } finally {
                // Reset file input to allow importing the same file again if needed
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
              item.addEventListener('dragstart', handleDragStart);
              item.addEventListener('dragend', handleDragEnd);
          });
     }

     function handleDragStart(e) {
         // Check if the event target is indeed a draggable task item
         if (e.target.matches('.task-list-preview li[draggable="true"]')) {
              draggedTaskData = {
                  taskId: e.target.dataset.taskId,
                  originalDate: e.target.dataset.originalDate,
                  taskIndex: parseInt(e.target.dataset.taskIndex),
                  isRecurringInstance: e.target.dataset.isRecurringInstance === 'true',
                   currentDate: e.target.dataset.currentDate // Date it's being dragged FROM
              };
              e.dataTransfer.effectAllowed = 'move';
              // Optional: Set data for external drops (less relevant here)
              // e.dataTransfer.setData('text/plain', JSON.stringify(draggedTaskData));
              e.target.classList.add('dragging'); // Visual feedback
              console.log("Drag Start:", draggedTaskData);
         } else {
              e.preventDefault(); // Prevent dragging if not the intended element
         }
     }


     function handleDragEnd(e) {
         if (e.target.matches('.task-list-preview li[draggable="true"]')) {
              e.target.classList.remove('dragging');
              // Clear visual feedback from all potential drop targets
              calendarGrid.querySelectorAll('.day.drag-over').forEach(d => d.classList.remove('drag-over'));
              draggedTaskData = null; // Clear dragged data
              console.log("Drag End");
         }
     }

     function handleDragOver(e) {
         e.preventDefault(); // Necessary to allow dropping
         e.dataTransfer.dropEffect = 'move';
          // Add visual feedback to the potential drop target day
         if (e.target.closest('.day')) {
             e.target.closest('.day').classList.add('drag-over');
         }
     }

     function handleDragEnter(e) {
          // Optional stricter feedback: only add class if entering a valid day cell
         if (e.target.closest('.day') && !e.target.closest('.day').classList.contains('empty')) {
             e.target.closest('.day').classList.add('drag-over');
         }
     }

     function handleDragLeave(e) {
          // Remove visual feedback when leaving the day cell
         if (e.target.closest('.day')) {
              e.target.closest('.day').classList.remove('drag-over');
         }
     }

     function handleDrop(e) {
         e.preventDefault();
         const dropTargetDay = e.target.closest('.day');
         if (dropTargetDay && !dropTargetDay.classList.contains('empty') && draggedTaskData) {
             const targetDate = dropTargetDay.dataset.date;
             dropTargetDay.classList.remove('drag-over'); // Remove highlight

             console.log(`Attempting to drop task ${draggedTaskData.taskId} onto ${targetDate}`);

             // Prevent dropping onto the same day
             if (targetDate === draggedTaskData.currentDate) {
                 console.log("Dropped onto the same day. No action.");
                 draggedTaskData = null;
                 return;
             }

             const { taskId, originalDate, taskIndex, isRecurringInstance, currentDate: sourceDate } = draggedTaskData;

             // --- Logic for Moving the Task ---
             const taskToMove = findTaskById(taskId, originalDate, taskIndex);

             if (!taskToMove) {
                 console.error("Cannot find task to move:", draggedTaskData);
                 alert("Error: Could not move task.");
                 draggedTaskData = null;
                 return;
             }

             // Handle Recurring Task Drag/Drop
             if (isRecurringInstance || taskToMove.recurrence !== 'none') {
                  // Ask user how to handle recurring drag/drop
                  if (confirm(`Move only the occurrence from ${sourceDate} to ${targetDate}? (Cancel to move the entire series starting from ${targetDate})`)) {
                       // == Move Single Instance ==
                       // 1. Add an exception for the sourceDate to the original task
                       if (!taskToMove.exceptions) taskToMove.exceptions = [];
                       taskToMove.exceptions.push(sourceDate);

                       // 2. Create a new, non-recurring task on the targetDate based on the moved instance
                       const newSingleTask = {
                            ...taskToMove, // Copy most properties
                            id: generateTaskId(targetDate), // New ID
                            originalDate: targetDate, // It's now its own original task
                            recurrence: 'none', // No longer recurring
                            exceptions: [], // No exceptions for this new task
                            // Keep description, time, priority, category, completed status etc.
                            // Potentially reset completed status? Depends on desired UX.
                            // completed: false,
                       };
                       addTask(newSingleTask); // Add the new task
                        console.log(`Moved single instance: Added exception to ${originalDate} for ${sourceDate}, created new task on ${targetDate}`);

                  } else {
                       // == Move Entire Series ==
                       if (confirm(`MOVE ENTIRE SERIES? This will change the starting date to ${targetDate} and adjust all future occurrences.`)) {
                            // 1. Update the originalDate of the task definition
                            taskToMove.originalDate = targetDate;
                            // 2. Potentially clear existing exceptions? Or keep them relative to the old start date? Complex. Let's clear them for simplicity.
                             taskToMove.exceptions = [];
                             console.log(`Moved entire series: Updated originalDate of task ${taskId} to ${targetDate}`);
                             // No need to explicitly move in the `tasks` object if we just update originalDate,
                             // but we *must* remove the old entry if originalDate was the key
                             if (originalDate === sourceDate) { // Check if the key needs changing
                                  const taskDefinition = tasks[originalDate].splice(taskIndex, 1)[0]; // Remove from old array
                                  if (tasks[originalDate].length === 0) delete tasks[originalDate]; // Clean up old date key if empty

                                  if (!tasks[targetDate]) tasks[targetDate] = []; // Ensure target date array exists
                                  tasks[targetDate].push(taskDefinition); // Add to new date array
                             }
                             // If originalDate != sourceDate, it means the dragged item was already an instance,
                             // and we just update the originalDate property within its definition.
                       } else {
                            // User cancelled moving the series
                             draggedTaskData = null;
                            return;
                       }
                  }

             } else {
                  // == Move Non-Recurring Task ==
                  // 1. Remove task from source date array
                  const taskDefinition = tasks[originalDate].splice(taskIndex, 1)[0];
                  if (tasks[originalDate].length === 0) {
                      delete tasks[originalDate];
                  }
                  // 2. Update its originalDate property
                  taskDefinition.originalDate = targetDate;
                  // 3. Add task to target date array
                  if (!tasks[targetDate]) {
                      tasks[targetDate] = [];
                  }
                  tasks[targetDate].push(taskDefinition);
                  console.log(`Moved non-recurring task ${taskId} from ${originalDate} to ${targetDate}`);
             }

             saveData(); // Save changes
             rerenderViews(); // Update UI

         } else {
             console.log("Drop occurred on invalid target or no task data.");
              if (dropTargetDay) dropTargetDay.classList.remove('drag-over');
         }
         draggedTaskData = null; // Clear data after drop attempt
     }


}); // End DOMContentLoaded

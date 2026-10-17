
const inputElement = document.querySelector('#todo-input');
const priorityInput = document.querySelector('#todo-priority');
const dateInput = document.querySelector('#todo-date');
const todoList = document.querySelector('#todo-list');
const emptyMessage = document.querySelector('#empty-message');
const searchInput = document.querySelector('#search-input');
const priorityFilter = document.querySelector('#priority-filter');
const statusFilter = document.querySelector('#status-filter');
const noResults = document.querySelector('#no-results');
const taskForm = document.querySelector('#task-form');

let nextTaskId = 1;

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isOverdue(task) {
    return Boolean(
        task.dueDate &&
        task.dueDate < getToday() &&
        !task.completed
    );
}

function addTodo(event) {
    if (event) event.preventDefault();

    const text = inputElement.value.trim();

    if (!text) {
        alert('Please enter a task!');
        inputElement.focus();
        return;
    }

    createTask({
        id: nextTaskId++,
        text: text,
        completed: false,
        priority: priorityInput.value,
        dueDate: dateInput.value
    });

    saveTasks();
    updateCount();
    applyFilters();

    taskForm.reset();
    priorityInput.value = 'Medium';
    inputElement.focus();
}

function createTask(task) {
    const li = document.createElement('li');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Mark task completed');

    const details = document.createElement('div');
    details.className = 'task-details';

    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge ${task.priority.toLowerCase()}`;
    priorityBadge.textContent = task.priority;

    const dueDate = document.createElement('span');
    dueDate.className = 'due-date';

    const statusBadge = document.createElement('span');
    statusBadge.className = 'status-badge';

    meta.append(priorityBadge, dueDate, statusBadge);
    details.append(taskText, meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'edit-button';
    editButton.textContent = 'Edit';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';

    function updateTaskDisplay() {
        taskText.classList.toggle('completed-text', checkbox.checked);

        if (task.dueDate) {
            dueDate.textContent = `Due: ${task.dueDate}`;
        } else {
            dueDate.textContent = 'No deadline';
        }

        const overdue = isOverdue({
            dueDate: task.dueDate,
            completed: checkbox.checked
        });

        li.classList.toggle('overdue-task', overdue);

        if (checkbox.checked) {
            statusBadge.textContent = 'Completed';
            statusBadge.className = 'status-badge completed-status';
        } else if (overdue) {
            statusBadge.textContent = 'Overdue';
            statusBadge.className = 'status-badge overdue-status';
        } else {
            statusBadge.textContent = 'Pending';
            statusBadge.className = 'status-badge pending-status';
        }
    }

    checkbox.addEventListener('change', function () {
        task.completed = checkbox.checked;
        updateTaskDisplay();
        saveTasks();
        updateCount();
        applyFilters();
    });

    editButton.addEventListener('click', function () {
        const newText = prompt('Edit task name:', taskText.textContent);
        if (newText === null) return;

        if (!newText.trim()) {
            alert('Task name cannot be empty!');
            return;
        }

        const newPriority = prompt(
            'Priority: High, Medium or Low',
            task.priority
        );
        if (newPriority === null) return;

        const normalizedPriority = newPriority.trim().toLowerCase();
        const priorities = {
            high: 'High',
            medium: 'Medium',
            low: 'Low'
        };

        if (!priorities[normalizedPriority]) {
            alert('Please enter High, Medium or Low.');
            return;
        }

        const newDate = prompt(
            'Due date (YYYY-MM-DD), or leave blank for no deadline:',
            task.dueDate || ''
        );
        if (newDate === null) return;

        if (newDate && !isValidDate(newDate)) {
            alert('Please enter a valid date in YYYY-MM-DD format.');
            return;
        }

        task.text = newText.trim();
        task.priority = priorities[normalizedPriority];
        task.dueDate = newDate;

        taskText.textContent = task.text;
        priorityBadge.textContent = task.priority;
        priorityBadge.className =
            `priority-badge ${task.priority.toLowerCase()}`;

        updateTaskDisplay();
        saveTasks();
        updateCount();
        applyFilters();
    });

    deleteButton.addEventListener('click', function () {
        li.remove();
        saveTasks();
        updateCount();
        applyFilters();
    });

    actions.append(editButton, deleteButton);
    li.append(checkbox, details, actions);
    todoList.appendChild(li);

    updateTaskDisplay();
}

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00`);
    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}

function clearCompleted() {
    const completed = todoList.querySelectorAll(
        'input[type="checkbox"]:checked'
    );

    if (completed.length === 0) {
        alert('There are no completed tasks to clear!');
        return;
    }

    completed.forEach(function (checkbox) {
        checkbox.closest('li').remove();
    });

    saveTasks();
    updateCount();
    applyFilters();
}

function updateCount() {
    const tasks = [...todoList.querySelectorAll('li')];
    const completed = tasks.filter(function (li) {
        return li.querySelector('input[type="checkbox"]').checked;
    }).length;

    document.querySelector('#todo-count').textContent = tasks.length;
    document.querySelector('#pending-count').textContent =
        tasks.length - completed;
    document.querySelector('#completed-count').textContent = completed;

    emptyMessage.style.display = tasks.length === 0 ? 'block' : 'none';
}

function applyFilters() {
    const search = searchInput.value.trim().toLowerCase();
    const selectedPriority = priorityFilter.value;
    const selectedStatus = statusFilter.value;
    let visibleCount = 0;

    todoList.querySelectorAll('li').forEach(function (li) {
        const text = li.querySelector('.task-text').textContent.toLowerCase();
        const checkbox = li.querySelector('input[type="checkbox"]');
        const priority = li.querySelector('.priority-badge').textContent;
        const dueDateText = li.querySelector('.due-date').textContent;
        const dueDate = dueDateText.startsWith('Due: ')
            ? dueDateText.slice(5)
            : '';

        const matchesSearch = text.includes(search);
        const matchesPriority =
            selectedPriority === 'All' || priority === selectedPriority;

        const overdue = isOverdue({
            dueDate: dueDate,
            completed: checkbox.checked
        });

        let matchesStatus = true;

        if (selectedStatus === 'Pending') {
            matchesStatus = !checkbox.checked && !overdue;
        } else if (selectedStatus === 'Completed') {
            matchesStatus = checkbox.checked;
        } else if (selectedStatus === 'Overdue') {
            matchesStatus = overdue;
        }

        const visible = matchesSearch && matchesPriority && matchesStatus;
        li.style.display = visible ? 'flex' : 'none';

        if (visible) visibleCount++;
    });

    noResults.style.display =
        visibleCount === 0 && todoList.children.length > 0
            ? 'block'
            : 'none';
}

function saveTasks() {
    const tasks = [];

    todoList.querySelectorAll('li').forEach(function (li) {
        const checkbox = li.querySelector('input[type="checkbox"]');

        tasks.push({
            id: Number(li.dataset.id),
            text: li.querySelector('.task-text').textContent,
            completed: checkbox.checked,
            priority: li.querySelector('.priority-badge').textContent,
            dueDate: li.querySelector('.due-date').textContent.startsWith('Due: ')
                ? li.querySelector('.due-date').textContent.slice(5)
                : ''
        });
    });

    localStorage.setItem('myTodos', JSON.stringify(tasks));
}

function loadTasks() {
    try {
        const savedData = localStorage.getItem('myTodos');
        const tasks = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(tasks)) return;

        tasks.forEach(function (savedTask) {
            if (!savedTask || typeof savedTask.text !== 'string') return;

            const priority = ['High', 'Medium', 'Low'].includes(savedTask.priority)
                ? savedTask.priority
                : 'Medium';

            const task = {
                id: Number.isFinite(Number(savedTask.id))
                    ? Number(savedTask.id)
                    : nextTaskId,
                text: savedTask.text,
                completed: Boolean(savedTask.completed),
                priority: priority,
                dueDate: typeof savedTask.dueDate === 'string'
                    ? savedTask.dueDate
                    : ''
            };

            nextTaskId = Math.max(nextTaskId, task.id + 1);
            createTask(task);
        });
    } catch (error) {
        console.error('Could not load saved tasks:', error);
    }

    updateCount();
    applyFilters();
}

taskForm.addEventListener('submit', addTodo);

document.querySelector('#clear-completed')
    .addEventListener('click', clearCompleted);

searchInput.addEventListener('input', applyFilters);
priorityFilter.addEventListener('change', applyFilters);
statusFilter.addEventListener('change', applyFilters);

loadTasks();

// DOM Elements
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const taskCount = document.getElementById('taskCount');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const filterBtns = document.querySelectorAll('.filter-btn');

// App State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let editingTaskId = null;

// Initial render
renderTasks();
updateTaskCount();

// Event Listeners
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (editingTaskId) {
            updateTask();
        } else {
            addTask();
        }
    }
});
searchInput.addEventListener('input', filterTasks);
clearCompletedBtn.addEventListener('click', clearCompleted);
clearAllBtn.addEventListener('click', clearAll);
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderTasks();
    });
});

// Functions
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') return;
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        date: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveToLocalStorage();
    renderTasks();
    updateTaskCount();
    
    taskInput.value = '';
    taskInput.focus();
}

function toggleTaskStatus(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveToLocalStorage();
    renderTasks();
    updateTaskCount();
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveToLocalStorage();
    renderTasks();
    updateTaskCount();
}

function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveToLocalStorage();
    renderTasks();
    updateTaskCount();
}

function clearAll() {
    if (confirm('Are you sure you want to delete all tasks?')) {
        tasks = [];
        saveToLocalStorage();
        renderTasks();
        updateTaskCount();
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    editingTaskId = id;
    taskInput.value = task.text;
    taskInput.focus();
    
    // Change button appearance
    addTaskBtn.innerHTML = '<i class="fas fa-save"></i>';
    addTaskBtn.classList.add('editing');
    
    // Add event listener for update
    addTaskBtn.removeEventListener('click', addTask);
    addTaskBtn.addEventListener('click', updateTask);
    
    // Scroll to input
    taskInput.scrollIntoView({ behavior: 'smooth' });
}

function updateTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') return;
    
    tasks = tasks.map(task => {
        if (task.id === editingTaskId) {
            return { 
                ...task, 
                text: taskText,
                date: new Date().toISOString() // Update the date when edited
            };
        }
        return task;
    });
    
    saveToLocalStorage();
    
    // Reset editing state
    editingTaskId = null;
    taskInput.value = '';
    
    // Restore button appearance
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addTaskBtn.classList.remove('editing');
    
    // Restore event listener
    addTaskBtn.removeEventListener('click', updateTask);
    addTaskBtn.addEventListener('click', addTask);
    
    renderTasks();
}

function cancelEdit() {
    // Reset editing state
    editingTaskId = null;
    taskInput.value = '';
    
    // Restore button appearance
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addTaskBtn.classList.remove('editing');
    
    // Restore event listener
    addTaskBtn.removeEventListener('click', updateTask);
    addTaskBtn.addEventListener('click', addTask);
}

function filterTasks() {
    const searchTerm = searchInput.value.toLowerCase();
    renderTasks(searchTerm);
}

function renderTasks(searchTerm = '') {
    // Clear the task list
    taskList.innerHTML = '';
    
    // Filter tasks based on search term and current filter
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.text.toLowerCase().includes(searchTerm);
        
        if (currentFilter === 'all') return matchesSearch;
        if (currentFilter === 'active') return !task.completed && matchesSearch;
        if (currentFilter === 'completed') return task.completed && matchesSearch;
        
        return matchesSearch;
    });
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        if (searchTerm) {
            emptyState.innerHTML = `
                <i class="fas fa-search"></i>
                <p>No tasks match your search</p>
            `;
        } else if (tasks.length === 0) {
            emptyState.innerHTML = `
                <i class="fas fa-tasks"></i>
                <p>Your task list is empty</p>
                <p>Add a new task to get started</p>
            `;
        } else {
            emptyState.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <p>No ${currentFilter === 'active' ? 'active' : 'completed'} tasks</p>
            `;
        }
        
        taskList.appendChild(emptyState);
        return;
    }
    
    // Render each task
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        // Highlight task being edited
        if (editingTaskId === task.id) {
            taskItem.classList.add('editing');
        }
        
        // Format the date
        const taskDate = new Date(task.date);
        const formattedDate = taskDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <div>
                <div class="task-text">${task.text}</div>
                <div class="task-date">${formattedDate}</div>
            </div>
            <div class="task-actions">
                <button class="task-edit" title="Edit task">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="task-delete" title="Delete task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Add event listeners to task item elements
        const checkbox = taskItem.querySelector('.task-checkbox');
        const editBtn = taskItem.querySelector('.task-edit');
        const deleteBtn = taskItem.querySelector('.task-delete');
        const taskText = taskItem.querySelector('.task-text');
        
        checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        // Add double-tap to edit for mobile
        let lastTap = 0;
        taskText.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                editTask(task.id);
            }
            
            lastTap = currentTime;
        });
        
        taskList.appendChild(taskItem);
    });
}

function updateTaskCount() {
    const remainingTasks = tasks.filter(task => !task.completed).length;
    taskCount.textContent = remainingTasks;
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Animation effects for the UI
document.addEventListener('DOMContentLoaded', () => {
    // Add a slight delay to make the animation visible
    setTimeout(() => {
        document.querySelector('.container').style.opacity = '1';
        document.querySelector('.container').style.transform = 'translateY(0)';
    }, 100);
    
    // Listen for escape key to cancel editing
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editingTaskId !== null) {
            cancelEdit();
        }
    });
    
    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', () => {
        // Brief timeout to let the browser adjust
        setTimeout(() => {
            // Adjust scrollable area height
            const viewportHeight = window.innerHeight;
            const taskContainer = document.querySelector('.task-container');
            if (taskContainer) {
                // On mobile, keep some space for the rest of the UI
                if (window.innerWidth <= 640) {
                    taskContainer.style.maxHeight = `${viewportHeight - 300}px`;
                } else {
                    taskContainer.style.maxHeight = ''; // Reset to CSS value
                }
            }
        }, 200);
    });
    
    // Fire once on load to set initial sizes
    if (window.innerWidth <= 640) {
        const viewportHeight = window.innerHeight;
        const taskContainer = document.querySelector('.task-container');
        if (taskContainer) {
            taskContainer.style.maxHeight = `${viewportHeight - 300}px`;
        }
    }
}); 
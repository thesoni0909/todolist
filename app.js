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
    
    // Add new task with animation
    tasks.unshift(newTask);
    saveToLocalStorage();
    renderTasks();
    updateTaskCount();
    
    taskInput.value = '';
    taskInput.focus();
    
    // Flash animation for success feedback
    const container = document.querySelector('.container');
    container.classList.add('flash-success');
    setTimeout(() => {
        container.classList.remove('flash-success');
    }, 500);
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
    // Get the task element to animate it
    const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
    if (taskElement) {
        // Add fade-out animation
        taskElement.classList.add('task-delete-animation');
        
        // Remove after animation completes
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            saveToLocalStorage();
            renderTasks();
            updateTaskCount();
        }, 300);
    } else {
        // Fallback if element not found
        tasks = tasks.filter(task => task.id !== id);
        saveToLocalStorage();
        renderTasks();
        updateTaskCount();
    }
}

function clearCompleted() {
    const completedTaskElements = document.querySelectorAll('.task-item.completed');
    
    if (completedTaskElements.length > 0) {
        // Animate all completed tasks
        completedTaskElements.forEach(el => {
            el.classList.add('task-delete-animation');
        });
        
        // Remove after animation
        setTimeout(() => {
            tasks = tasks.filter(task => !task.completed);
            saveToLocalStorage();
            renderTasks();
            updateTaskCount();
        }, 300);
    }
}

function clearAll() {
    if (confirm('Are you sure you want to delete all tasks?')) {
        const allTaskElements = document.querySelectorAll('.task-item');
        
        if (allTaskElements.length > 0) {
            // Animate all tasks
            allTaskElements.forEach((el, index) => {
                // Stagger removal for visual effect
                setTimeout(() => {
                    el.classList.add('task-delete-animation');
                }, index * 50);
            });
            
            // Remove after animation
            setTimeout(() => {
                tasks = [];
                saveToLocalStorage();
                renderTasks();
                updateTaskCount();
            }, 300);
        }
    }
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    // If already editing another task, cancel it first
    if (editingTaskId && editingTaskId !== id) {
        cancelEdit();
    }
    
    editingTaskId = id;
    taskInput.value = task.text;
    taskInput.focus();
    
    // Change button appearance
    addTaskBtn.innerHTML = '<i class="fas fa-save"></i>';
    addTaskBtn.classList.add('editing');
    
    // Add event listener for update
    addTaskBtn.removeEventListener('click', addTask);
    addTaskBtn.addEventListener('click', updateTask);
    
    // Highlight the task being edited
    const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('editing');
        // Smooth scroll to the task being edited
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Smooth scroll to input
    setTimeout(() => {
        taskInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
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
    const oldEditingId = editingTaskId;
    editingTaskId = null;
    taskInput.value = '';
    
    // Restore button appearance
    addTaskBtn.innerHTML = '<i class="fas fa-plus"></i>';
    addTaskBtn.classList.remove('editing');
    
    // Restore event listener
    addTaskBtn.removeEventListener('click', updateTask);
    addTaskBtn.addEventListener('click', addTask);
    
    renderTasks();
    
    // Highlight updated task briefly
    setTimeout(() => {
        const updatedTaskElement = document.querySelector(`.task-item[data-id="${oldEditingId}"]`);
        if (updatedTaskElement) {
            updatedTaskElement.classList.add('task-updated');
            setTimeout(() => {
                updatedTaskElement.classList.remove('task-updated');
            }, 1000);
        }
    }, 50);
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
    
    // Remove editing highlight from all tasks
    document.querySelectorAll('.task-item.editing').forEach(item => {
        item.classList.remove('editing');
    });
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
                <p>Try a different search term</p>
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
                <p>Change the filter to see other tasks</p>
            `;
        }
        
        taskList.appendChild(emptyState);
        return;
    }
    
    // Render each task with animation delay for staggered appearance
    filteredTasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        // Add animation delay for staggered appearance
        taskItem.style.animationDelay = `${index * 50}ms`;
        
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
        
        checkbox.addEventListener('change', () => {
            // Add animation before toggling status
            taskItem.classList.add(taskItem.classList.contains('completed') ? 'uncompleting' : 'completing');
            setTimeout(() => {
                toggleTaskStatus(task.id);
            }, 300);
        });
        
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
    
    // Update clear buttons visibility
    clearCompletedBtn.style.display = tasks.some(task => task.completed) ? 'block' : 'none';
    clearAllBtn.style.display = tasks.length > 0 ? 'block' : 'none';
}

function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Setup video background
function setupVideoBackground() {
    const video = document.getElementById('backgroundVideo');
    
    // Handle video errors
    video.addEventListener('error', function() {
        document.body.style.background = 'linear-gradient(135deg, #1e293b, #0f172a)';
    });
    
    // Pause video when tab is not visible to improve performance
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            video.pause();
        } else {
            video.play();
        }
    });
}

// Animation effects for the UI
document.addEventListener('DOMContentLoaded', () => {
    // Add a slight delay to make the animation visible
    setTimeout(() => {
        document.querySelector('.container').style.opacity = '1';
        document.querySelector('.container').style.transform = 'translateY(0)';
    }, 100);
    
    // Setup video background
    setupVideoBackground();
    
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
    
    // Add swipe detection for tasks on mobile
    setupSwipeToDelete();
});

// Add swipe detection for tasks on mobile
function setupSwipeToDelete() {
    // Only for touch devices
    if (!('ontouchstart' in window)) return;
    
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('touchend', handleTouchEnd, false);
    
    let xDown = null;
    let yDown = null;
    let currentElement = null;
    let swiping = false;
    
    function handleTouchStart(evt) {
        const el = evt.target.closest('.task-item');
        if (!el) return;
        
        currentElement = el;
        xDown = evt.touches[0].clientX;
        yDown = evt.touches[0].clientY;
        swiping = false;
    }
    
    function handleTouchMove(evt) {
        if (!xDown || !yDown || !currentElement) return;
        
        const xUp = evt.touches[0].clientX;
        const yUp = evt.touches[0].clientY;
        
        const xDiff = xDown - xUp;
        const yDiff = yDown - yUp;
        
        // Detect horizontal swipe (and make sure it's not a scroll)
        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 40) {
            swiping = true;
            
            // Swipe left to delete
            if (xDiff > 0) {
                currentElement.style.transform = `translateX(${-Math.min(Math.abs(xDiff), 100)}px)`;
                currentElement.style.opacity = 1 - (Math.min(Math.abs(xDiff), 100) / 100 * 0.5);
            }
            
            // Prevent scrolling when swiping
            evt.preventDefault();
        }
    }
    
    function handleTouchEnd(evt) {
        if (!currentElement || !swiping) return;
        
        // If swiped far enough, delete the task
        const taskId = currentElement.dataset.id;
        const transform = currentElement.style.transform;
        const translateX = transform ? parseInt(transform.replace(/[^\d-]/g, '')) : 0;
        
        if (Math.abs(translateX) > 80) {
            // Complete the swipe-out animation
            currentElement.style.transform = 'translateX(-100%)';
            currentElement.style.opacity = '0';
            
            // Delete the task after animation
            setTimeout(() => {
                deleteTask(parseInt(taskId));
            }, 300);
        } else {
            // Reset position if not swiped far enough
            currentElement.style.transform = 'translateX(0)';
            currentElement.style.opacity = '1';
        }
        
        // Reset touch tracking
        xDown = null;
        yDown = null;
        currentElement = null;
        swiping = false;
    }
} 
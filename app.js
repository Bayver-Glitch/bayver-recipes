// Recipe Manager & Meal Planner App
let recipes = [];
let currentMenu = {};
let currentRecipe = null;

// Password protection
const ACCESS_PASSWORD = 'bayver2026'; // You can change this password
const SESSION_KEY = 'recipeAccessGranted';

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing session
    const hasAccess = sessionStorage.getItem(SESSION_KEY) === 'true';

    if (hasAccess) {
        // Hide login screen, show app
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        initializeApp();
    } else {
        // Show login screen
        setupLogin();
    }
});

function setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    const passwordInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error');
    
    function attemptLogin() {
        const entered = passwordInput.value.trim();
        if (entered === ACCESS_PASSWORD) {
            // Correct password
            sessionStorage.setItem(SESSION_KEY, 'true');
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
            errorMsg.style.display = 'none';
            initializeApp();
        } else {
            // Wrong password
            errorMsg.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    loginBtn.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
    });
    passwordInput.focus();
}

function initializeApp() {
    loadRecipes();
    loadMenuFromStorage();
    setupEventListeners();
    setupTabs();
    renderFeaturedRecipe();
}

// Load recipes from JSON
async function loadRecipes() {
    try {
        const response = await fetch('recipes.json');
        if (!response.ok) throw new Error('Failed to load recipes.json');
        const data = await response.json();
        
        // Get deleted recipes from localStorage
        const deletedRecipes = JSON.parse(localStorage.getItem('deletedRecipes') || '[]');
        
        // Get ratings, favorites, and edits from localStorage
        const ratings = JSON.parse(localStorage.getItem('recipeRatings') || '{}');
        const favorites = JSON.parse(localStorage.getItem('recipeFavorites') || '[]');
        const edits = JSON.parse(localStorage.getItem('recipeEdits') || '{}');
        
        // Normalize recipe data structure and filter out deleted
        recipes = data
            .filter(r => !deletedRecipes.includes(String(r.id)))
            .map(r => {
                const recipe = {
                    ...r,
                    main_ingredient: r.tags?.main_ingredient || r.main_ingredient || '',
                    meal_type: r.tags?.meal_type || r.meal_type || 'dinner',
                    cuisine: r.tags?.cuisine || r.cuisine || 'american',
                    difficulty: r.tags?.difficulty || r.difficulty || 'medium',
                    crockpot: r.tags?.crockpot || r.crockpot || false,
                    rating: ratings[r.id] || 0,
                    isFavorite: favorites.includes(r.id)
                };
                
                // Apply any saved edits
                if (edits[r.id]) {
                    Object.assign(recipe, edits[r.id]);
                }
                
                return recipe;
            });
        renderRecipes();
        renderCalendar();
    } catch (error) {
        console.error('Failed to load recipes:', error);
        // Show error in the grid
        document.getElementById('recipes-grid').innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h3>Error Loading Recipes</h3>
                <p>Could not load recipes.json. Make sure you're running this from a web server, not just opening the file.</p>
                <p><strong>Quick fix:</strong> Use VS Code Live Server extension, or Python server:</p>
                <code>python -m http.server 8000</code>
            </div>
        `;
    }
}

// Setup tab navigation
function setupTabs() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Filter changes
    const mealFilter = document.getElementById('filter-meal');
    const cuisineFilter = document.getElementById('filter-cuisine');
    const favoritesFilter = document.getElementById('filter-favorites');
    const searchFilter = document.getElementById('filter-search');
    const clearFiltersBtn = document.getElementById('clear-filters');

    if (mealFilter) mealFilter.addEventListener('change', renderRecipes);
    if (cuisineFilter) cuisineFilter.addEventListener('change', renderRecipes);
    if (favoritesFilter) favoritesFilter.addEventListener('change', renderRecipes);
    if (searchFilter) searchFilter.addEventListener('input', renderRecipes);

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            document.getElementById('filter-meal').value = '';
            document.getElementById('filter-cuisine').value = '';
            document.getElementById('filter-favorites').value = '';
            document.getElementById('filter-search').value = '';
            renderRecipes();
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    // Edit modal cancel button
    const cancelEditBtn = document.getElementById('cancel-edit');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            document.getElementById('edit-modal').classList.remove('active');
        });
    }
    
    // Add to planner confirm
    const confirmBtn = document.getElementById('confirm-add-to-planner');
    if (confirmBtn) confirmBtn.addEventListener('click', addToPlanner);
    
    // Generate grocery list
    const generateBtn = document.getElementById('generate-grocery-list');
    if (generateBtn) generateBtn.addEventListener('click', generateGroceryList);
    
    const clearBtn = document.getElementById('clear-grocery-list');
    if (clearBtn) clearBtn.addEventListener('click', clearGroceryList);
    
    const dayGroceryBtn = document.getElementById('generate-grocery-from-day');
    if (dayGroceryBtn) dayGroceryBtn.addEventListener('click', generateGroceryFromDay);
    
    // Day panel close
    const closeDayBtn = document.getElementById('close-day-panel');
    if (closeDayBtn) closeDayBtn.addEventListener('click', () => {
        document.getElementById('selected-day-panel').style.display = 'none';
    });
    
    // Modal add to menu button
    const modalAddBtn = document.getElementById('modal-add-to-menu');
    if (modalAddBtn) modalAddBtn.addEventListener('click', () => {
        openPlannerModal(currentRecipe);
    });
    
    // Month navigation
    const prevMonth = document.getElementById('prev-month');
    const nextMonth = document.getElementById('next-month');
    if (prevMonth) prevMonth.addEventListener('click', () => changeMonth(-1));
    if (nextMonth) nextMonth.addEventListener('click', () => changeMonth(1));
}

let currentPlannerDate = new Date();

function changeMonth(delta) {
    currentPlannerDate.setMonth(currentPlannerDate.getMonth() + delta);
    renderCalendar();
}

// Render featured recipe
function renderFeaturedRecipe() {
    if (recipes.length === 0) return;
    
    // Pick a random recipe
    const randomIndex = Math.floor(Math.random() * recipes.length);
    const recipe = recipes[randomIndex];
    
    const featuredContainer = document.getElementById('featured-recipe');
    if (!featuredContainer) return;
    
    const imageHtml = recipe.image 
        ? `<div class="featured-image" style="background-image: url('${recipe.image}');"></div>`
        : `<div class="featured-image" style="background: linear-gradient(135deg, #f5f5f5, #e8e8e8); display: flex; align-items: center; justify-content: center; font-size: 4rem;">📷</div>`;
    
    featuredContainer.innerHTML = `
        ${imageHtml}
        <div class="featured-info">
            <h3>${recipe.name}</h3>
            <div class="featured-meta">${recipe.prep_time || '--'} prep • ${recipe.cook_time || '--'} cook • Serves ${recipe.servings || '--'}</div>
            <div class="featured-tags">
                ${recipe.meal_type ? `<span class="tag">${recipe.meal_type}</span>` : ''}
                ${recipe.cuisine ? `<span class="tag">${recipe.cuisine}</span>` : ''}
                ${recipe.crockpot ? '<span class="tag" style="background: var(--primary); color: white;">🍲 Crockpot</span>' : ''}
            </div>
            <div class="featured-actions">
                <button class="btn-primary" onclick="openRecipeModal('${recipe.id}')">View Recipe</button>
                <button class="btn-secondary" onclick="openPlannerModal(recipes.find(r => r.id === '${recipe.id}'))">Add to Plan</button>
            </div>
        </div>
    `;
}

// Render recipe cards
function renderRecipes() {
    const mealFilter = document.getElementById('filter-meal')?.value || '';
    const cuisineFilter = document.getElementById('filter-cuisine')?.value || '';
    const favoritesFilter = document.getElementById('filter-favorites')?.value || '';
    const searchFilter = document.getElementById('filter-search')?.value?.toLowerCase() || '';

    const filtered = recipes.filter(r => {
        if (mealFilter && r.meal_type !== mealFilter) return false;
        if (cuisineFilter && r.cuisine !== cuisineFilter) return false;
        if (favoritesFilter === 'true' && !r.isFavorite) return false;
        if (searchFilter && !r.name.toLowerCase().includes(searchFilter)) return false;
        return true;
    });
    
    // Update recipe count
    const countEl = document.getElementById('recipe-count');
    if (countEl) {
        countEl.textContent = `${filtered.length} recipe${filtered.length !== 1 ? 's' : ''}`;
    }
    
    const grid = document.getElementById('recipes-grid');
    if (!grid) return;
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p>No recipes found. Try adjusting filters.</p></div>';
        return;
    }
    
    grid.innerHTML = filtered.map(recipe => {
        const imageHtml = recipe.image 
            ? `<div class="recipe-image" style="background-image: url('${recipe.image}');"></div>`
            : `<div class="recipe-image-placeholder">📷</div>`;
        
        const crockpotBadge = recipe.crockpot ? '<span class="crockpot-badge">🍲</span>' : '';
        
        return `
        <div class="recipe-card" data-recipe-id="${recipe.id}">
            <button class="delete-btn" data-recipe-id="${recipe.id}" title="Delete recipe">×</button>
            ${recipe.isFavorite ? '<span class="favorite-icon">❤️</span>' : ''}
            ${imageHtml}
            <div class="recipe-content">
                <div class="recipe-title">${recipe.name} ${crockpotBadge}</div>
                <div class="recipe-tags">
                    <span class="tag">${recipe.meal_type}</span>
                    <span class="tag">${recipe.cuisine}</span>
                </div>
                <div class="recipe-meta">
                    <span>${recipe.prep_time || '--'} prep</span>
                    <span>${recipe.cook_time || '--'} cook</span>
                </div>
            </div>
        </div>
    `}).join('');
    
    // Add click listeners after rendering
    grid.querySelectorAll('.recipe-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // Don't open modal if delete button was clicked
            if (e.target.classList.contains('delete-btn')) return;
            const recipeId = this.getAttribute('data-recipe-id');
            openRecipeModal(recipeId);
        });
    });
    
    // Add delete button listeners
    grid.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const recipeId = this.getAttribute('data-recipe-id');
            deleteRecipe(recipeId);
        });
    });
}

// Delete recipe with confirmation
function deleteRecipe(recipeId) {
    const recipe = recipes.find(r => String(r.id) === String(recipeId));
    if (!recipe) return;
    
    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete "${recipe.name}"?\n\nThis action cannot be undone.`)) {
        // Remove from recipes array
        recipes = recipes.filter(r => String(r.id) !== String(recipeId));
        
        // Save to localStorage for persistence
        localStorage.setItem('deletedRecipes', JSON.stringify(
            [...JSON.parse(localStorage.getItem('deletedRecipes') || '[]'), recipeId]
        ));
        
        // Re-render the grid
        renderRecipes();
        
        // Show success message (optional)
        console.log(`Deleted recipe: ${recipe.name}`);
    }
}

// Open recipe detail modal
function openRecipeModal(id) {
    const recipe = recipes.find(r => String(r.id) === String(id));
    if (!recipe) {
        console.error('Recipe not found:', id);
        return;
    }
    
    currentRecipe = recipe;
    
    // Set image
    const imageDiv = document.getElementById('modal-image');
    if (recipe.image) {
        imageDiv.style.backgroundImage = `url('${recipe.image}')`;
        imageDiv.style.backgroundSize = 'cover';
        imageDiv.style.backgroundPosition = 'center';
        imageDiv.innerHTML = '';
    } else {
        imageDiv.style.backgroundImage = '';
        imageDiv.innerHTML = '<span>📷 Recipe Image</span>';
    }
    
    document.getElementById('modal-title').textContent = recipe.name;
    document.getElementById('modal-prep').textContent = `Prep: ${recipe.prep_time || '--'}`;
    document.getElementById('modal-cook').textContent = `Cook: ${recipe.cook_time || '--'}`;
    document.getElementById('modal-servings').textContent = `Serves: ${recipe.servings || '--'}`;
    document.getElementById('modal-cost').textContent = `Cost: $${recipe.cost_estimate || '--'}`;
    
    // Show/hide crockpot badge
    const crockpotEl = document.getElementById('modal-crockpot');
    if (crockpotEl) {
        crockpotEl.style.display = recipe.crockpot ? 'inline' : 'none';
    }
    
    // Set tags
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = `
        ${recipe.main_ingredient ? `<span class="tag tag-${recipe.main_ingredient}">${recipe.main_ingredient}</span>` : ''}
        <span class="tag tag-${recipe.meal_type}">${recipe.meal_type}</span>
        <span class="tag">${recipe.cuisine}</span>
        ${recipe.crockpot ? '<span class="tag" style="background:#e65100;color:white;">🍲 Crockpot</span>' : ''}
    `;
    
    // Set favorite button
    const favBtn = document.getElementById('modal-favorite');
    if (favBtn) {
        favBtn.textContent = recipe.isFavorite ? '❤️' : '🤍';
        favBtn.classList.toggle('active', recipe.isFavorite);
        favBtn.onclick = () => toggleFavorite(recipe.id);
    }
    
    // Set ingredients
    const ingredientsList = document.getElementById('modal-ingredients');
    if (recipe.ingredients && recipe.ingredients.length) {
        ingredientsList.innerHTML = recipe.ingredients.map(i => 
            `<li>${i.amount || ''} ${i.unit || ''} ${i.name}</li>`
        ).join('');
    } else {
        ingredientsList.innerHTML = '<li>No ingredients listed</li>';
    }
    
    // Set directions
    const directionsList = document.getElementById('modal-directions');
    if (recipe.directions && recipe.directions.length) {
        directionsList.innerHTML = recipe.directions.map((step, i) => 
            `<li>${step}</li>`
        ).join('');
    } else {
        directionsList.innerHTML = '<li>No directions available</li>';
    }
    
    // Setup edit button
    const editBtn = document.getElementById('modal-edit');
    if (editBtn) {
        editBtn.onclick = () => openEditModal(recipe);
    }
    
    // Setup print button
    const printBtn = document.getElementById('modal-print');
    if (printBtn) {
        printBtn.onclick = () => printRecipe(recipe);
    }
    
    document.getElementById('recipe-modal').classList.add('active');
}

// Toggle favorite
function toggleFavorite(recipeId) {
    const recipe = recipes.find(r => String(r.id) === String(recipeId));
    if (!recipe) return;
    
    recipe.isFavorite = !recipe.isFavorite;
    
    // Save to localStorage
    let favorites = JSON.parse(localStorage.getItem('recipeFavorites') || '[]');
    if (recipe.isFavorite) {
        favorites.push(recipeId);
    } else {
        favorites = favorites.filter(id => id !== recipeId);
    }
    localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
    
    // Update UI
    const favBtn = document.getElementById('modal-favorite');
    if (favBtn) {
        favBtn.textContent = recipe.isFavorite ? '❤️' : '🤍';
        favBtn.classList.toggle('active', recipe.isFavorite);
    }
    
    renderRecipes();
}

// Open planner modal
function openPlannerModal(recipe) {
    if (!recipe) return;
    document.getElementById('planner-modal').classList.add('active');
    document.getElementById('planner-date').valueAsDate = new Date();
}

// Add recipe to planner
function addToPlanner() {
    const date = document.getElementById('planner-date').value;
    const meal = document.getElementById('planner-meal').value;
    const portions = parseInt(document.getElementById('planner-portions').value) || 1;
    
    if (!date || !currentRecipe) return;
    
    if (!currentMenu[date]) currentMenu[date] = {};
    
    currentMenu[date][meal] = {
        recipeId: currentRecipe.id,
        recipeName: currentRecipe.name,
        portions: portions
    };
    
    saveMenuToStorage();
    renderCalendar();
    closeModals();
    
    // Switch to planner tab
    document.querySelector('[data-tab="planner"]').click();
}

// Render calendar
function renderCalendar() {
    const year = currentPlannerDate.getFullYear();
    const month = currentPlannerDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthDisplay = document.getElementById('current-month');
    if (monthDisplay) {
        monthDisplay.textContent = `${monthNames[month]} ${year}`;
    }
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, parseInt(month) + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Day headers
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        header.style.fontWeight = '600';
        header.style.textAlign = 'center';
        header.style.padding = '0.5rem';
        grid.appendChild(header);
    });
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay.getDay(); i++) {
        const empty = document.createElement('div');
        empty.style.minHeight = '60px';
        grid.appendChild(empty);
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        cell.style.border = '1px solid #e0e0e0';
        cell.style.minHeight = '60px';
        cell.style.padding = '4px';
        cell.style.cursor = 'pointer';
        cell.innerHTML = `<strong>${day}</strong>`;
        
        if (currentMenu[dateStr]) {
            cell.classList.add('has-meals');
            cell.style.background = '#e8f5e9';
            const meals = Object.entries(currentMenu[dateStr])
                .slice(0, 2)
                .map(([m, data]) => `<div style="font-size:10px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;">${m}: ${data.recipeName}</div>`)
                .join('');
            cell.innerHTML += meals;
        }
        
        cell.addEventListener('click', function() {
            selectDay(dateStr);
        });
        grid.appendChild(cell);
    }
}

// Select a day
function selectDay(dateStr) {
    document.getElementById('selected-day-panel').style.display = 'block';
    document.getElementById('selected-date').textContent = dateStr;
    
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
        const slot = document.getElementById(`slot-${meal}`);
        if (currentMenu[dateStr] && currentMenu[dateStr][meal]) {
            const data = currentMenu[dateStr][meal];
            slot.innerHTML = `<strong>${data.recipeName}</strong><br><small>${data.portions}x portions</small>`;
        } else {
            slot.innerHTML = '<span class="empty">Empty</span>';
        }
    });
}

// Generate grocery list
function generateGroceryList() {
    const ingredients = {};
    
    Object.values(currentMenu).forEach(day => {
        Object.values(day).forEach(meal => {
            const recipe = recipes.find(r => r.id === meal.recipeId);
            if (recipe && recipe.ingredients) {
                recipe.ingredients.forEach(ing => {
                    const key = ing.name.toLowerCase();
                    if (!ingredients[key]) {
                        ingredients[key] = { ...ing, totalAmount: 0 };
                    }
                    const amount = parseFloat(ing.amount) || 0;
                    ingredients[key].totalAmount += amount * meal.portions;
                });
            }
        });
    });
    
    const listContainer = document.getElementById('grocery-list');
    if (Object.keys(ingredients).length === 0) {
        listContainer.innerHTML = '<p class="empty-state">No meals planned yet. Go to the Meal Planner to add meals!</p>';
        return;
    }
    
    listContainer.innerHTML = Object.values(ingredients).map(ing => `
        <div class="grocery-item">
            <span>${ing.name}</span>
            <span>${ing.totalAmount.toFixed(1)} ${ing.unit || ''}</span>
        </div>
    `).join('');
}

// Generate grocery list from selected day
function generateGroceryFromDay() {
    const dateStr = document.getElementById('selected-date').textContent;
    if (!currentMenu[dateStr]) return;
    
    document.querySelector('[data-tab="grocery"]').click();
    
    const ingredients = {};
    Object.values(currentMenu[dateStr]).forEach(meal => {
        const recipe = recipes.find(r => r.id === meal.recipeId);
        if (recipe && recipe.ingredients) {
            recipe.ingredients.forEach(ing => {
                const key = ing.name.toLowerCase();
                if (!ingredients[key]) {
                    ingredients[key] = { ...ing, totalAmount: 0 };
                }
                const amount = parseFloat(ing.amount) || 0;
                ingredients[key].totalAmount += amount * meal.portions;
            });
        }
    });
    
    const listContainer = document.getElementById('grocery-list');
    listContainer.innerHTML = Object.values(ingredients).map(ing => `
        <div class="grocery-item">
            <span>${ing.name}</span>
            <span>${ing.totalAmount.toFixed(1)} ${ing.unit || ''}</span>
        </div>
    `).join('');
}

// Clear grocery list
function clearGroceryList() {
    document.getElementById('grocery-list').innerHTML = '<p class="empty-state">Grocery list cleared. Add meals to generate a new list!</p>';
}

// Close all modals
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// Save/load from localStorage
function saveMenuToStorage() {
    localStorage.setItem('mealPlan', JSON.stringify(currentMenu));
}

function loadMenuFromStorage() {
    const saved = localStorage.getItem('mealPlan');
    if (saved) {
        currentMenu = JSON.parse(saved);
    }
}

// Close modal on outside click
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModals();
    }
};

// Edit recipe functions
function openEditModal(recipe) {
    if (!recipe) return;
    
    document.getElementById('edit-name').value = recipe.name;
    document.getElementById('edit-prep').value = recipe.prep_time || '';
    document.getElementById('edit-cook').value = recipe.cook_time || '';
    document.getElementById('edit-servings').value = recipe.servings || '';
    document.getElementById('edit-cost').value = recipe.cost_estimate || '';
    
    // Format ingredients for textarea
    const ingText = recipe.ingredients?.map(i => `${i.amount || ''} ${i.name}`).join('\n') || '';
    document.getElementById('edit-ingredients').value = ingText;
    
    // Format directions for textarea
    document.getElementById('edit-directions').value = recipe.directions?.join('\n') || '';
    
    // Setup photo upload
    setupPhotoUpload(recipe);
    
    // Setup save button
    document.getElementById('save-edit').onclick = () => saveRecipeEdit(recipe.id);
    document.getElementById('cancel-edit').onclick = () => {
        document.getElementById('edit-modal').classList.remove('active');
    };
    
    document.getElementById('edit-modal').classList.add('active');
}

// Photo upload handling
let currentPhotoData = null;

function setupPhotoUpload(recipe) {
    const photoInput = document.getElementById('edit-photo');
    const photoBtn = document.getElementById('photo-select-btn');
    const photoFilename = document.getElementById('photo-filename');
    const photoPreview = document.getElementById('photo-preview');
    const photoPreviewImg = document.getElementById('photo-preview-img');
    
    currentPhotoData = null;
    
    // Show current photo if exists
    if (recipe.image) {
        photoPreview.style.display = 'block';
        photoPreviewImg.src = recipe.image;
        photoFilename.textContent = 'Current photo';
    } else {
        photoPreview.style.display = 'none';
        photoFilename.textContent = '';
    }
    
    // Setup file selection
    photoBtn.onclick = () => photoInput.click();
    
    photoInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Photo must be less than 5MB');
            return;
        }
        
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = (event) => {
            currentPhotoData = event.target.result;
            photoPreview.style.display = 'block';
            photoPreviewImg.src = currentPhotoData;
            photoFilename.textContent = file.name;
        };
        reader.readAsDataURL(file);
    };
}

function saveRecipeEdit(recipeId) {
    const recipe = recipes.find(r => String(r.id) === String(recipeId));
    if (!recipe) return;

    recipe.name = document.getElementById('edit-name').value;
    recipe.prep_time = document.getElementById('edit-prep').value;
    recipe.cook_time = document.getElementById('edit-cook').value;
    recipe.servings = parseInt(document.getElementById('edit-servings').value) || recipe.servings;
    recipe.cost_estimate = parseFloat(document.getElementById('edit-cost').value) || recipe.cost_estimate;

    // Parse ingredients
    const ingText = document.getElementById('edit-ingredients').value;
    recipe.ingredients = ingText.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.trim().split(' ');
        const amount = parts[0];
        const name = parts.slice(1).join(' ');
        return { amount, name, category: 'other' };
    });

    // Parse directions
    const dirText = document.getElementById('edit-directions').value;
    recipe.directions = dirText.split('\n').filter(line => line.trim());

    // Save photo if new one was selected
    if (currentPhotoData) {
        recipe.image = currentPhotoData;
        currentPhotoData = null;
    }

    // Save edits to localStorage
    const edits = JSON.parse(localStorage.getItem('recipeEdits') || '{}');
    edits[recipeId] = {
        name: recipe.name,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        cost_estimate: recipe.cost_estimate,
        ingredients: recipe.ingredients,
        directions: recipe.directions,
        image: recipe.image
    };
    localStorage.setItem('recipeEdits', JSON.stringify(edits));

    // Clear file input
    document.getElementById('edit-photo').value = '';
    document.getElementById('photo-filename').textContent = '';

    document.getElementById('edit-modal').classList.remove('active');
    renderRecipes();

    // Reopen recipe modal with updated data
    openRecipeModal(recipeId);
}

// Print recipe
function printRecipe(recipe) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>${recipe.name}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #e65100; border-bottom: 2px solid #e65100; padding-bottom: 10px; }
                .meta { color: #666; margin: 10px 0; }
                .ingredients, .directions { margin: 20px 0; }
                h2 { color: #333; }
                ul, ol { line-height: 1.8; }
                li { margin: 8px 0; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <h1>${recipe.name}</h1>
            <div class="meta">
                Prep: ${recipe.prep_time || '--'} | 
                Cook: ${recipe.cook_time || '--'} | 
                Serves: ${recipe.servings || '--'} | 
                Cost: $${recipe.cost_estimate || '--'}
            </div>
            <div class="ingredients">
                <h2>Ingredients</h2>
                <ul>
                    ${recipe.ingredients?.map(i => `<li>${i.amount || ''} ${i.name}</li>`).join('') || '<li>No ingredients</li>'}
                </ul>
            </div>
            <div class="directions">
                <h2>Directions</h2>
                <ol>
                    ${recipe.directions?.map(step => `<li>${step}</li>`).join('') || '<li>No directions</li>'}
                </ol>
            </div>
            <button class="no-print" onclick="window.print()">Print Recipe</button>
            <button class="no-print" onclick="window.close()">Close</button>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Print monthly menu
function printMonthlyMenu() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const year = currentPlannerDate.getFullYear();
    const month = currentPlannerDate.getMonth();
    
    let content = '';
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (currentMenu[dateStr]) {
            content += `
                <div class="print-day">
                    <h3>${monthNames[month]} ${day}, ${year}</h3>
                    ${Object.entries(currentMenu[dateStr]).map(([meal, data]) => `
                        <p><strong>${meal.charAt(0).toUpperCase() + meal.slice(1)}:</strong> ${data.recipeName} (${data.portions}x)</p>
                    `).join('')}
                </div>
            `;
        }
    }
    
    if (!content) {
        alert('No meals planned for this month yet!');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Monthly Menu - ${monthNames[month]} ${year}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; color: #e65100; border-bottom: 2px solid #e65100; padding-bottom: 10px; }
                .print-day { margin: 20px 0; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
                .print-day h3 { background: #f5f5f5; padding: 8px; margin-bottom: 10px; }
                p { margin: 5px 0; }
                @media print { .no-print { display: none; } button { display: none; } }
            </style>
        </head>
        <body>
            <h1>Monthly Menu - ${monthNames[month]} ${year}</h1>
            ${content}
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()">Print Menu</button>
                <button onclick="window.close()">Close</button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Setup print menu button
document.addEventListener('DOMContentLoaded', () => {
    const printMenuBtn = document.getElementById('print-menu');
    if (printMenuBtn) {
        printMenuBtn.addEventListener('click', printMonthlyMenu);
    }
});

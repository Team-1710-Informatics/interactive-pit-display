// Team 1710 Pit Display - Control Screen
// Portrait-mode touchscreen for controlling the display

const categoriesContainer = document.getElementById('categoriesContainer');

// State
let categories = [];
let activeCategory = null;
let activeImageIndex = null;
let isAutoPlaying = false;
let inactivityTimer = null;
let autoplayInterval = null;
let autoplayProgressInterval = null;
let autoplayStartTime = null;
let config = null;

// Reset the inactivity timer (call this on any user interaction)
function resetInactivityTimer() {
  if (!config) {
    console.log('No config yet, skipping timer setup');
    return;
  }

  // Stop auto-play if running
  if (isAutoPlaying) {
    stopAutoplay();
  }

  // Clear existing timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }

  // Use timeout from config
  const timeout = config.autoplay?.inactivityTimeoutMs
  console.log('Starting inactivity timer:', timeout, 'ms');

  inactivityTimer = setTimeout(() => {
    console.log('Inactivity timeout reached, starting autoplay');
    startAutoplay();
  }, timeout);
}

// Stop auto-play mode
function stopAutoplay() {
  isAutoPlaying = false;

  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }

  if (autoplayProgressInterval) {
    clearInterval(autoplayProgressInterval);
    autoplayProgressInterval = null;
  }
  autoplayStartTime = null;
  updateProgress(0);

  // Notify server
  fetch('/api/stop-autoplay', { method: 'POST' });
}

// Start auto-play mode
function startAutoplay() {
  console.log('Starting autoplay');
  isAutoPlaying = true;

  // Close all categories
  document.querySelectorAll('.category-card').forEach(card => {
    card.classList.remove('open');
  });

  // Find Team Identity category and open it
  const teamIdentityCategory = categories.find(c => c.key === 'TeamIdentity');
  if (teamIdentityCategory) {
    const card = document.querySelector(`[data-category="${teamIdentityCategory.key}"]`);
    if (card) {
      card.classList.add('open');
    }

    // Clear any existing interval
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
    if (autoplayProgressInterval) {
      clearInterval(autoplayProgressInterval);
    }

    // Determine starting image - if already on slide 1 (index 0), move to slide 2 (index 1)
    let startIndex = 0;
    if (activeCategory === 'TeamIdentity' && activeImageIndex === 0) {
      startIndex = 1;
      console.log('Already on slide 1, starting autoplay from slide 2');
    }

    // Select the starting image
    selectImage('TeamIdentity', startIndex, true);

    // Use interval from config
    const interval = config?.autoplay?.imageIntervalMs
    console.log('Autoplay interval:', interval, 'ms');

    // Start progress animation
    autoplayStartTime = Date.now();
    autoplayProgressInterval = setInterval(() => {
      const elapsed = Date.now() - autoplayStartTime;
      const progress = Math.min((elapsed / interval) * 100, 100);
      updateProgress(progress);
    }, 50); // Update every 50ms

    // Cycle through images
    autoplayInterval = setInterval(() => {
      const nextIndex = (activeImageIndex + 1) % teamIdentityCategory.images.length;
      console.log('Autoplay: advancing to image', nextIndex);
      selectImage('TeamIdentity', nextIndex, true);

      // Reset progress
      autoplayStartTime = Date.now();
      updateProgress(0);
    }, interval);
  }

  // Notify server
  fetch('/api/start-autoplay', { method: 'POST' });
}

// Select an image to display
async function selectImage(categoryKey, imageIndex, isAutoplay = false) {
  const response = await fetch('/api/select-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryKey, imageIndex })
  });

  if (response.ok) {
    activeCategory = categoryKey;
    activeImageIndex = imageIndex;
    updateActiveState();

    if (!isAutoplay) {
      resetInactivityTimer();
    } else {
      // Reset progress for autoplay
      autoplayStartTime = Date.now();
    }
  }
}

// Update the visual active state
function updateActiveState() {
  // Remove all active classes and progress
  document.querySelectorAll('.image-row').forEach(row => {
    row.classList.remove('active');
    const progressBar = row.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  });

  // Add active class to current image
  if (activeCategory !== null && activeImageIndex !== null) {
    const activeRow = document.querySelector(
      `[data-category="${activeCategory}"] .image-row[data-index="${activeImageIndex}"]`
    );
    if (activeRow) {
      activeRow.classList.add('active');
      // Reset progress when switching images
      if (!isAutoPlaying) {
        const progressBar = activeRow.querySelector('.progress-bar');
        if (progressBar) {
          progressBar.style.width = '0%';
        }
      }
    }
  }
}

// Update the progress bar
function updateProgress(percent) {
  if (activeCategory !== null && activeImageIndex !== null) {
    const activeRow = document.querySelector(
      `[data-category="${activeCategory}"] .image-row[data-index="${activeImageIndex}"]`
    );
    if (activeRow) {
      const progressBar = activeRow.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.width = percent + '%';
      }
    }
  }
}

// Toggle category open/closed
function toggleCategory(categoryKey) {
  resetInactivityTimer();

  const card = document.querySelector(`[data-category="${categoryKey}"]`);
  if (card) {
    const isOpen = card.classList.contains('open');
    // Close all others
    document.querySelectorAll('.category-card').forEach(c => {
      c.classList.remove('open');
    });
    // Toggle this one
    if (!isOpen) {
      card.classList.add('open');
    }
  }
}

// Generate the UI from config
function generateUI(config) {
  categories = config.categories;

  // Generate category cards
  categoriesContainer.innerHTML = categories.map(category => `
    <div class="category-card" data-category="${category.key}">
      <div class="category-header" onclick="toggleCategory('${category.key}')">
        <span class="category-name">${category.displayName}</span>
        <span class="category-arrow">▼</span>
      </div>
      <div class="category-images">
        ${category.images.map((image, index) => `
          <div class="image-row" data-category="${category.key}" data-index="${index}" onclick="selectImage('${category.key}', ${index})">
            <span class="image-name">${image.displayName}</span>
            <span class="image-number">${index + 1}</span>
            <div class="progress-bar"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Connect to SSE
const eventSource = new EventSource('/events?type=control');

eventSource.addEventListener('connected', (event) => {
  console.log('SSE connected as control screen');
  const data = JSON.parse(event.data);
  if (data.config) {
    config = data.config;
    console.log('Config loaded:', config);
    generateUI(data.config);
    // Set initial active state to first image of first category
    if (data.config.defaultImage) {
      const firstCategory = data.config.categories[0];
      activeCategory = firstCategory.key;
      activeImageIndex = 0;
      updateActiveState();
    }
  }
  resetInactivityTimer();
});

eventSource.addEventListener('active-image', (event) => {
  const data = JSON.parse(event.data);
  activeCategory = data.categoryKey;
  activeImageIndex = data.imageIndex;
  updateActiveState();

  // Reset progress timer if this is from autoplay
  if (isAutoPlaying && data.autoplay) {
    autoplayStartTime = Date.now();
  }
});

eventSource.addEventListener('autoplay-started', (event) => {
  const data = JSON.parse(event.data);
  isAutoPlaying = true;
  activeCategory = data.categoryKey;
});

eventSource.addEventListener('autoplay-stopped', (event) => {
  stopAutoplay();
});

eventSource.onerror = (err) => {
  console.log('SSE error:', err);
};

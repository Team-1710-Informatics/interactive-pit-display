// Team 1710 Pit Display - View Screen
// This screen displays images in fullscreen for the pit display

const displayImage = document.getElementById('displayImage');
let currentImageSrc = '';

// Request fullscreen on load
async function requestFullscreen() {
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      await document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      await document.documentElement.msRequestFullscreen();
    }
  } catch (err) {
    console.log('Fullscreen request failed:', err);
  }
}

// Preload an image
function preloadImage(src) {
  const img = new Image();
  img.src = src;
}

// Update the displayed image with a fade transition
function updateImage(filename) {
  const newSrc = `/images/${filename}`;

  // If same image, do nothing
  if (newSrc === currentImageSrc) return;

  // Preload the new image
  preloadImage(newSrc);

  // Add fade-out class
  displayImage.classList.add('fade-out');

  // Wait for fade-out, then change src and fade-in
  setTimeout(() => {
    displayImage.src = newSrc;
    currentImageSrc = newSrc;
    displayImage.classList.remove('fade-out');
  }, 200);
}

// Connect to SSE
const eventSource = new EventSource('/events?type=view');

eventSource.addEventListener('connected', (event) => {
  console.log('SSE connected as view screen');
  const data = JSON.parse(event.data);
  if (data.config?.defaultImage) {
    updateImage(data.config.defaultImage.filename);
  }
});

eventSource.addEventListener('display-image', (event) => {
  console.log('Display image event:', event.data);
  const data = JSON.parse(event.data);
  if (data.image?.filename) {
    updateImage(data.image.filename);
  }
});

eventSource.onerror = (err) => {
  console.log('SSE error:', err);
};

// Request fullscreen on page load
document.addEventListener('DOMContentLoaded', () => {
  // Try to request fullscreen on user interaction
  // Browsers require user gesture for fullscreen
  document.addEventListener('click', async () => {
    await requestFullscreen();
  }, { once: true });
});

// Also try on load (may not work in all browsers)
window.addEventListener('load', () => {
  setTimeout(requestFullscreen, 100);
});

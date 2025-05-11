// User management
let currentUser = null;
let lastActivity = JSON.parse(localStorage.getItem('lastActivity')) || {};

// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startButton = document.getElementById('startButton');
const videoContainer = document.getElementById('videoContainer');
const filtersContainer = document.getElementById('filtersContainer');
const filters = document.getElementById('filters');
const status = document.getElementById('status');
let currentFilter = 'none';
let isProcessing = false;
let isDown = false;
let startX;
let scrollLeft;

// Authentication Functions
function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
}

// Helper function to show error messages
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

// Helper function to debug localStorage
function debugLocalStorage() {
    console.log('Current users in localStorage:', localStorage.getItem('users'));
    console.log('Current lastLoggedInUser:', localStorage.getItem('lastLoggedInUser'));
}

// User management functions
function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        showError('registerError', 'Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        showError('registerError', 'Passwords do not match');
        return;
    }

    try {
        // Get existing users or initialize empty object
        let users = {};
        const existingUsers = localStorage.getItem('users');
        if (existingUsers) {
            users = JSON.parse(existingUsers);
        }

        // Check if user already exists
        if (users[email]) {
            showError('registerError', 'Email already registered');
            return;
        }

        // Create new user
        users[email] = {
            name: name,
            password: password,
            lastLogin: new Date().toISOString()
        };

        // Save to localStorage
        localStorage.setItem('users', JSON.stringify(users));
        console.log('User registered successfully:', email);
        debugLocalStorage();
        
        showLogin();
        document.getElementById('loginEmail').value = email;
        showError('loginError', 'Registration successful! Please login.');
    } catch (error) {
        console.error('Registration error:', error);
        showError('registerError', 'Error during registration. Please try again.');
    }
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showError('loginError', 'Please fill in all fields');
        return;
    }

    try {
        // Get users from localStorage
        const usersJson = localStorage.getItem('users');
        if (!usersJson) {
            showError('loginError', 'No users found. Please register first.');
            return;
        }

        const users = JSON.parse(usersJson);
        console.log('Attempting login for:', email);
        console.log('Available users:', users);

        // Check if user exists
        if (!users[email]) {
            showError('loginError', 'User not found. Please register first.');
            return;
        }

        // Check password
        if (users[email].password !== password) {
            showError('loginError', 'Incorrect password');
            return;
        }

        // Update last login time
        users[email].lastLogin = new Date().toISOString();
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('lastLoggedInUser', email);

        // Set current user
        currentUser = {
            name: users[email].name,
            email: email
        };

        console.log('Login successful for:', email);
        debugLocalStorage();

        // Show last activity if available
        const lastActivity = JSON.parse(localStorage.getItem('lastActivity')) || {};
        if (lastActivity[email]) {
            const message = `Welcome back ${users[email].name}! Your last activity:\n` +
                `Last filter used: ${lastActivity[email].lastFilter}\n` +
                `Last used on: ${new Date(lastActivity[email].timestamp).toLocaleString()}`;
            alert(message);
        }

        // Show camera interface
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('app').style.display = 'block';
    } catch (error) {
        console.error('Login error:', error);
        showError('loginError', 'Error during login. Please try again.');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('lastLoggedInUser');
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    showLogin();
}

// Camera Functions
startButton.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        video.srcObject = stream;
        videoContainer.style.display = 'block';
        filtersContainer.style.display = 'block';
        startButton.style.display = 'none';
        
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            status.textContent = 'Camera started successfully';
            startVideoProcessing();
        };
    } catch (err) {
        console.error('Error accessing camera:', err);
        status.textContent = 'Error accessing camera. Please check permissions.';
        alert('Error accessing camera. Please make sure you have granted camera permissions.');
    }
});

// Swipe functionality
filters.addEventListener('mousedown', (e) => {
    isDown = true;
    filters.style.cursor = 'grabbing';
    startX = e.pageX - filters.offsetLeft;
    scrollLeft = filters.scrollLeft;
});

filters.addEventListener('mouseleave', () => {
    isDown = false;
    filters.style.cursor = 'grab';
});

filters.addEventListener('mouseup', () => {
    isDown = false;
    filters.style.cursor = 'grab';
});

filters.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - filters.offsetLeft;
    const walk = (x - startX) * 2;
    filters.scrollLeft = scrollLeft - walk;
});

// Touch events for mobile
filters.addEventListener('touchstart', (e) => {
    isDown = true;
    startX = e.touches[0].pageX - filters.offsetLeft;
    scrollLeft = filters.scrollLeft;
});

filters.addEventListener('touchend', () => {
    isDown = false;
});

filters.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.touches[0].pageX - filters.offsetLeft;
    const walk = (x - startX) * 2;
    filters.scrollLeft = scrollLeft - walk;
});

// Add scroll buttons for desktop
const scrollButtons = document.createElement('div');
scrollButtons.style.position = 'absolute';
scrollButtons.style.top = '50%';
scrollButtons.style.transform = 'translateY(-50%)';
scrollButtons.style.width = '100%';
scrollButtons.style.pointerEvents = 'none';
scrollButtons.style.display = 'flex';
scrollButtons.style.justifyContent = 'space-between';
scrollButtons.style.padding = '0 10px';

const leftButton = document.createElement('button');
leftButton.innerHTML = '←';
leftButton.style.pointerEvents = 'auto';
leftButton.style.background = 'rgba(0,0,0,0.5)';
leftButton.style.color = 'white';
leftButton.style.border = 'none';
leftButton.style.borderRadius = '50%';
leftButton.style.width = '30px';
leftButton.style.height = '30px';
leftButton.style.cursor = 'pointer';
leftButton.style.display = 'none';

const rightButton = document.createElement('button');
rightButton.innerHTML = '→';
rightButton.style.pointerEvents = 'auto';
rightButton.style.background = 'rgba(0,0,0,0.5)';
rightButton.style.color = 'white';
rightButton.style.border = 'none';
rightButton.style.borderRadius = '50%';
rightButton.style.width = '30px';
rightButton.style.height = '30px';
rightButton.style.cursor = 'pointer';

scrollButtons.appendChild(leftButton);
scrollButtons.appendChild(rightButton);
filtersContainer.appendChild(scrollButtons);

// Show/hide scroll buttons based on scroll position
filters.addEventListener('scroll', () => {
    leftButton.style.display = filters.scrollLeft > 0 ? 'block' : 'none';
    rightButton.style.display = 
        filters.scrollLeft < (filters.scrollWidth - filters.clientWidth) ? 'block' : 'none';
});

// Scroll button click handlers
leftButton.addEventListener('click', () => {
    filters.scrollBy({
        left: -200,
        behavior: 'smooth'
    });
});

rightButton.addEventListener('click', () => {
    filters.scrollBy({
        left: 200,
        behavior: 'smooth'
    });
});

// Show scroll buttons on desktop
if (window.matchMedia('(min-width: 768px)').matches) {
    leftButton.style.display = 'block';
    rightButton.style.display = 'block';
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        status.textContent = `Filter applied: ${currentFilter}`;

        // Save filter to last activity
        if (currentUser) {
            const lastActivity = JSON.parse(localStorage.getItem('lastActivity')) || {};
            lastActivity[currentUser.email] = {
                lastFilter: currentFilter,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('lastActivity', JSON.stringify(lastActivity));
        }
    });
});

// Filter application functions
function applyFilter(ctx, imageData) {
    const data = imageData.data;
    
    switch(currentFilter) {
        case 'grayscale':
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
            break;

        case 'sepia':
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
            break;

        case 'invert':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;

        case 'pixelate':
            const pixelSize = 10;
            for (let y = 0; y < canvas.height; y += pixelSize) {
                for (let x = 0; x < canvas.width; x += pixelSize) {
                    const i = (y * canvas.width + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    ctx.fillStyle = `rgb(${r},${g},${b})`;
                    ctx.fillRect(x, y, pixelSize, pixelSize);
                }
            }
            return;

        case 'neon':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.5);
                data[i + 1] = Math.min(255, data[i + 1] * 1.5);
                data[i + 2] = Math.min(255, data[i + 2] * 1.5);
                data[i + 3] = 255;
            }
            break;

        case 'psychedelic':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = (data[i] + 50) % 255;
                data[i + 1] = (data[i + 1] + 100) % 255;
                data[i + 2] = (data[i + 2] + 150) % 255;
            }
            break;

        case 'vintage':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.2);
                data[i + 1] = Math.min(255, data[i + 1] * 0.9);
                data[i + 2] = Math.min(255, data[i + 2] * 0.8);
            }
            break;

        case 'red':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.5);
                data[i + 1] = data[i + 1] * 0.7;
                data[i + 2] = data[i + 2] * 0.7;
            }
            break;

        case 'blue':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i] * 0.7;
                data[i + 1] = data[i + 1] * 0.7;
                data[i + 2] = Math.min(255, data[i + 2] * 1.5);
            }
            break;

        case 'green':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i] * 0.7;
                data[i + 1] = Math.min(255, data[i + 1] * 1.5);
                data[i + 2] = data[i + 2] * 0.7;
            }
            break;

        case 'purple':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.3);
                data[i + 1] = data[i + 1] * 0.7;
                data[i + 2] = Math.min(255, data[i + 2] * 1.3);
            }
            break;

        case 'solarize':
            for (let i = 0; i < data.length; i += 4) {
                data[i] = data[i] > 128 ? 255 - data[i] : data[i];
                data[i + 1] = data[i + 1] > 128 ? 255 - data[i + 1] : data[i + 1];
                data[i + 2] = data[i + 2] > 128 ? 255 - data[i + 2] : data[i + 2];
            }
            break;

        case 'posterize':
            const levels = 4;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.floor(data[i] / 255 * levels) * (255 / levels);
                data[i + 1] = Math.floor(data[i + 1] / 255 * levels) * (255 / levels);
                data[i + 2] = Math.floor(data[i + 2] / 255 * levels) * (255 / levels);
            }
            break;

        case 'emboss':
            const width = canvas.width;
            const height = canvas.height;
            const tempData = new Uint8ClampedArray(data);
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const i = (y * width + x) * 4;
                    const i1 = ((y - 1) * width + (x - 1)) * 4;
                    const i2 = ((y + 1) * width + (x + 1)) * 4;
                    
                    data[i] = Math.min(255, Math.max(0, tempData[i2] - tempData[i1] + 128));
                    data[i + 1] = Math.min(255, Math.max(0, tempData[i2 + 1] - tempData[i1 + 1] + 128));
                    data[i + 2] = Math.min(255, Math.max(0, tempData[i2 + 2] - tempData[i1 + 2] + 128));
                }
            }
            break;

        case 'rainbow':
            for (let i = 0; i < data.length; i += 4) {
                const x = (i / 4) % canvas.width;
                const hue = (x / canvas.width) * 360;
                const rgb = hslToRgb(hue / 360, 1, 0.5);
                data[i] = rgb[0];
                data[i + 1] = rgb[1];
                data[i + 2] = rgb[2];
            }
            break;

        case 'mirror':
            const mirrorWidth = canvas.width;
            const mirrorHeight = canvas.height;
            const mirrorTempData = new Uint8ClampedArray(data);
            
            for (let y = 0; y < mirrorHeight; y++) {
                for (let x = 0; x < mirrorWidth; x++) {
                    const i = (y * mirrorWidth + x) * 4;
                    const mirrorX = mirrorWidth - x - 1;
                    const mirrorI = (y * mirrorWidth + mirrorX) * 4;
                    
                    data[i] = mirrorTempData[mirrorI];
                    data[i + 1] = mirrorTempData[mirrorI + 1];
                    data[i + 2] = mirrorTempData[mirrorI + 2];
                }
            }
            break;

        case 'comic':
            const comicWidth = canvas.width;
            const comicHeight = canvas.height;
            const comicTempData = new Uint8ClampedArray(data);
            
            for (let y = 1; y < comicHeight - 1; y++) {
                for (let x = 1; x < comicWidth - 1; x++) {
                    const i = (y * comicWidth + x) * 4;
                    const i1 = ((y - 1) * comicWidth + (x - 1)) * 4;
                    const i2 = ((y + 1) * comicWidth + (x + 1)) * 4;
                    
                    const edge = Math.abs(comicTempData[i2] - comicTempData[i1]);
                    const threshold = 30;
                    
                    if (edge > threshold) {
                        data[i] = data[i + 1] = data[i + 2] = 0;
                    } else {
                        const levels = 4;
                        data[i] = Math.floor(data[i] / 255 * levels) * (255 / levels);
                        data[i + 1] = Math.floor(data[i + 1] / 255 * levels) * (255 / levels);
                        data[i + 2] = Math.floor(data[i + 2] / 255 * levels) * (255 / levels);
                    }
                }
            }
            break;

        case 'glitch':
            const glitchAmount = 20;
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() < 0.1) {
                    data[i] = Math.min(255, data[i] + glitchAmount);
                    data[i + 1] = Math.max(0, data[i + 1] - glitchAmount);
                    data[i + 2] = Math.min(255, data[i + 2] + glitchAmount);
                }
            }
            break;

        case 'kaleidoscope':
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const segments = 8;
            const angle = (2 * Math.PI) / segments;
            const kaleidoscopeTempData = new Uint8ClampedArray(data);
            
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const currentAngle = Math.atan2(dy, dx);
                    const segment = Math.floor(currentAngle / angle);
                    const newAngle = segment * angle;
                    
                    const newX = Math.round(centerX + distance * Math.cos(newAngle));
                    const newY = Math.round(centerY + distance * Math.sin(newAngle));
                    
                    if (newX >= 0 && newX < canvas.width && newY >= 0 && newY < canvas.height) {
                        const i = (y * canvas.width + x) * 4;
                        const newI = (newY * canvas.width + newX) * 4;
                        
                        data[i] = kaleidoscopeTempData[newI];
                        data[i + 1] = kaleidoscopeTempData[newI + 1];
                        data[i + 2] = kaleidoscopeTempData[newI + 2];
                    }
                }
            }
            break;
    }
    
    if (currentFilter !== 'none') {
        ctx.putImageData(imageData, 0, 0);
    }
}

// Helper function for rainbow filter
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function startVideoProcessing() {
    if (isProcessing) return;
    isProcessing = true;
    
    const ctx = canvas.getContext('2d');
    let lastTime = 0;
    const fps = 30;
    const frameInterval = 1000 / fps;

    function processFrame(currentTime) {
        if (!isProcessing) return;

        if (currentTime - lastTime < frameInterval) {
            requestAnimationFrame(processFrame);
            return;
        }
        lastTime = currentTime;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            if (currentFilter !== 'none') {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                applyFilter(ctx, imageData);
            }
        }
        
        requestAnimationFrame(processFrame);
    }

    requestAnimationFrame(processFrame);
}

// Check if user is logged in
window.onload = function() {
    const lastLoggedInUser = localStorage.getItem('lastLoggedInUser');
    if (!lastLoggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // Display welcome message
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[lastLoggedInUser];
    if (user) {
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.name}!`;
        
        // Display last activity
        const lastActivity = localStorage.getItem(`lastActivity_${lastLoggedInUser}`);
        if (lastActivity) {
            const activity = JSON.parse(lastActivity);
            const lastActivityText = document.getElementById('lastActivityText');
            lastActivityText.textContent = `Last used filter: ${activity.filter} at ${new Date(activity.timestamp).toLocaleString()}`;
        }
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    isProcessing = false;
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}); 
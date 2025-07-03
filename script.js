// Global variables
let currentStep = 1;
let formData = {
    birthdayPersonName: '',
    startText: '',
    endText: '',
    images: [],
    questions: [],
    backgroundMusic: null
};

// DOM elements
const stepContents = document.querySelectorAll('.step-content');
const stepIndicators = document.querySelectorAll('.step');
const stepLines = document.querySelectorAll('.step-line');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const generateNavBtn = document.getElementById('generateNavBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateUI();
    loadDemoDataIfUrlParam();
});

// Setup all event listeners
function setupEventListeners() {
    // Navigation buttons
    prevBtn.addEventListener('click', previousStep);
    nextBtn.addEventListener('click', nextStep);
    generateNavBtn.addEventListener('click', generateWebsite);
    
    // Demo button
    document.getElementById('demoBtn').addEventListener('click', loadDemoData);
    
    // Step 1 - Basic Info
    document.getElementById('birthdayName').addEventListener('input', updateFormData);
    document.getElementById('startText').addEventListener('input', updateFormData);
    document.getElementById('endText').addEventListener('input', updateFormData);
    
    // Step 2 - Image Upload
    setupImageUpload();
    
    // Step 3 - Questions
    document.getElementById('addQuestionBtn').addEventListener('click', addQuestion);
    
    // Step 4 - Music Upload
    setupMusicUpload();
    
    // Step 5 - Generate
    document.getElementById('generateBtn').addEventListener('click', generateWebsite);
    document.getElementById('downloadBtn').addEventListener('click', downloadFiles);
    document.getElementById('previewBtn').addEventListener('click', previewWebsite);
}

// Update form data from inputs
function updateFormData(event) {
    const field = event.target.id;
    const value = event.target.value;
    
    switch(field) {
        case 'birthdayName':
            formData.birthdayPersonName = value;
            break;
        case 'startText':
            formData.startText = value;
            break;
        case 'endText':
            formData.endText = value;
            break;
    }
    
    updateSummary();
}

// Image upload functionality
function setupImageUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const uploadBtn = uploadArea.querySelector('.upload-btn');
    
    // Click to upload
    uploadBtn.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea || e.target.classList.contains('upload-text')) {
            imageInput.click();
        }
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        handleImageFiles(files);
    });
    
    // File input change
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleImageFiles(files);
    });
    
    // Clear images button
    document.getElementById('clearImagesBtn').addEventListener('click', clearAllImages);
}

// Handle uploaded image files
function handleImageFiles(files) {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showToast('No valid images selected', 'Please select JPG, PNG, or GIF files', 'warning');
        return;
    }
    
    imageFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageObj = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: formatFileSize(file.size),
                url: e.target.result,
                file: file
            };
            
            formData.images.push(imageObj);
            updateImagesDisplay();
            updateAnswerSelect();
            updateSummary();
        };
        reader.readAsDataURL(file);
    });
    
    showToast('Images Uploaded', `${imageFiles.length} image(s) added successfully!`, 'success');
}

// Update images display
function updateImagesDisplay() {
    const imagesSection = document.getElementById('imagesSection');
    const imagesGrid = document.getElementById('imagesGrid');
    const imagesCount = document.getElementById('imagesCount');
    
    if (formData.images.length === 0) {
        imagesSection.style.display = 'none';
        return;
    }
    
    imagesSection.style.display = 'block';
    imagesCount.textContent = `Uploaded Images (${formData.images.length})`;
    
    imagesGrid.innerHTML = formData.images.map(image => `
        <div class="image-item" data-id="${image.id}">
            <img src="${image.url}" alt="${image.name}">
            <div class="image-overlay">
                <button class="remove-image-btn" onclick="removeImage('${image.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="image-info">
                <div class="image-name" title="${image.name}">${image.name}</div>
                <div class="image-size">${image.size}</div>
            </div>
        </div>
    `).join('');
}

// Remove individual image
function removeImage(imageId) {
    formData.images = formData.images.filter(img => img.id !== imageId);
    updateImagesDisplay();
    updateAnswerSelect();
    updateQuestionsDisplay();
    updateSummary();
    showToast('Image Removed', 'Image has been removed from the collection', 'success');
}

// Clear all images
function clearAllImages() {
    formData.images = [];
    formData.questions = [];
    updateImagesDisplay();
    updateAnswerSelect();
    updateQuestionsDisplay();
    updateSummary();
    showToast('Images Cleared', 'All images have been removed', 'success');
}

// Update answer select dropdown
function updateAnswerSelect() {
    const answerSelect = document.getElementById('answerSelect');
    const questionsSection = document.getElementById('questionsSection');
    const noImagesMessage = document.getElementById('noImagesMessage');
    
    if (formData.images.length === 0) {
        questionsSection.style.display = 'none';
        noImagesMessage.style.display = 'block';
        return;
    }
    
    questionsSection.style.display = 'block';
    noImagesMessage.style.display = 'none';
    
    answerSelect.innerHTML = '<option value="">Select the image that answers this question</option>' +
        formData.images.map(image => 
            `<option value="${image.id}">${image.name}</option>`
        ).join('');
}

// Add question
function addQuestion() {
    const questionText = document.getElementById('questionText').value.trim();
    const answerId = document.getElementById('answerSelect').value;
    
    if (!questionText) {
        showToast('Missing Question', 'Please enter a question text', 'error');
        return;
    }
    
    if (!answerId) {
        showToast('Missing Answer', 'Please select an answer image', 'error');
        return;
    }
    
    const question = {
        id: Date.now(),
        text: questionText,
        answerId: answerId
    };
    
    formData.questions.push(question);
    updateQuestionsDisplay();
    updateSummary();
    
    // Clear form
    document.getElementById('questionText').value = '';
    document.getElementById('answerSelect').value = '';
    
    showToast('Question Added', 'Question has been added successfully!', 'success');
}

// Update questions display
function updateQuestionsDisplay() {
    const existingQuestions = document.getElementById('existingQuestions');
    
    if (formData.questions.length === 0) {
        existingQuestions.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">No questions added yet. Create your first question above!</div>';
        return;
    }
    
    existingQuestions.innerHTML = formData.questions.map((question, index) => {
        const answerImage = formData.images.find(img => img.id == question.answerId);
        return `
            <div class="question-item">
                <div class="question-header">
                    <div>
                        <div class="question-number">Question #${index + 1}</div>
                        <div class="question-text">${question.text}</div>
                        ${answerImage ? `
                            <div class="question-answer">
                                <span style="font-size: 0.875rem; color: #6b7280;">Answer:</span>
                                <img src="${answerImage.url}" alt="${answerImage.name}" class="answer-image">
                                <span class="answer-name">${answerImage.name}</span>
                            </div>
                        ` : ''}
                    </div>
                    <button class="remove-question-btn" onclick="removeQuestion('${question.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Remove question
function removeQuestion(questionId) {
    formData.questions = formData.questions.filter(q => q.id != questionId);
    updateQuestionsDisplay();
    updateSummary();
    showToast('Question Removed', 'Question has been removed', 'success');
}

// Music upload functionality
function setupMusicUpload() {
    const musicInput = document.getElementById('musicInput');
    const musicUploadBtn = document.querySelector('.music-upload-btn');
    const removeMusicBtn = document.getElementById('removeMusicBtn');
    
    musicUploadBtn.addEventListener('click', () => musicInput.click());
    
    musicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            formData.backgroundMusic = {
                name: file.name,
                size: formatFileSize(file.size),
                file: file
            };
            updateMusicDisplay();
            updateSummary();
            showToast('Music Uploaded', 'Background music has been added!', 'success');
        }
    });
    
    removeMusicBtn.addEventListener('click', () => {
        formData.backgroundMusic = null;
        updateMusicDisplay();
        updateSummary();
        musicInput.value = '';
        showToast('Music Removed', 'Background music has been removed', 'success');
    });
}

// Update music display
function updateMusicDisplay() {
    const musicUploadContent = document.getElementById('musicUploadContent');
    const musicSelected = document.getElementById('musicSelected');
    const musicFilename = document.getElementById('musicFilename');
    
    if (formData.backgroundMusic) {
        musicUploadContent.style.display = 'none';
        musicSelected.style.display = 'block';
        musicFilename.textContent = '✅ ' + formData.backgroundMusic.name;
    } else {
        musicUploadContent.style.display = 'block';
        musicSelected.style.display = 'none';
    }
}

// Update summary in step 5
function updateSummary() {
    document.getElementById('summaryName').textContent = formData.birthdayPersonName || 'Not set';
    document.getElementById('summaryImages').textContent = `${formData.images.length} images`;
    document.getElementById('summaryQuestions').textContent = `${formData.questions.length} questions`;
    document.getElementById('summaryMusic').textContent = formData.backgroundMusic?.name || 'Not set';
    
    const summaryMessage = document.getElementById('summaryMessage');
    if (formData.startText) {
        const preview = formData.startText.substring(0, 100) + (formData.startText.length > 100 ? '...' : '');
        summaryMessage.innerHTML = `<strong>Opening Message:</strong><br><em>"${preview}"</em>`;
    } else {
        summaryMessage.innerHTML = '';
    }
}

// Navigation functions
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < 5) {
            currentStep++;
            updateUI();
        }
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
}

// Validate current step
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            if (!formData.birthdayPersonName.trim()) {
                showToast('Missing Information', 'Please enter the birthday person\'s name', 'error');
                return false;
            }
            if (!formData.startText.trim() || !formData.endText.trim()) {
                showToast('Missing Information', 'Please enter both start and end texts', 'error');
                return false;
            }
            return true;
        case 2:
            if (formData.images.length === 0) {
                showToast('No Images', 'Please upload at least one image', 'error');
                return false;
            }
            return true;
        case 3:
            if (formData.questions.length === 0) {
                showToast('No Questions', 'Please add at least one question', 'error');
                return false;
            }
            return true;
        case 4:
            if (!formData.backgroundMusic) {
                showToast('No Music', 'Please upload background music', 'error');
                return false;
            }
            return true;
        default:
            return true;
    }
}

// Update UI based on current step
function updateUI() {
    // Update step content
    stepContents.forEach((content, index) => {
        content.classList.toggle('active', index + 1 === currentStep);
    });
    
    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
        const stepNum = index + 1;
        indicator.classList.toggle('active', stepNum === currentStep);
        indicator.classList.toggle('completed', stepNum < currentStep);
    });
    
    // Update step lines
    stepLines.forEach((line, index) => {
        line.classList.toggle('active', index + 1 < currentStep);
    });
    
    // Update progress bar
    const progress = (currentStep / 5) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Step ${currentStep} of 5 - ${Math.round(progress)}% Complete`;
    
    // Update navigation buttons
    prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    nextBtn.style.display = currentStep < 5 ? 'inline-flex' : 'none';
    generateNavBtn.style.display = currentStep === 5 ? 'inline-flex' : 'none';
    
    // Update form data from inputs when moving to step 1
    if (currentStep === 1) {
        formData.birthdayPersonName = document.getElementById('birthdayName').value;
        formData.startText = document.getElementById('startText').value;
        formData.endText = document.getElementById('endText').value;
    }
    
    // Update summary when on step 5
    if (currentStep === 5) {
        updateSummary();
    }
}

// Generate website
function generateWebsite() {
    const generateSection = document.getElementById('generateSection');
    const generateProgress = document.getElementById('generateProgress');
    const generatedSection = document.getElementById('generatedSection');
    
    generateSection.style.display = 'none';
    generateProgress.style.display = 'block';
    
    // Simulate generation process
    setTimeout(() => {
        generateProgress.style.display = 'none';
        generatedSection.style.display = 'block';
        showToast('Files Generated Successfully!', 'Your birthday wish website is ready!', 'success');
    }, 3000);
}

// Download files
function downloadFiles() {
    // Generate the files content
    const files = generateWebsiteFiles();
    
    // Create zip file (simplified - in real implementation, use JSZip library)
    showToast('Download Started', 'Your birthday wish website files are being prepared...', 'success');
    
    // For demo purposes, we'll download individual files
    setTimeout(() => {
        downloadFile('index.html', files.html);
        setTimeout(() => downloadFile('style.css', files.css), 500);
        setTimeout(() => downloadFile('script.js', files.js), 1000);
    }, 1000);
}

// Generate website files
function generateWebsiteFiles() {
    const html = generateHTML();
    const css = generateCSS();
    const js = generateJS();
    
    return { html, css, js };
}

// Generate HTML content
function generateHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Birthday ${formData.birthdayPersonName}! 🎂</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Glitter Background -->
    <div class="glitter-container" id="glitterContainer"></div>
    
    <!-- Floating Hearts -->
    <div class="hearts-container" id="heartsContainer"></div>

    <div class="container">
        <!-- Opening Section -->
        <section id="opening" class="section active">
            <div class="content">
                <h1 class="birthday-title glitter-text">🎉 Happy Birthday 🎉</h1>
                <h2 class="name sparkle-text">${formData.birthdayPersonName}</h2>
                <div class="message-box">
                    <p class="opening-text">${formData.startText}</p>
                </div>
                <button class="start-btn magical-btn" onclick="startGame()">
                    <span class="btn-text">Let's Begin! ✨</span>
                    <div class="btn-sparkles"></div>
                </button>
            </div>
            <div class="floating-emojis">
                <span class="emoji">🎂</span>
                <span class="emoji">🎈</span>
                <span class="emoji">🎉</span>
                <span class="emoji">✨</span>
                <span class="emoji">🎁</span>
            </div>
        </section>

        <!-- Game Section -->
        <section id="game" class="section">
            <div class="game-container magical-card">
                <div class="question-header">
                    <h3 class="question-title">Question <span id="questionNumber">1</span> of ${formData.questions.length}</h3>
                    <div class="sparkle-line"></div>
                </div>
                <p id="questionText" class="question magical-text">${formData.questions[0]?.text || 'Loading question...'}</p>
                
                <div class="images-grid magical-grid" id="imagesGrid">
                    <!-- Images will be populated by JavaScript -->
                </div>
                
                <div class="score-container">
                    <div class="score magical-score">
                        ✨ Score: <span id="score">0</span>/${formData.questions.length} ✨
                    </div>
                </div>
            </div>
        </section>

        <!-- Ending Section -->
        <section id="ending" class="section">
            <div class="content celebration-content">
                <div class="celebration-animation">
                    <h1 class="ending-title celebration-title">🎊 Amazing Job! 🎊</h1>
                    <div class="confetti-explosion"></div>
                </div>
                <p class="final-score rainbow-text">You scored <span id="finalScore">0</span> out of ${formData.questions.length}!</p>
                <div class="message-box celebration-message">
                    <p class="ending-text">${formData.endText}</p>
                </div>
                <button class="restart-btn magical-btn celebration-btn" onclick="restartGame()">
                    <span class="btn-text">Play Again 🔄</span>
                    <div class="btn-sparkles"></div>
                </button>
            </div>
        </section>
    </div>

    <!-- Background Music -->
    <audio id="backgroundMusic" loop>
        <source src="assets/sounds/${formData.backgroundMusic?.name || 'background-music.mp3'}" type="audio/mpeg">
    </audio>

    <script src="script.js"></script>
</body>
</html>`;
}

// Generate CSS content (simplified version of the magical CSS)
function generateCSS() {
    return `/* Birthday Website Magical Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Comic Sans MS', cursive, sans-serif;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #667eea 100%);
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
}

/* Glitter Background Effect */
.glitter-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 1;
}

.glitter {
    position: absolute;
    width: 4px;
    height: 4px;
    background: linear-gradient(45deg, #ffd700, #ffff00, #ffffff);
    border-radius: 50%;
    animation: glitterFall linear infinite;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

@keyframes glitterFall {
    0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
    }
}

/* Container and Layout */
.container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    z-index: 2;
}

.section {
    display: none;
    text-align: center;
    max-width: 900px;
    width: 100%;
    position: relative;
}

.section.active {
    display: block;
    animation: magicalEntrance 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.content, .game-container {
    background: rgba(255, 255, 255, 0.95);
    padding: 60px 40px;
    border-radius: 30px;
    box-shadow: 0 30px 60px rgba(0,0,0,0.2);
    backdrop-filter: blur(15px);
    border: 2px solid rgba(255,255,255,0.3);
    position: relative;
    overflow: hidden;
}

/* Magical Text Effects */
.glitter-text {
    font-size: 4rem;
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24, #ff1744, #9c27b0);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 3s ease-in-out infinite;
    margin-bottom: 20px;
    text-shadow: 0 0 30px rgba(255,255,255,0.5);
}

.sparkle-text {
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 30px;
    position: relative;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

@keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

/* Magical Buttons */
.magical-btn {
    background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    color: white;
    border: none;
    padding: 20px 40px;
    font-size: 1.3rem;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    position: relative;
    overflow: hidden;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.magical-btn:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

/* Images Grid */
.magical-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px;
    margin-bottom: 40px;
}

.image-option {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    border: 3px solid rgba(255,255,255,0.5);
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
}

.image-option:hover {
    transform: translateY(-10px) scale(1.03);
    border-color: #3498db;
    box-shadow: 0 25px 50px rgba(52,152,219,0.3);
}

.image-option img {
    width: 100%;
    height: 250px;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
}

.image-option:hover img {
    transform: scale(1.1);
}

.image-option.correct {
    border-color: #27ae60;
    animation: correctPulse 0.8s ease-in-out;
    box-shadow: 0 0 50px rgba(39,174,96,0.6);
}

.image-option.wrong {
    border-color: #e74c3c;
    animation: wrongShake 0.6s ease-in-out;
    box-shadow: 0 0 30px rgba(231,76,60,0.5);
}

@keyframes correctPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

@keyframes wrongShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-15px); }
    75% { transform: translateX(15px); }
}

/* Message Box */
.message-box {
    background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,248,255,0.9));
    border: 2px solid rgba(123,97,255,0.3);
    border-radius: 20px;
    padding: 30px;
    margin: 30px 0;
    position: relative;
    box-shadow: 0 10px 30px rgba(123,97,255,0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
    .glitter-text { font-size: 2.5rem; }
    .sparkle-text { font-size: 1.8rem; }
    .content, .game-container { padding: 30px 20px; }
    .magical-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    .image-option img { height: 200px; }
}

/* Animation */
@keyframes magicalEntrance {
    0% {
        opacity: 0;
        transform: scale(0.3) rotate(10deg);
        filter: blur(10px);
    }
    100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
        filter: blur(0px);
    }
}`;
}

// Generate JavaScript content
function generateJS() {
    const gameDataJS = {
        images: formData.images.map((img, index) => ({
            id: img.id,
            src: `assets/images/${img.name}`,
            name: img.name
        })),
        questions: formData.questions.map(q => ({
            id: q.id,
            text: q.text,
            correctAnswerId: q.answerId
        }))
    };

    return `// Game data
const gameData = ${JSON.stringify(gameDataJS, null, 2)};

// Game state
let currentQuestionIndex = 0;
let score = 0;
let gameStarted = false;

// DOM elements
const sections = {
    opening: document.getElementById('opening'),
    game: document.getElementById('game'),
    ending: document.getElementById('ending')
};

// Initialize magical effects
document.addEventListener('DOMContentLoaded', function() {
    createGlitterEffect();
    createFloatingHearts();
    
    const music = document.getElementById('backgroundMusic');
    music.volume = 0.3;
    
    document.addEventListener('click', function() {
        if (music.paused) {
            music.play().catch(e => console.log('Audio play failed:', e));
        }
    }, { once: true });
});

// Create glitter falling effect
function createGlitterEffect() {
    const container = document.getElementById('glitterContainer');
    
    setInterval(() => {
        const glitter = document.createElement('div');
        glitter.className = 'glitter';
        glitter.style.left = Math.random() * 100 + 'vw';
        glitter.style.animationDuration = (Math.random() * 3 + 2) + 's';
        glitter.style.animationDelay = Math.random() * 2 + 's';
        
        container.appendChild(glitter);
        
        setTimeout(() => {
            if (glitter.parentNode) {
                glitter.parentNode.removeChild(glitter);
            }
        }, 5000);
    }, 300);
}

// Create floating hearts effect
function createFloatingHearts() {
    const container = document.getElementById('heartsContainer');
    const hearts = ['💖', '💕', '💗', '💘', '💝'];
    
    setInterval(() => {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.animationDuration = (Math.random() * 4 + 6) + 's';
        heart.style.fontSize = (Math.random() * 10 + 15) + 'px';
        
        container.appendChild(heart);
        
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 10000);
    }, 2000);
}

// Show section
function showSection(sectionName) {
    Object.values(sections).forEach(section => {
        section.classList.remove('active');
    });
    
    setTimeout(() => {
        sections[sectionName].classList.add('active');
    }, 100);
}

// Start the game
function startGame() {
    gameStarted = true;
    currentQuestionIndex = 0;
    score = 0;
    showSection('game');
    
    setTimeout(() => {
        displayQuestion();
    }, 500);
}

// Display current question
function displayQuestion() {
    if (currentQuestionIndex >= gameData.questions.length) {
        endGame();
        return;
    }

    const question = gameData.questions[currentQuestionIndex];
    
    document.getElementById('questionNumber').textContent = currentQuestionIndex + 1;
    document.getElementById('questionText').textContent = question.text;
    document.getElementById('score').textContent = score;
    
    const shuffledImages = [...gameData.images].sort(() => Math.random() - 0.5);
    
    const imagesGrid = document.getElementById('imagesGrid');
    imagesGrid.innerHTML = '';
    
    shuffledImages.forEach((image, index) => {
        const imageElement = document.createElement('div');
        imageElement.className = 'image-option';
        imageElement.style.animationDelay = (index * 0.1) + 's';
        imageElement.innerHTML = \`<img src="\${image.src}" alt="\${image.name}" />\`;
        
        imageElement.addEventListener('click', () => {
            handleImageClick(image.id, question.correctAnswerId, imageElement);
        });
        
        imagesGrid.appendChild(imageElement);
    });
}

// Handle image click
function handleImageClick(selectedImageId, correctAnswerId, imageElement) {
    const allImages = document.querySelectorAll('.image-option');
    allImages.forEach(img => {
        img.style.pointerEvents = 'none';
    });
    
    if (selectedImageId == correctAnswerId) {
        imageElement.classList.add('correct');
        score++;
        
        setTimeout(() => {
            showFeedback('🎉 Correct! Amazing memory! ✨', 'success');
        }, 300);
        
    } else {
        imageElement.classList.add('wrong');
        
        allImages.forEach(img => {
            const imgSrc = img.querySelector('img').src;
            const correctImage = gameData.images.find(image => image.id == correctAnswerId);
            if (correctImage && imgSrc.includes(correctImage.name)) {
                img.classList.add('correct');
            }
        });
        
        setTimeout(() => {
            showFeedback('💫 Oops! The correct answer is highlighted! 💫', 'error');
        }, 300);
    }
    
    setTimeout(() => {
        currentQuestionIndex++;
        displayQuestion();
    }, 3000);
}

// Show feedback
function showFeedback(message, type) {
    const feedback = document.createElement('div');
    feedback.className = \`feedback \${type}\`;
    feedback.textContent = message;
    feedback.style.cssText = \`
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: \${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 15px 30px;
        border-radius: 25px;
        font-weight: bold;
        z-index: 1000;
        animation: feedbackSlide 0.5s ease-out;
    \`;
    
    document.body.appendChild(feedback);
    
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 2000);
}

// End the game
function endGame() {
    document.getElementById('finalScore').textContent = score;
    showSection('ending');
}

// Restart the game
function restartGame() {
    currentQuestionIndex = 0;
    score = 0;
    showSection('opening');
}

// CSS for feedback animation
const style = document.createElement('style');
style.textContent = \`
    @keyframes feedbackSlide {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
\`;
document.head.appendChild(style);`;
}

// Preview website
function previewWebsite() {
    showToast('Preview Opening', 'Opening preview in a new window...', 'success');
    
    // Generate preview HTML with inline CSS and JS
    const previewHTML = generatePreviewHTML();
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
}

// Generate preview HTML with inline styles
function generatePreviewHTML() {
    const files = generateWebsiteFiles();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - Happy Birthday ${formData.birthdayPersonName}! 🎂</title>
    <style>${files.css}</style>
</head>
${files.html.split('<head>')[1].split('</head>')[1].split('<body>')[1].split('</body>')[0]}
<script>${files.js}</script>
</body>
</html>`;
}

// Load demo data
function loadDemoData() {
    // Create mock images
    const demoImages = [
        { name: 'vacation-beach.jpg', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop' },
        { name: 'birthday-party.jpg', url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop' },
        { name: 'hiking-adventure.jpg', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop' },
        { name: 'coffee-date.jpg', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop' },
        { name: 'graduation-day.jpg', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop' }
    ];
    
    formData = {
        birthdayPersonName: 'Sarah Johnson',
        startText: 'Happy Birthday Sarah! 🎉 Today we celebrate all the amazing memories we\'ve shared together. Get ready for a fun trip down memory lane!',
        endText: 'Thank you for being such an incredible friend! Here\'s to many more years of laughter, adventures, and unforgettable moments. Happy Birthday! 🎂✨',
        images: demoImages.map((img, index) => ({
            id: Date.now() + index,
            name: img.name,
            url: img.url,
            size: '2.5 MB',
            file: null
        })),
        questions: [
            { id: 1, text: 'Where did we take our first vacation together?', answerId: Date.now() },
            { id: 2, text: 'Which photo shows your most memorable birthday celebration?', answerId: Date.now() + 1 },
            { id: 3, text: 'What was our most challenging adventure?', answerId: Date.now() + 2 }
        ],
        backgroundMusic: {
            name: 'happy-birthday-melody.mp3',
            size: '4.2 MB',
            file: null
        }
    };
    
    // Update form inputs
    document.getElementById('birthdayName').value = formData.birthdayPersonName;
    document.getElementById('startText').value = formData.startText;
    document.getElementById('endText').value = formData.endText;
    
    // Update displays
    updateImagesDisplay();
    updateAnswerSelect();
    updateQuestionsDisplay();
    updateMusicDisplay();
    updateSummary();
    
    showToast('Demo Data Loaded', 'Sample data has been loaded for testing', 'success');
}

// Check for demo data URL parameter
function loadDemoDataIfUrlParam() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === 'true') {
        loadDemoData();
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadFile(filename, content) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
    `;
    
    const container = document.getElementById('toastContainer');
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 5000);
}

let courses = [];
let currentCourse = null;
let currentFolderPath = null;
let zoomLevel = 1;
let isResizing = false;

// DOM元素
const homePage = document.getElementById('home-page');
const studyPage = document.getElementById('study-page');
const courseContainer = document.getElementById('course-container');
const selectFolderBtn = document.getElementById('select-folder-btn');
const currentFolderDiv = document.getElementById('current-folder');
const backBtn = document.getElementById('back-btn');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const zoomResetBtn = document.getElementById('zoom-reset');
const zoomDisplay = document.getElementById('zoom-display');
const resizer = document.getElementById('resizer');
const leftPane = document.getElementById('left-pane');
const rightPane = document.getElementById('right-pane');

// 初始化
async function init() {
    // 加载保存的配置
    const config = await window.electronAPI.loadConfig();
    if (config && config.folderPath) {
        currentFolderPath = config.folderPath;
        await scanAndDisplayCourses(currentFolderPath);
    }

    // 绑定事件
    selectFolderBtn.addEventListener('click', selectFolder);
    backBtn.addEventListener('click', backToHome);
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    zoomResetBtn.addEventListener('click', resetZoom);

    // 分屏拖动
    initResizer();
}

// 选择文件夹
async function selectFolder() {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
        currentFolderPath = folderPath;
        await scanAndDisplayCourses(folderPath);
        
        // 保存配置
        await window.electronAPI.saveConfig({ folderPath });
    }
}

// 扫描并显示课程
async function scanAndDisplayCourses(folderPath) {
    courseContainer.innerHTML = '<div class="loading">正在扫描文件夹</div>';
    currentFolderDiv.textContent = `当前文件夹: ${folderPath}`;

    courses = await window.electronAPI.scanCourses(folderPath);
    
    if (courses.length === 0) {
        courseContainer.innerHTML = `
            <div class="empty-state">
                <h2>📂 未找到课程资料</h2>
                <p>请确保文件夹中包含子文件夹，每个子文件夹代表一门课程</p>
                <p style="margin-top: 10px;">支持的文件类型: .url (网页链接), .pdf (PDF文档)</p>
            </div>
        `;
        return;
    }

    renderCourses();
}

// 渲染课程列表
function renderCourses() {
    courseContainer.innerHTML = '';
    
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.onclick = () => openCourse(course);
        
        const videoCount = course.resources.filter(r => r.type === 'video').length;
        const pdfCount = course.resources.filter(r => r.type === 'pdf').length;
        
        card.innerHTML = `
            <h3>${course.name}</h3>
            <ul class="resource-list">
                ${course.resources.slice(0, 5).map(r => `
                    <li class="resource-item ${r.type}">${r.name}</li>
                `).join('')}
                ${course.resources.length > 5 ? `
                    <li class="resource-item" style="color: #999;">
                        ... 还有 ${course.resources.length - 5} 个资源
                    </li>
                ` : ''}
            </ul>
            <div class="course-stats">
                <span>🎥 ${videoCount} 个视频</span>
                <span>📄 ${pdfCount} 个文件</span>
            </div>
        `;
        
        courseContainer.appendChild(card);
    });
}

// 打开课程
function openCourse(course) {
    currentCourse = course;
    homePage.style.display = 'none';
    studyPage.style.display = 'flex';
    document.getElementById('current-course-title').textContent = course.name;
    
    renderResourceSelector();
    resetZoom();
    
    // 重置分屏比例
    leftPane.style.flex = '0 0 50%';
    rightPane.style.flex = '0 0 50%';
}

// 渲染资源选择器
function renderResourceSelector() {
    const selector = document.getElementById('resource-selector');
    selector.innerHTML = '';
    
    currentCourse.resources.forEach((resource, index) => {
        const tab = document.createElement('button');
        tab.className = 'resource-tab';
        tab.textContent = `${resource.type === 'video' ? '🎥' : '📄'} ${resource.name}`;
        tab.onclick = () => loadResource(resource, index);
        selector.appendChild(tab);
    });
}

// 加载资源
function loadResource(resource, index) {
    // 更新活动标签
    document.querySelectorAll('.resource-tab').forEach((tab, i) => {
        tab.classList.toggle('active', i === index);
    });
    
    if (resource.type === 'video') {
        loadVideo(resource.url);
    } else {
        loadPDF(resource.path);
    }
}

// 加载视频
function loadVideo(url) {
    const container = document.getElementById('webview-container');
    container.innerHTML = `
        <webview 
            src="${url}" 
            style="width: 100%; height: 100%;"
            allowpopups
            webpreferences="allowRunningInsecureContent"
        ></webview>
    `;
    applyZoom();
}

// 加载PDF
async function loadPDF(filePath) {
    const rightPane = document.getElementById('right-pane');
    
    if (!filePath) {
        rightPane.innerHTML = `
            <div class="placeholder">
                <h2>📁 请选择PDF文件</h2>
                <button class="select-folder-btn" onclick="selectPDFFile()">选择文件</button>
            </div>
        `;
        return;
    }

    // 使用file协议加载PDF
    rightPane.innerHTML = `
        <webview 
            src="file:///${filePath.replace(/\\/g, '/')}" 
            class="pdf-viewer"
            plugins
        ></webview>
    `;
}

// 选择PDF文件
async function selectPDFFile() {
    const pdfPath = await window.electronAPI.selectPDF();
    if (pdfPath) {
        await loadPDF(pdfPath);
    }
}

// 缩放控制
function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.1, 3);
    applyZoom();
}

function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
    applyZoom();
}

function resetZoom() {
    zoomLevel = 1;
    applyZoom();
}

function applyZoom() {
    const container = document.getElementById('webview-container');
    container.style.transform = `scale(${zoomLevel})`;
    container.style.width = `${100 / zoomLevel}%`;
    container.style.height = `${100 / zoomLevel}%`;
    zoomDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
}

// 分屏拖动（优化版）
function initResizer() {
    let startX = 0;
    let startLeftWidth = 0;

    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        
        // 记录初始宽度
        const container = document.querySelector('.split-container');
        const containerRect = container.getBoundingClientRect();
        const leftRect = leftPane.getBoundingClientRect();
        startLeftWidth = (leftRect.width / containerRect.width) * 100;
        
        // 添加全局拖动样式
        document.body.classList.add('resizing');
    });

    // 使用 document 监听，避免鼠标移出元素后失去控制
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        e.preventDefault();
        
        const container = document.querySelector('.split-container');
        const containerRect = container.getBoundingClientRect();
        
        // 计算新的宽度百分比
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / containerRect.width) * 100;
        let newLeftWidth = startLeftWidth + deltaPercent;
        
        // 限制范围 15% - 85%
        newLeftWidth = Math.max(15, Math.min(85, newLeftWidth));
        
        // 应用新宽度
        leftPane.style.flex = `0 0 ${newLeftWidth}%`;
        rightPane.style.flex = `0 0 ${100 - newLeftWidth}%`;
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.classList.remove('resizing');
        }
    });

    // 防止拖动时选中文本
    resizer.addEventListener('selectstart', (e) => {
        e.preventDefault();
    });
    
    // 双击重置为50-50
    resizer.addEventListener('dblclick', () => {
        leftPane.style.flex = '0 0 50%';
        rightPane.style.flex = '0 0 50%';
    });
}

// 返回主页
function backToHome() {
    studyPage.style.display = 'none';
    homePage.style.display = 'flex';
    currentCourse = null;
}

// 初始化应用
init();
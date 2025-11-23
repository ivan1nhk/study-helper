const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile('index.html');

    // 开发时打开开发者工具
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 选择学习资料文件夹
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: '选择学习资料文件夹',
        defaultPath: 'C:\\Users\\15510\\Desktop\\计量经济学补课'
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// 扫描文件夹获取课程
ipcMain.handle('scan-courses', async (event, folderPath) => {
    try {
        const courses = [];
        const folders = await fs.readdir(folderPath, { withFileTypes: true });

        for (const folder of folders) {
            if (folder.isDirectory()) {
                const coursePath = path.join(folderPath, folder.name);
                const resources = await scanCourseResources(coursePath);
                
                if (resources.length > 0) {
                    courses.push({
                        id: Date.now() + Math.random(),
                        name: folder.name,
                        path: coursePath,
                        resources: resources
                    });
                }
            }
        }

        return courses;
    } catch (error) {
        console.error('扫描文件夹失败:', error);
        return [];
    }
});

// 扫描课程资源
async function scanCourseResources(coursePath) {
    const resources = [];
    
    try {
        const files = await fs.readdir(coursePath, { withFileTypes: true });

        for (const file of files) {
            const filePath = path.join(coursePath, file.name);
            
            // 读取 .url 快捷方式
            if (file.name.toLowerCase().endsWith('.url')) {
                const url = await readUrlShortcut(filePath);
                if (url) {
                    resources.push({
                        type: 'video',
                        name: file.name.replace('.url', ''),
                        url: url,
                        path: filePath
                    });
                }
            }
            // 读取 .lnk 快捷方式（指向本地文件）
            else if (file.name.toLowerCase().endsWith('.lnk')) {
                // Windows快捷方式需要额外处理
                const targetPath = await resolveLnkShortcut(filePath);
                if (targetPath && targetPath.toLowerCase().endsWith('.pdf')) {
                    resources.push({
                        type: 'pdf',
                        name: file.name.replace('.lnk', ''),
                        url: targetPath,
                        path: targetPath
                    });
                }
            }
            // 直接读取 PDF 文件
            else if (file.name.toLowerCase().endsWith('.pdf')) {
                resources.push({
                    type: 'pdf',
                    name: file.name,
                    url: filePath,
                    path: filePath
                });
            }
            // 读取其他可能的视频链接文件
            else if (file.name.toLowerCase().match(/\.(txt|link)$/)) {
                const content = await fs.readFile(filePath, 'utf-8');
                const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    resources.push({
                        type: 'video',
                        name: file.name.replace(/\.(txt|link)$/, ''),
                        url: urlMatch[1],
                        path: filePath
                    });
                }
            }
        }
    } catch (error) {
        console.error('扫描课程资源失败:', error);
    }

    return resources;
}

// 读取 .url 快捷方式
async function readUrlShortcut(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const urlMatch = content.match(/URL=(.+)/i);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1].trim();
        }
    } catch (error) {
        console.error('读取URL快捷方式失败:', error);
    }
    return null;
}

// 解析 .lnk 快捷方式（简单实现）
async function resolveLnkShortcut(filePath) {
    try {
        // Windows .lnk 文件格式较复杂，这里使用简单的方法
        // 在生产环境建议使用 windows-shortcuts 或 lnk-parser 库
        const stat = await fs.stat(filePath);
        if (stat.isSymbolicLink()) {
            return await fs.readlink(filePath);
        }
        // 如果不是符号链接，返回原路径
        // 注意：真实的.lnk文件需要专门的解析库
        return null;
    } catch (error) {
        return null;
    }
}

// 读取PDF文件
ipcMain.handle('read-pdf', async (event, filePath) => {
    try {
        const data = await fs.readFile(filePath);
        return {
            success: true,
            data: data.toString('base64'),
            path: filePath
        };
    } catch (error) {
        console.error('读取PDF失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// 选择PDF文件
ipcMain.handle('select-pdf', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'PDF文件', extensions: ['pdf'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// 保存配置
ipcMain.handle('save-config', async (event, config) => {
    try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 加载配置
ipcMain.handle('load-config', async () => {
    try {
        const configPath = path.join(app.getPath('userData'), 'config.json');
        if (fsSync.existsSync(configPath)) {
            const data = await fs.readFile(configPath, 'utf-8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        return null;
    }
});
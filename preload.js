const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 选择文件夹
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    
    // 扫描课程
    scanCourses: (folderPath) => ipcRenderer.invoke('scan-courses', folderPath),
    
    // 读取PDF
    readPDF: (filePath) => ipcRenderer.invoke('read-pdf', filePath),
    
    // 选择PDF文件
    selectPDF: () => ipcRenderer.invoke('select-pdf'),
    
    // 保存配置
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    
    // 加载配置
    loadConfig: () => ipcRenderer.invoke('load-config')
});
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Zalo } = require('zca-js');

let mainWindow;
let zaloApi = null;
let zaloInstance = null;
let isAutoReplyEnabled = false;
let autoReplyMessage = 'Xin chào! Tôi đang bận, sẽ phản hồi bạn sau. 🙏';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true,
        resizable: false
    });

    mainWindow.loadFile('index.html');
    
    // Mở DevTools nếu cần debug
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        // Dừng listener trước khi thoát
        if (zaloApi && zaloApi.listener) {
            try {
                zaloApi.listener.stop();
            } catch (e) {
                console.log('Listener already stopped');
            }
        }
        app.quit();
    }
});

// Xử lý đăng nhập QR
ipcMain.handle('login-qr', async () => {
    try {
        sendLog('Đang khởi tạo đăng nhập...', 'info');
        
        zaloInstance = new Zalo({
            imei: generateRandomImei(),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });

        sendLog('Đang tạo mã QR...', 'info');
        
        zaloApi = await zaloInstance.login({
            onQR: (qrData) => {
                // Gửi QR code về renderer
                mainWindow.webContents.send('qr-code', qrData);
                sendLog('Vui lòng quét mã QR bằng app Zalo', 'info');
            }
        });

        sendLog('✅ Đăng nhập thành công!', 'success');
        
        // Bắt đầu listener
        startListener();
        
        return { success: true, message: 'Đăng nhập thành công!' };
    } catch (error) {
        sendLog(`❌ Lỗi đăng nhập: ${error.message}`, 'error');
        return { success: false, message: error.message };
    }
});

// Bắt đầu lắng nghe tin nhắn
function startListener() {
    if (!zaloApi || !zaloApi.listener) {
        sendLog('❌ Chưa đăng nhập', 'error');
        return;
    }

    try {
        zaloApi.listener.on('message', async (message) => {
            try {
                const isPlainText = typeof message.data.content === 'string';
                
                if (!isPlainText) return;

                const senderName = message.data.senderName || 'Unknown';
                const content = message.data.content;
                const threadId = message.threadId;
                const isGroup = message.type === 'Group';
                
                const logType = isGroup ? '👥 Group' : '👤 User';
                sendLog(`${logType} ${senderName}: "${content}"`, 'receive');

                // Tự động trả lời nếu bật
                if (isAutoReplyEnabled) {
                    await zaloApi.sendMessage({
                        message: autoReplyMessage,
                        threadId: threadId,
                        threadType: message.type
                    });
                    
                    sendLog(`✅ Đã trả lời: "${autoReplyMessage}"`, 'send');
                }
            } catch (err) {
                sendLog(`❌ Lỗi xử lý tin nhắn: ${err.message}`, 'error');
            }
        });

        zaloApi.listener.start();
        sendLog('🎧 Bắt đầu lắng nghe tin nhắn...', 'info');
    } catch (error) {
        sendLog(`❌ Lỗi listener: ${error.message}`, 'error');
    }
}

// Bật/tắt auto reply
ipcMain.handle('toggle-auto-reply', async (event, enabled) => {
    isAutoReplyEnabled = enabled;
    const status = enabled ? '🟢 BẬT' : '⚫ TẮT';
    sendLog(`Auto Reply: ${status}`, 'info');
    return { success: true, enabled: isAutoReplyEnabled };
});

// Cập nhật tin nhắn tự động
ipcMain.handle('update-message', async (event, message) => {
    autoReplyMessage = message;
    sendLog(`💬 Cập nhật tin nhắn: "${message}"`, 'info');
    return { success: true };
});

// Gửi log đến renderer
function sendLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('vi-VN');
    mainWindow.webContents.send('log-message', {
        time: timestamp,
        message: message,
        type: type
    });
}

// Tạo IMEI ngẫu nhiên
function generateRandomImei() {
    let imei = '';
    for (let i = 0; i < 15; i++) {
        imei += Math.floor(Math.random() * 10);
    }
    return imei;
}

// Đăng xuất
ipcMain.handle('logout', async () => {
    try {
        if (zaloApi && zaloApi.listener) {
            zaloApi.listener.stop();
        }
        zaloApi = null;
        zaloInstance = null;
        isAutoReplyEnabled = false;
        sendLog('👋 Đã đăng xuất', 'info');
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

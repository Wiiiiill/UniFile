import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

function getHash(path, type = 'sha256') {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(path)
    const hash = crypto.createHash(type)
    readStream.on('data', (chunk) => {
      hash.update(chunk)
    })

    // 监听可读流的结束事件，完成哈希计算
    readStream.on('end', () => {
      const hexHash = hash.digest('hex')
      // console.log('SHA-256 hash of the file:', hexHash)
      resolve(hexHash)
    })

    // 监听可读流的错误事件，处理可能发生的错误
    readStream.on('error', (err) => {
      console.error('Error reading file:', err)
      reject(err)
    })
  })
}

function getFiles(dir, fileList = []) {
  // 读取目录中的文件和文件夹
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const fullPath = path.join(dir, file)
    // 检查是文件还是目录
    const fileStats = fs.statSync(fullPath)
    if (fileStats.isDirectory()) {
      // 如果是目录，则递归调用
      getFiles(fullPath, fileList)
    } else {
      // 如果是文件，则添加到文件列表中
      fileList.push(fullPath)
    }
  })

  return fileList
}

// 监听异步消息
ipcMain.on('getHash', (event, arg) => {
  getHash(arg)
    .then((e) => event.reply(arg, e))
    .catch((e) => event.reply(arg, e))
})

ipcMain.on('delFiles', (event, files) => {
  let resultlist = []
  let filelist = JSON.parse(files)
  for (let index = 0; index < filelist.length; index++) {
    let filePath = filelist[index]
    try {
      fs.unlinkSync(filePath)
      resultlist.push('')
    } catch (err) {
      resultlist.push(err)
    }
  }
  event.reply('delFiles-done', resultlist)
})

ipcMain.on('open-directory-dialog', (event) => {
  dialog
    .showOpenDialog({
      properties: ['openDirectory']
    })
    .then((result) => {
      console.log('resultresult', result)
      if (!result.canceled && result.filePaths && result.filePaths.length) {
        let files = []
        getFiles(result.filePaths[0], files)
        event.reply('files-selected', files)
        event.reply('filePath', result.filePaths[0])
      }
    })
    .catch((err) => {
      console.error(err)
    })
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

const fs = require('fs')
const path = require('path')

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

// 使用示例
const folderPath = 'C:Users\64813Pictures掉图\2022' // 替换为你的文件夹路径
const files = getFiles(folderPath)
console.log(files)

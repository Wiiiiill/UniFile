<template>
    <div class="main" align="center">
        <div v-if="status == ''">
            <button @click="openDirectoryDialog">选择目录</button>
        </div>
        <h3 v-if="status != ''">当前目录:{{ path }}</h3>
        <div v-if="status == 'loading'">
            <h3> 正在扫描重复文件 ...</h3>
            <div class="current">
                {{ current }}
            </div>
            <div class="loading" :style="`--progress:${getRate()}%; `" :data-progress="`${getRate()}%`">
            </div>
        </div>
        <div v-if="status == 'final'">

            <div>
                <button @click="openDirectoryDialog">重新选择目录</button>
                <button @click="clean">快速清理</button>
            </div>
            <div class="finalDiv">
                <div></div>
                <div style="text-align:left;">
                    <!-- <table>
                        <th></th>
                        <th>文件名</th>
                        <th>目录</th>
                        <tbody v-for="files in Object.values(this.fileHashMap).filter(e => e.length > 1)" :key="files">
                            <tr v-for="file in files" :key="file">
                                <td>
                                    <input type="checkBox">
                                </td>
                                <td>{{ getFileName(file) }}</td>
                                <td>{{ getFolder(file) }}</td>
                            </tr>
                        </tbody>
                    </table> -->
                    <div style="border:1px solid none;margin:24px;"
                        v-for="files in Object.values(this.fileHashMap).filter(e => e.length > 1)" :key="files">
                        <ul v-for="file in files" :key="file">
                            <li>
                                <input type="checkbox" v-model="checkedFiles" :id="file" :value="file">
                                <span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;width:512px">
                                    {{ file.replace(path + '\\', '') }}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            files: [],
            fileCheckMap: {},
            fileHashMap: {},
            fileMap: {},
            status: '',
            current: '',
            path: '',
            checkedFiles: [],
        };
    },
    watch: {
        fileMap: {
            deep: true,
            handler(n) {
                if (this.files.length != 0) {
                    if (Object.values(n).length == this.files.length) {
                        this.status = 'final'
                        this.checkedFiles = Object.keys(this.fileCheckMap).filter(e => this.fileCheckMap[e])
                    } else {
                        this.status = 'loading'
                    }
                }
            }
        }
    },
    created() {
    },
    methods: {
        clean() {
            if (this.checkedFiles.length) {
                let t = window.confirm(`已选择${this.checkedFiles.length}个文件，确认要删除`)
                if (t) {
                    window.electron.ipcRenderer.send("delFiles", JSON.stringify(this.checkedFiles))
                    window.electron.ipcRenderer.once("delFiles-done", (event, result) => {
                        console.log('result', result)
                        let success = result.filter(e => !e.length).length
                        let fail = result.filter(e => e.length)
                        let messsage = `成功删除${success}个文件${fail.length >0? `，${fail.length}个文件删除失败原因如下:${fail.join(';')}`:''}`
                        window.alert(messsage)
                    })
                }
            }
        },
        getFolder(fullpath) {
            let t = fullpath.split('\\')
            t.pop()
            return t.join('\\')
        },
        getFileName(fullpath) {
            let t = fullpath.split('\\')
            return t[t.length - 1]
        },
        getRate() {
            return ((Object.values(this.fileMap).length / this.files.length) * 100).toFixed(2)
        },
        reset() {
            this.files = []
            this.checkedFiles = []
            this.fileCheckMap = {}
            this.fileHashMap = {}
            this.fileMap = {}
            this.status = ''
            this.current = ''
            this.path = ''
        },
        getHashs() {
            for (let i = 0; i < this.files.length; i++) {
                let e = this.files[i]
                window.electron.ipcRenderer.send('getHash', e);
                window.electron.ipcRenderer.once(e, (event, arg) => {
                    this.status = 'loading'
                    this.current = e
                    this.fileMap[e] = arg
                    let temp = []
                    if (this.fileHashMap[arg]) {
                        temp = this.fileHashMap[arg]
                        temp.push(e)
                        this.fileCheckMap[e] = true
                    } else {
                        temp = [e]
                    }
                    this.fileHashMap[arg] = temp
                });
            }
        },
        openDirectoryDialog() {
            this.reset()
            window.electron.ipcRenderer.send('open-directory-dialog');
            window.electron.ipcRenderer.once('filePath', (event, path) => {
                this.path = path
            })
            window.electron.ipcRenderer.once('files-selected', (event, files) => {
                this.files = files;
                this.getHashs()
            });
        }
    },
}
</script>
<style scoped>
.main {
    padding: 48px;
}

.current {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 512px;
}

.loading {
    margin-top: 100px;
    width: 200px;
    border-radius: 50%;
    position: relative;
    height: 200px;
    background: conic-gradient(green 0%, green var(--progress), #f1f1f1 var(--progress), #f1f1f1 100%);

}

.loading::before {
    content: attr(data-progress);
    position: absolute;
    inset: 10px;
    background-color: #fff;
    width: 180px;
    height: 180px;
    text-align: center;
    line-height: 180px;
    border-radius: 50%;
}

.finalDiv {
    display: flex;
}
</style>

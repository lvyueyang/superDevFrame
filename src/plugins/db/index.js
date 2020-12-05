import Http from '../http';

// function getFile(projectId, filePath) {
//     return this.http.get(`/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=master`).then(res => res.text());
// }

// function createFile(path, data) {

// }

// function renderScriptFile(str) {
//     let script = document.createElement('script');
//     const blob = new Blob([str], { type: 'text/plain;charset=utf-8' });
//     script.src = URL.createObjectURL(blob);
//     script.type = 'text/javascript';
//     document.documentElement.appendChild(script)
// }

// getFile('1392', 'index.js').then(res => {
//     console.log(res);
//     renderScriptFile(res);
// })

export function isJson(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return false;
    }
}

export function uuid() {
    var s = [];
    var hexDigits = '0123456789abcdef';
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = '-';

    var uuid = s.join('');
    return uuid;
}

export default class GDb {
    constructor({ projectId, filePath, privateToken, baseURL, indexing, success, fail, userName, branch }) {
        this.projectId = projectId;
        this.filePath = filePath;
        this.privateToken = privateToken;
        this.baseURL = baseURL;
        this.userName = userName;
        this.branch = branch || 'master';
        this.indexing = indexing || [];
        this.success = success;
        this.fail = fail;
        this.http = new Http({
            privateToken,
            baseURL
        });
    }
    _getFile() {
        const { projectId, filePath, branch } = this;
        return this.http.get(`/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}/raw?ref=${branch}`).then(res => res.text());
    }
    _createFile(content) {
        const { projectId, filePath, branch, userName } = this;
        const url = `/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
        return this.http.post(url, {
            branch,
            content: JSON.stringify(content),
            commit_message: `${userName}_createFile_${new Date()}`,
        });
    }
    _updateFile(content) {
        const { projectId, filePath, branch, userName } = this;
        const url = `/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}`;
        return this.http.put(url, {
            branch,
            content: content ? JSON.stringify(content) : '',
            commit_message: `${userName}_updateFile_${new Date()}`,
        });
    }
    /**
     * 获取文件数据 返回的一定是个 Object / Array
     */
    async query() {
        try {
            const { http, projectId, filePath } = this;
            const res = await this._getFile(http, { projectId, filePath });
            const data = isJson(res)
            if (data) {
                return Promise.resolve(data);
            }
            return Promise.reject(res);
        } catch (e) {
            if (e.status === 404) {
                return this._createFile();
            }
            return Promise.reject(e);
        }
    }
    async create(data) {
        if (!data) {
            return Promise.reject({
                message: '数据不存在'
            });
        }
        const { indexing } = this;
        if (indexing.some(key => !data[key])) {
            // data里缺少必填字段
            return Promise.reject({
                message: '存在必填字段'
            });
        }
        try {
            const list = await this.query();
            // 索引重复判断 start
            let isIndexingRepeat = false;
            for (let key of indexing) {
                if (list.some(item => data[key] === item[key])) {
                    isIndexingRepeat = true;
                }
            }
            if (isIndexingRepeat) {
                return Promise.reject({
                    message: '索引字段出现重复'
                });
            }
            // 索引重复判断 end
            list.push({
                ...data,
                id: uuid(),
                createAt: Date.now(),
                updateAt: Date.now(),
            });
            await this._updateFile(list);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }
    async delete(id) {
        if (!id) {
            return Promise.reject({
                message: 'ID 不存在'
            });
        }
        try {
            const res = await this.query();
            const list = res.filter((item) => item.id !== id);
            await this._updateFile(list);
            return Promise.resolve(list);
        } catch (e) {
            return Promise.reject(e);
        }
    }
    async update(id, data) {
        if (!data) {
            return Promise.reject();
        }
        let ids;
        if (Array.isArray(id)) {
            ids = id;
        } else {
            ids = [id];
        }
        try {
            const res = await this.query();
            const list = res.map((item) => {
                if (item.id === id) {
                    const newItem = {
                        ...item,
                        ...data,
                        id,
                        updateAt: Date.now()
                    }
                    return newItem;
                }
                return item;
            });
            await this._updateFile(list);
            return Promise.resolve(list);
        } catch (e) {
            return Promise.reject(e);
        }
    }
}

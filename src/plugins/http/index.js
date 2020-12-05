function formatUrl(baseURL, url) {
    if (url.substring(0, 1) === '/') {
        url = url.substring(1, url.length);
    }
    console.log(url);
    if (baseURL.substring(baseURL.length - 1, baseURL.length) === '/') {
        baseURL = baseURL.substring(0, baseURL.length - 1);
    }
    return `${baseURL}/${url}`;
}
function formatParams(params) {
    if (!params) return '';
    const u = new URLSearchParams();
    for (const key in params) {
        u.append(key, params[key]);
    }
    return u.toString();
}

function api(...arg) {
    return new Promise((resolve, reject) => {
        fetch(...arg).then(res => {
            if (res.ok) {
                resolve(res);
            } else {
                reject(res);
            }
        }).catch(e => {
            reject(e);
        })
    })
}

export default class Http {
    constructor({ privateToken, baseURL }) {
        this.privateToken = privateToken;
        this.baseURL = baseURL;
        this.headers = {
            'Private-Token': privateToken,
            'Content-Type': 'application/json'
        }
    }

    get(path, params) {
        let url = formatUrl(this.baseURL, path);
        const paramStr = formatParams(params);
        if (url.includes('?')) {
            url += `&${paramStr}`;
        } else {
            url += `?${paramStr}`;
        }
        return api(url, {
            headers: this.headers
        })
    }

    post(path, body = {}) {
        let url = formatUrl(this.baseURL, path);
        return api(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: this.headers
        })
    }

    put(path, body = {}) {
        let url = formatUrl(this.baseURL, path);
        return api(url, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: this.headers
        })
    }

    delete(path, body = {}) {
        let url = formatUrl(this.baseURL, path);
        return api(url, {
            method: 'DELETE',
            body: JSON.stringify(body),
            headers: this.headers
        })
    }
}
// ==UserScript==
// @name        Gitlab enhance
// @namespace   Violentmonkey Scripts
// @match       https://gitlab.tronclass.com.cn/lms/lms/-/pipelines
// @grant       none
// @version     1.0
// @author      -
// @description 2023/9/28 15:50:08
// @grant       GM_setClipboard
// ==/UserScript==


const targetNode = document.body;
const config = { childList: true, subtree: true };

const callback = (mutationList, observer) => {
    result = document.querySelector('.ci-table')
    if (result) {
        inject(result)
        continueObserver()
        observer.disconnect();
    }
};

const observer = new MutationObserver(callback);
observer.observe(targetNode, config);


const continueObserver = () => {
    const container = document.querySelector('.pipelines');
    const config = { childList: true };

    const callback = (mutationList, observer) => {
        inject()
    };

    const observer = new MutationObserver(callback);
    observer.observe(container, config);
}


const fetchGzip = (url) => {
    return fetch(url)
        .then(response => response.body)
        .then((s) => {
            const stream = s.pipeThrough(new DecompressionStream('gzip'));
            return new Response(stream).text()
        })
}

const fetchVersion = (jobId) => {
    return fetchGzip(`/lms/lms/-/jobs/${jobId}/artifacts/download?file_type=dotenv`)
        .then(text => {
            return text.match(/IMAGE_VERSION=(.+)/)[1]
        })
}


const inject = () => {
    document.querySelectorAll(".ci-table tbody tr").forEach(tr => {
        const btnGroup = tr.querySelector('td:nth-last-child(1) .btn-group')
        const button = document.createElement('button')
        button.classList.add(...'btn btn-default btn-md gl-button btn-default-secondary btn-icon'.split(' '))
        button.innerText = '⌘'
        btnGroup.appendChild(button)
        button.addEventListener('click', () => {
            button.innerText = '...'
            const href = tr.querySelector('.qa-status-badge').href
            const stageUrl = href + '/stage.json?stage=commit'
            fetch(stageUrl).then(res => res.json()).then(result => {
                const item = result.latest_statuses.find(i => i.name === 'version-update')
                return fetchVersion(item.id)
            }).then((version) => {
                GM_setClipboard(version)
                button.innerText = '✅'
                console.log(version)
            })
                .catch(() => {
                    button.innerText = '❌'
                })
        })
    })

    if (document.querySelector('.injected-nav-item')) {
        return
    }


    const params = new URLSearchParams(location.href)
    const nav = document.querySelector('.gl-tabs-nav')

    const createTabItem = (ref) => {
        const li = document.createElement('li')
        li.classList.add('nav-item', 'injected-nav-item')

        const a = document.createElement('a')
        a.classList.add(...'nav-link js-pipelines-tab-tags gl-display-inline-flex gl-tab-nav-item'.split(' '))
        if (params.get('ref') === ref) {
            a.classList.add('gl-tab-nav-item-active')
            a.setAttribute('href', `?page=1`)
        } else {
            a.setAttribute('href', `?page=1&ref=${ref}`)
        }
        a.innerText = ref

        li.appendChild(a)
        nav.appendChild(li)
    }

    ['develop', 'master', 'release'].forEach(ref => {
        createTabItem(ref)
    })
}






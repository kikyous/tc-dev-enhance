// ==UserScript==
// @name        TC dev enhance
// @namespace   Violentmonkey Scripts
// @match       http://localhost:5000/*
// @match       https://lms-stg.tronclass.com.cn/*
// @match       https://lms-qa.tronclass.com.cn/*
// @match       https://lms-product.tronclass.com.cn/*
// @grant       none
// @noframes
// @version     2.0
// @author      chen
// @description 2023/9/19 17:48:17
// ==/UserScript==



const logout = () => {
    return fetch("/api/logout", {
        headers: { "content-type": "application/json;charset=UTF-8" },
        method: "POST",
    }).catch(() => true);
};

const login = (username, password, orgId = '', credentials = 'same-origin') => {
    const data = {
        user_name: username,
        password: password,
        remember: true,
    };
    if (orgId) {
        data.org_id = orgId;
    }
    return fetch("/api/login", {
        headers: { "content-type": "application/json;charset=UTF-8" },
        credentials: credentials,
        body: JSON.stringify(data),
        method: "POST",
    }).then(async function (response) {
        if (!response.ok) {
            throw (await response.json());
        }
        return response.json();
    });
};




const style = `
*, *:before, *:after {
    box-sizing: border-box;
}
:host input[type="text"] {
    color: red;
    border: 1px solid #cbcbcb;
    border-radius: 4px;
    outline: none;
    background: rgba(0,0,0,0);
    padding: 1px 4px;
    width: 100%;
}

label {
    display: block;
}

.orgs-wrapper {
    background: white;
    border: 1px solid #cbcbcb;
    padding: 5px;
    border-radius: 2px;
}

.info {
    background: white;
    border-radius: 2px;
    padding: 3px;
    font-size: 13px;
}

:host(.error) input, :host(.error) input:focus {
  border: red solid 2px !important;
}

.slide-in-top {
	animation: slide-in-top 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

@keyframes slide-in-top {
  0% {
    -webkit-transform: translateY(-1000px);
            transform: translateY(-1000px);
    opacity: 0;
  }
  100% {
    -webkit-transform: translateY(0);
            transform: translateY(0);
    opacity: 1;
  }
}
`;


customElements.define('enhance-input', class extends HTMLElement {
    constructor() {
        super();
        const value = window.globalData?.user?.userNo || window.statisticsSettings?.user?.userNo || ''

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <style>${style}</style>
            <form>
                <input name='user_name' autocomplete="on" onfocus="this.select()" value="${value}" type=text />
            </form>
            <div class='orgs'></div>
        `;

        const form = shadowRoot.querySelector("form");
        const input = shadowRoot.querySelector("input");

        form.addEventListener("submit", (event) => {
            event.preventDefault()
            this.submit(input.value)
        })
    }

    showInfo(message) {
        this.shadowRoot.querySelector('.info')?.remove();
        const div = document.createElement("div");
        div.classList.add('info', 'slide-in-top')
        this.shadowRoot.appendChild(div);
        div.innerText = message
        setTimeout(() => {
            div.remove()
        }, 5000);
    }

    selectOrgIfNeeded(result) {
        const form = this.shadowRoot.querySelector('form');
        this.shadowRoot.querySelector('.orgs-wrapper')?.remove()

        return new Promise((resolve) => {
            const orgs = result['orgs']
            if (orgs) {
                const orgsHtml = orgs.map((org) => {
                    return `<label><input type="radio" name="org" value="${org.id}"> ${org.name}</label>`
                }).join('')
                form.insertAdjacentHTML('beforeend', `<div class="orgs-wrapper slide-in-top">${orgsHtml}</div>`)
                form.querySelectorAll('.orgs-wrapper input[type="radio"]').forEach((radio) => {
                    radio.addEventListener('change', (event) => {
                        resolve({ org_id: event.target.value })
                    })
                })
            } else {
                resolve(result)
            }
        })
    }

    submit(value) {
        if (!value) {
            return
        }

        let [username, password] = value.split(' ')
        if (!password) {
            password = localStorage.getItem('__pswd') || 'password'
        }
        const logoutAndLogin = (result) => {
            return logout()
                .then(() => login(username, password, result['org_id']))
                .then(() => {
                    window.location.reload();
                })
        }

        this.shadowRoot.querySelector('.orgs-wrapper')?.remove()
        this.classList.remove('error');

        const testLogin = () => {
            return login(username, password, '', 'omit').then((result) => {
                localStorage.setItem('__pswd', password);
                return result
            }).catch((result) => {
                const errors = result.errors || {};
                this.showInfo(errors['user_name']?.at(0) || errors['password']?.at(0));
                throw new Error('login failed');
            })
        }

        // test account then logout
        testLogin().then(this.selectOrgIfNeeded.bind(this)).then(logoutAndLogin).catch(() => {
            this.classList.add("error");
        })
    }
});

const inject = (node) => {
    node.insertAdjacentHTML(
        "afterbegin",
        `<enhance-input style='width: 120px; position: fixed; top: 0; right: 0; z-index: 9999;'></enhance-input>`
    );
};

inject(document.body);

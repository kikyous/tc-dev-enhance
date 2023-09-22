// ==UserScript==
// @name        TC dev enhance
// @namespace   Violentmonkey Scripts
// @match       http://localhost:5000/*
// @match       https://lms-stg.tronclass.com.cn/*
// @match       https://lms-qa.tronclass.com.cn/*
// @match       https://lms-product.tronclass.com.cn/*
// @grant       none
// @noframes
// @version     1.7
// @author      chen
// @description 2023/9/19 17:48:17
// ==/UserScript==



const logout = () => {
    return fetch("/api/logout", {
        headers: { "content-type": "application/json;charset=UTF-8" },
        method: "POST",
    }).catch(() => true);
};

const login = (username, password, credentials = 'same-origin') => {
    const data = {
        user_name: username,
        password: password,
        remember: true,
    };
    return fetch("/api/login", {
        headers: { "content-type": "application/json;charset=UTF-8" },
        credentials: credentials,
        body: JSON.stringify(data),
        method: "POST",
    }).then(function (response) {
        console.log(response);
        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }
        return response.json();
    });
};


const style = `
*, *:before, *:after {
    box-sizing: border-box;
}
:host input {
    color: red;
    border: 1px solid #cbcbcb;
    border-radius: 4px;
    outline: none;
    background: rgba(0,0,0,0);
    padding: 1px 4px;
    width: 100%;
}

:host(.error) input, :host(.error) input:focus {
  border: red solid 2px !important;
}
`;


customElements.define('enhance-input', class extends HTMLElement {
    constructor() {
        super();
        const value = window.globalData?.user?.userNo || window.statisticsSettings?.user?.userNo || ''

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <style>${style}</style>
            <input name='user_name' autocomplete="on" onfocus="this.select()" value="${value}" type=text />
        `;

        const input = shadowRoot.querySelector("input");

        input.addEventListener("change", () => {
            this.inputChanged(input.value)
        })
    }

    inputChanged(value) {
        if (!value) {
            return
        }

        let [username, password] = value.split(' ')
        if (password) {
            localStorage.setItem('__pswd', password);
        } else {
            password = localStorage.getItem('__pswd') || 'password'
        }
        const logoutAndLogin = () => {
            logout()
                .then(() => login(username, password))
                .then(() => {
                    window.location.reload();
                })
        }

        // test account then logout
        login(username, password, 'omit').then(logoutAndLogin).catch(() => {
            this.classList.add("error");
        })
    }
});

const inject = (node) => {
    node.insertAdjacentHTML(
        "afterbegin",
        `<enhance-input style='width: 100px; position: fixed; top: 0; right: 0; z-index: 9999;'></enhance-input>`
    );
};

inject(document.body);

// ==UserScript==
// @name        TC dev enhance
// @namespace   Violentmonkey Scripts
// @match       http://localhost:5000/*
// @match       https://lms-stg.tronclass.com.cn/*
// @match       https://lms-qa.tronclass.com.cn/*
// @grant       none
// @version     1.5
// @author      chen
// @description 2023/9/19 17:48:17
// ==/UserScript==

const style = `
._inject_root {
    display: inline-flex !important;
    align-items: center;
    width: 100px;
    position: fixed;
    top: 0;
    right: 0;
    z-index: 9999;
}

._inject_root.error input, input:focus {
  border: red solid 2px;
}
._inject_root input {
    background: rgba(0,0,0,0);
    color: red;
    height: 25px !important;
}
._inject_root input:focus {
    background-color: rgba(0,0,0,0) !important;
}
`;

const logout = () => {
    return fetch("/api/logout", {
        headers: { "content-type": "application/json;charset=UTF-8" },
        method: "POST",
    }).catch(() => true);
};

const login = (username, password) => {
    const data = {
        user_name: username,
        password: password,
        remember: true,
    };
    return fetch("/api/login", {
        headers: { "content-type": "application/json;charset=UTF-8" },
        body: JSON.stringify(data),
        method: "POST",
    }).then(function (response) {
        console.log(response.status); // Will show you the status
        if (!response.ok) {
            throw new Error(`HTTP status ${response.status}`);
        }
        return response.json();
    });
};

window._onInputchange = (value) => {
    if (!value) {
        return
    }


    let [username, password] = value.split(' ')
    localStorage.setItem('__username', username)
    if (password) {
        localStorage.setItem('__pswd', password);
    } else {
        password = localStorage.getItem('__pswd') || 'password'
    }
    logout()
        .then(() => login(username, password))
        .then(() => {
            window.location.reload();
        })
        .catch(() => {
            document.querySelector("._inject_root").classList.add("error");
        })
};

const inject = (node) => {
    document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`);
    const value = localStorage.getItem('__username') || ''

    node.insertAdjacentHTML(
        "afterbegin",
        `<div class="_inject_root"><input onchange="_onInputchange(this.value)" onfocus="this.select()" value="${value}" type=text /></div>`
    );
};

inject(document.body);

import { API_URL, ROOT_URL } from "./api.js";

/**
 * @param {*이미 요청한 api 캐시용 map} cache = new Map();
 */
 var cache = new Map(); //전역변수 선언

export const request = async (url) => {
    try {
        return await fetch(url).then((res) => {
        if (res.ok) return res.json();
        }).then((json) => json);
    } catch (error) {
        console.log(error);
    }
}

export const renderNodes = async (modal, breadCrumb, id) => {
    modal.setModal("./assets/nyan-cat.gif", 'Modal Loading'); //로딩 모달 띄우기!
    const result = await request(id === 'root' ? ROOT_URL : `${API_URL}${id}`);
    modal.setModal("", 'hidden'); //로딩 모달 닫기
    const states = { nodes: result, depth: breadCrumb.state };
    return states;
}

export const checkChache = (id) => {
    if(cache.has(id)) {
        return cache.get(id);
    } else {
        return false;
    }
}

export const addCache = (id, data) => {
    cache.set(id, data);
}




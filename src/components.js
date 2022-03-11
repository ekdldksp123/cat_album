import { IMAGE_BASE_URL, URL } from "./utils/api.js";
import { addCache, checkChache, renderNodes } from "./utils/common.js";
/**
 * @param {*뒤로가기 용 스텍} stack = { dirctory:[], nodes:[]}
 */
const stack = [];
/**
 * @param {*앨범 element} app 
 * @param {*현재 디렉토리 구조 ['dir1 name', 'dir1 child name', '...']} initialState 
 */
export function Breadcrumb(app, initialState) {
    this.state = [...initialState];

    this.target = document.createElement('nav');
    this.target.className = 'Breadcrumb';
    app.appendChild(this.target);

    this.setState = (nextState) => {
        this.state = [...this.state, nextState];
        this.render();
    }

    this.historyBack = (prevState) => {
        this.state = [...prevState];
        this.render();
    }

    this.render = () => {
        this.target.innerHTML = `${
            this.state.map((node, index) => 
                `<div class='nav-item' data-index=${index}>${index > 0 ? `<span> - <span>${node}` : node}</div>`).join('')
        }`
    }
    this.render();
}
/**
 * 
 * @param {*앨범 element} app 
 * @param {*디렉토리 표시 헤더 element} breadCrumb 
 * @param {*로딩/이미지 팝업용 element} modal 
 * @param {*depth:[], nodes:node[] = {id, name,type, filePath, parent={id}}} initialState 
 * @param {*현재까지 histor: []} stack 
 */
export function Nodes(app, breadCrumb, modal, initialState) {
    this.state = { ...initialState };
    
    this.target = document.createElement('div');
    this.target.className = 'Nodes';
    app.appendChild(this.target);

    this.modal = modal;

    this.setState = (nextState) => {
        this.state = { ...nextState };
        this.render();
    }

    this.prevBtn = document.createElement('div');
    this.prevBtn.className = 'Node';

    this.renderPrevBtn = () => {
        this.target.innerHTML = ''; //clear nodes
        
        // depth : breadCrumb 에 표시된 현재 디렉토리 => 이게 root 만 아니면 prev 버튼 표시한다
        if (this.state.depth[this.state.depth.length - 1] !== 'root') { 
            this.prevBtn.innerHTML = `<img class="back" src="./assets/prev.png"/>`;
            this.target.appendChild(this.prevBtn);
        }
    }

    this.render = () => {
        this.renderPrevBtn();
        this.target.innerHTML += `${this.state.nodes.map((node, index) => {
            return `<div class="Node" data-path=${node.filePath ? node.filePath : '#'} data-id=${node.id}>
                    <img src=${node.type === 'DIRECTORY' ? `${URL}/assets/directory.png` : `${URL}/assets/file.png`}>
                <div>${node.name}</div></div>`;
            }).join('')
        }`
    }

    this.historyBack = () => {
        const historyBack = stack.pop();
        this.setState({...historyBack});
        breadCrumb.historyBack([...historyBack.depth]);
    }

    this.render();

    this.target.addEventListener('click', async (e) => {
        const filePath = e.target.parentNode.dataset.path;
        
        if (filePath === '#') { // 디렉토리 -> breadcrumb 에도 이름이 추가되어야 함!
            stack.push({...this.state}); //뒤로가기 위해 지금 이상태 stack에 push 해주고
            
            const id = e.target.parentNode.dataset.id;
            const directoryName = e.target.parentNode.lastChild.innerText;
            breadCrumb.setState(directoryName); //breadCrumb state 에 디렉토리 이름 추가 해주고

            this.target.innerHTML = ''; //clear nodes

            let states = null;
            const cache = checkChache(id);
            
            if(!cache) { //cache 가 없으면
                states = await renderNodes(this.modal, breadCrumb, id);
                addCache(id, states);
                this.setState(states);
            } else {
                states = cache; //있으면 api 요청 안하고 바로 가져다 쓰기><
                this.setState(states);
            }

        } else if(filePath){ // 파일일 경우 이미지 모달을 띄운다(+ filePath가 undefined도 아니고)
            
            const imageUrl = `${IMAGE_BASE_URL}${filePath}`;
            const modalClassName = 'Modal ImageViewer';
            this.modal.setModal(imageUrl, modalClassName);
        } else if(e.target.className === 'back'){ //prev 버튼을 눌렀을 경우에는 (img 태그에 class 로 접근하기!)
            this.historyBack();
        }
    });
}

/**
 * 
 * @param {*이미지 경로} url 
 */
export function Modal(url = '') { 
    this.url = url;
    this.target = document.createElement('div');
    this.target.className = 'hidden';
    document.body.appendChild(this.target);

    this.setModal = (url, className) => { //컴포넌트 그때마다 생성하지 않게 set 메서드 하나 두고~
        this.url = url;
        this.className = className;
        this.render();
    }

    this.setCloseEventListener = () => {
        //img tag 바깥 영역을 클릭할시 모달 close
        document.addEventListener('click', e => {
            if(e.target.className === 'Modal ImageViewer') {
                this.setModal('', 'hidden');
            }
        });
    }

    this.render = () => {
        this.target.className = this.className;
        this.target.innerHTML = `<div class="content"><img src=${this.url}></div>`;
        this.setCloseEventListener(); //modal 렌더링 한 후 document에 click event 등록
    }

    this.render();
}

/**
 * 사진첩 
 */
export function App() {
    this.app = null;
    this.breadCrumb = null;
    this.modal = null;
    this.states = null;
    this.nodes = null;

    this.render = async () => {
        this.app = document.querySelector('#App');
        this.breadCrumb = new Breadcrumb(this.app, ['root']);
        this.modal = new Modal();
        this.states = await renderNodes(this.modal, this.breadCrumb, 'root');
        this.nodes = new Nodes(this.app, this.breadCrumb, this.modal, this.states);
    }
}
// ==UserScript==
// @name         HTTP Request Tool
// @namespace    https://github.com/heikeson/http-request-tool
// @version      1.5
// @description  HTTP request tool with URL auto-detection, cookie management and beautiful UI
// @author       heikeson
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_openInTab
// ==/UserScript==


(function() {
    'use strict';
  
    const style = `
        #http-request-float-window {
            position: fixed;
            top: 50px;
            right: 50px;
            width: 520px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            transition: all 0.3s ease;
        }

        #http-request-header {
            padding: 12px 16px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
            color: #333;
        }

        #http-request-controls {
            display: flex;
            gap: 8px;
        }

        .http-request-btn {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        #http-request-minimize { background-color: #ffbd44; }
        #http-request-close { background-color: #ff605c; }

        #http-request-minimize:hover { background-color: #e5a73d; }
        #http-request-close:hover { background-color: #e55652; }

        #http-request-content {
            padding: 16px;
            max-height: 70vh;
            overflow-y: auto;
        }

        .http-request-hidden {
            display: none !important;
        }

        .http-request-section {
            margin-bottom: 16px;
        }

        .http-request-section-header {
            font-weight: 500;
            margin-bottom: 8px;
            color: #555;
            display: flex;
            align-items: center;
            cursor: pointer;
        }

        .http-request-section-header:hover {
            color: #333;
        }

        .http-request-section-content {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 4px;
        }

        .http-request-toggle-icon {
            margin-right: 8px;
            transition: transform 0.2s ease;
        }

        .http-request-section.collapsed .http-request-toggle-icon {
            transform: rotate(-90deg);
        }

        .http-request-section.collapsed .http-request-section-content {
            display: none;
        }

        #http-request-form {
            display: grid;
            gap: 12px;
        }

        #http-request-url {
            width: 100%;
            padding: 8px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
            font-size: 14px;
            transition: border-color 0.2s ease;
        }

        #http-request-url:focus {
            outline: none;
            border-color: #4a90e2;
        }

        #http-request-methods {
            display: flex;
            gap: 8px;
        }

        .http-request-method-btn {
            padding: 6px 12px;
            background: #f0f0f0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
        }

        .http-request-method-btn.active {
            background: #4a90e2;
            color: white;
        }

        .http-request-method-btn:hover:not(.active) {
            background: #e0e0e0;
        }

        .http-request-key-value-pair {
            display: grid;
            grid-template-columns: 1fr 3fr auto;
            gap: 8px;
            margin-bottom: 8px;
        }

        .http-request-key-value-pair input {
            padding: 6px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
        }

        .http-request-add-btn {
            padding: 6px 12px;
            background: #50e3c2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
        }

        .http-request-add-btn:hover {
            background: #40c9ab;
        }

        .http-request-remove-btn {
            padding: 6px 10px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        .http-request-remove-btn:hover {
            background: #e55c5c;
        }

        #http-request-body-section {
            display: none;
        }

        #http-request-body-editor {
            display: grid;
            gap: 10px;
        }

        .http-request-json-row {
            display: grid;
            grid-template-columns: 1fr 3fr 1fr auto;
            gap: 8px;
            margin-bottom: 8px;
        }

        .http-request-json-type {
            padding: 6px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
        }

        .http-request-json-value input,
        .http-request-json-value textarea {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
            box-sizing: border-box;
        }

        .http-request-json-value textarea {
            height: 60px;
            resize: vertical;
            font-family: monospace;
        }

        #http-request-json-mode-toggle {
            margin-top: 8px;
            text-align: right;
        }

        #http-request-json-mode-toggle button {
            padding: 4px 8px;
            background: #f0f0f0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }

        #http-request-json-mode-toggle button:hover {
            background: #e0e0e0;
        }

        #http-request-send {
            padding: 10px 16px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.2s ease;
            margin-top: 8px;
        }

        #http-request-send:hover {
            background: #3a78c2;
        }

        #http-request-result {
            margin-top: 16px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 4px;
            min-height: 100px;
        }

        #http-request-result-header {
            font-weight: 500;
            margin-bottom: 8px;
            color: #555;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #http-request-status-code {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
            margin-right: 8px;
        }

        .status-success { background-color: #e8f5e9; color: #2e7d32; }
        .status-redirect { background-color: #e8eaf6; color: #1a237e; }
        .status-client-error { background-color: #fff3e0; color: #f57c00; }
        .status-server-error { background-color: #ffebee; color: #b71c1c; }

        #http-request-result-body {
            background: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #eee;
            min-height: 60px;
            font-family: monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 14px;
            overflow-x: auto;
        }

        #http-request-toggle-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 16px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 9999;
            transition: all 0.2s ease;
        }

        #http-request-toggle-btn:hover {
            background: #3a78c2;
        }

        .http-request-result-actions {
            display: flex;
            gap: 8px;
        }

        .http-request-result-btn {
            padding: 4px 8px;
            background: #f0f0f0;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
        }

        .http-request-result-btn:hover {
            background: #e0e0e0;
        }

        .http-request-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 16px;
            background: #333;
            color: white;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .http-request-toast.show {
            opacity: 1;
        }
    `;
    GM_addStyle(style);

    const state = {
        url: window.location.href,
        method: 'GET',
        headers: [
            { key: 'Content-Type', value: 'application/json' }
        ],
        cookies: [],
        body: '{}',
        isMinimized: false,
        isOpen: false,
        useJsonForm: true,
        sections: {
            'form': false,
            'headers': false,
            'cookies': true,
            'body': false,
            'result': false
        }
    };

    function initDefaultCookies() {
        const storedCookies = GM_getValue('http-request-tool-cookies', []);
        if (storedCookies.length > 0) {
            state.cookies = storedCookies;
        } else {
            const documentCookies = document.cookie.split('; ');
            state.cookies = documentCookies.map(cookie => {
                const [key, value] = cookie.split('=');
                return { key, value };
            }).filter(c => c.key && c.value);
        }
    }

    function createFloatWindow() {
        const floatWindow = document.createElement('div');
        floatWindow.id = 'http-request-float-window';

        const header = document.createElement('div');
        header.id = 'http-request-header';

        const title = document.createElement('div');
        title.textContent = 'HTTP Request Tool';

        const controls = document.createElement('div');
        controls.id = 'http-request-controls';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.id = 'http-request-minimize';
        minimizeBtn.addEventListener('click', toggleWindow);

        const closeBtn = document.createElement('button');
        closeBtn.id = 'http-request-close';
        closeBtn.addEventListener('click', closeWindow);

        controls.appendChild(minimizeBtn);
        controls.appendChild(closeBtn);

        header.appendChild(title);
        header.appendChild(controls);

        const content = document.createElement('div');
        content.id = 'http-request-content';

        const formSection = document.createElement('div');
        formSection.className = 'http-request-section';

        const formHeader = document.createElement('div');
        formHeader.className = 'http-request-section-header';
        formHeader.innerHTML = '<i class="fa fa-paper-plane http-request-toggle-icon"></i>Request';
        formHeader.addEventListener('click', () => toggleSection('form'));

        const formContent = document.createElement('div');
        formContent.className = 'http-request-section-content';

        const form = document.createElement('div');
        form.id = 'http-request-form';

        const urlInput = document.createElement('input');
        urlInput.id = 'http-request-url';
        urlInput.type = 'text';
        urlInput.value = state.url;

        const methodsDiv = document.createElement('div');
        methodsDiv.id = 'http-request-methods';

        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
            const btn = document.createElement('button');
            btn.className = `http-request-method-btn ${method === state.method ? 'active' : ''}`;
            btn.textContent = method;
            btn.dataset.method = method;
            btn.addEventListener('click', () => selectMethod(method));
            methodsDiv.appendChild(btn);
        });

        const bodySection = document.createElement('div');
        bodySection.id = 'http-request-body-section';

        const bodyHeader = document.createElement('div');
        bodyHeader.className = 'http-request-section-header';
        bodyHeader.innerHTML = '<i class="fa fa-code http-request-toggle-icon"></i>Request Body (JSON)';
        bodyHeader.addEventListener('click', () => toggleSection('body'));

        const bodyContent = document.createElement('div');
        bodyContent.className = 'http-request-section-content';

        const bodyEditor = document.createElement('div');
        bodyEditor.id = 'http-request-body-editor';

        const jsonForm = document.createElement('div');
        jsonForm.id = 'http-request-json-form';

        try {
            const jsonData = JSON.parse(state.body);
            Object.keys(jsonData).forEach(key => {
                const value = jsonData[key];
                const type = typeof value;
                addJsonRow(jsonForm, key, value, type);
            });
        } catch (e) {
            addJsonRow(jsonForm, 'key', 'value', 'string');
        }

        const addJsonBtn = document.createElement('button');
        addJsonBtn.className = 'http-request-add-btn';
        addJsonBtn.innerHTML = '<i class="fa fa-plus"></i> Add Field';
        addJsonBtn.addEventListener('click', () => addJsonRow(jsonForm, '', '', 'string'));

        const jsonModeToggle = document.createElement('div');
        jsonModeToggle.id = 'http-request-json-mode-toggle';

        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Switch to Raw JSON';
        toggleBtn.addEventListener('click', toggleJsonMode);

        jsonModeToggle.appendChild(toggleBtn);

        const rawJsonTextarea = document.createElement('textarea');
        rawJsonTextarea.id = 'http-request-body';
        rawJsonTextarea.value = state.body;
        rawJsonTextarea.className = 'http-request-hidden';

        bodyEditor.appendChild(jsonForm);
        bodyEditor.appendChild(addJsonBtn);
        bodyEditor.appendChild(jsonModeToggle);
        bodyEditor.appendChild(rawJsonTextarea);

        bodyContent.appendChild(bodyEditor);
        bodySection.appendChild(bodyHeader);
        bodySection.appendChild(bodyContent);

        const sendBtn = document.createElement('button');
        sendBtn.id = 'http-request-send';
        sendBtn.textContent = 'Send Request';
        sendBtn.addEventListener('click', sendRequest);

        form.appendChild(urlInput);
        form.appendChild(methodsDiv);
        form.appendChild(bodySection);
        form.appendChild(sendBtn);

        formContent.appendChild(form);
        formSection.appendChild(formHeader);
        formSection.appendChild(formContent);

        const headersSection = createKeyValueSection('Headers', 'http-request-headers', state.headers, 'headers');

        const cookiesSection = createKeyValueSection('Cookies', 'http-request-cookies', state.cookies, 'cookies');

        const resultSection = document.createElement('div');
        resultSection.className = 'http-request-section';

        const resultHeader = document.createElement('div');
        resultHeader.className = 'http-request-section-header';
        resultHeader.innerHTML = '<i class="fa fa-reply http-request-toggle-icon"></i>Response';
        resultHeader.addEventListener('click', () => toggleSection('result'));

        const resultContent = document.createElement('div');
        resultContent.className = 'http-request-section-content';

        const resultContainer = document.createElement('div');
        resultContainer.id = 'http-request-result';

        const resultStatus = document.createElement('div');
        resultStatus.id = 'http-request-result-header';
        resultStatus.innerHTML = `
            <span id="http-request-status-code"></span>
            <span id="http-request-status-text"></span>
            <div class="http-request-result-actions">
                <button id="http-request-copy-btn" class="http-request-result-btn">
                    <i class="fa fa-copy"></i> Copy
                </button>
                <button id="http-request-open-html-btn" class="http-request-result-btn http-request-hidden">
                    <i class="fa fa-external-link"></i> Open HTML
                </button>
            </div>
        `;

        const resultBody = document.createElement('div');
        resultBody.id = 'http-request-result-body';
        resultBody.textContent = 'Ready to send request...';

        document.addEventListener('click', function(e) {
            if (e.target.id === 'http-request-copy-btn') {
                copyResponseToClipboard();
            } else if (e.target.id === 'http-request-open-html-btn') {
                openHtmlResponse();
            }
        });

        resultContainer.appendChild(resultStatus);
        resultContainer.appendChild(resultBody);
        resultContent.appendChild(resultContainer);

        resultSection.appendChild(resultHeader);
        resultSection.appendChild(resultContent);

        content.appendChild(formSection);
        content.appendChild(headersSection);
        content.appendChild(cookiesSection);
        content.appendChild(resultSection);

        floatWindow.appendChild(header);
        floatWindow.appendChild(content);

        document.body.appendChild(floatWindow);

        makeDraggable(floatWindow, header);

        addToastNotification();

        updateUI();

        return floatWindow;
    }

    function addToastNotification() {
        const toast = document.createElement('div');
        toast.id = 'http-request-toast';
        toast.className = 'http-request-toast';
        document.body.appendChild(toast);
    }

    function showToast(message, duration = 2000) {
        const toast = document.getElementById('http-request-toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    function createKeyValueSection(title, id, items, sectionKey) {
        const section = document.createElement('div');
        section.className = `http-request-section ${state.sections[sectionKey] ? 'collapsed' : ''}`;
        section.dataset.section = sectionKey;

        const header = document.createElement('div');
        header.className = 'http-request-section-header';
        header.innerHTML = `<i class="fa fa-chevron-right http-request-toggle-icon"></i>${title}`;
        header.addEventListener('click', () => toggleSection(sectionKey));

        const content = document.createElement('div');
        content.className = 'http-request-section-content';

        const container = document.createElement('div');
        container.id = id;

        items.forEach((item, index) => {
            addKeyValueRow(container, item.key, item.value, index);
        });

        const addBtn = document.createElement('button');
        addBtn.className = 'http-request-add-btn';
        addBtn.innerHTML = '<i class="fa fa-plus"></i> Add';
        addBtn.addEventListener('click', () => addKeyValueRow(container, '', '', null));

        content.appendChild(container);
        content.appendChild(addBtn);

        section.appendChild(header);
        section.appendChild(content);

        return section;
    }

    function addKeyValueRow(container, key, value, index = null) {
        const row = document.createElement('div');
        row.className = 'http-request-key-value-pair';

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Key';
        keyInput.value = key;

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = 'Value';
        valueInput.value = value;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'http-request-remove-btn';
        removeBtn.innerHTML = '<i class="fa fa-times"></i>';
        removeBtn.addEventListener('click', () => row.remove());

        row.appendChild(keyInput);
        row.appendChild(valueInput);
        row.appendChild(removeBtn);

        if (index !== null && container.children.length > index) {
            container.insertBefore(row, container.children[index]);
        } else {
            container.appendChild(row);
        }
    }

    function addJsonRow(container, key, value, type) {
        const row = document.createElement('div');
        row.className = 'http-request-json-row';

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Key';
        keyInput.value = key;

        const typeSelect = document.createElement('select');
        typeSelect.className = 'http-request-json-type';

        ['string', 'number', 'boolean', 'object', 'array', 'null'].forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            option.textContent = t;
            option.selected = t === type;
            typeSelect.appendChild(option);
        });

        const valueContainer = document.createElement('div');
        valueContainer.className = 'http-request-json-value';

        let valueInput;
        if (type === 'string') {
            valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.value = value;
        } else if (type === 'object' || type === 'array') {
            valueInput = document.createElement('textarea');
            try {
                valueInput.value = JSON.stringify(value, null, 2);
            } catch (e) {
                valueInput.value = value;
            }
        } else {
            valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.value = value;
        }

        valueInput.placeholder = 'Value';
        valueContainer.appendChild(valueInput);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'http-request-remove-btn';
        removeBtn.innerHTML = '<i class="fa fa-times"></i>';
        removeBtn.addEventListener('click', () => row.remove());

        row.appendChild(keyInput);
        row.appendChild(typeSelect);
        row.appendChild(valueContainer);
        row.appendChild(removeBtn);

        typeSelect.addEventListener('change', () => {
            const newType = typeSelect.value;
            valueContainer.innerHTML = '';

            let newValueInput;
            if (newType === 'string') {
                newValueInput = document.createElement('input');
                newValueInput.type = 'text';
            } else if (newType === 'object' || newType === 'array') {
                newValueInput = document.createElement('textarea');
            } else {
                newValueInput = document.createElement('input');
                newValueInput.type = 'text';
            }

            newValueInput.placeholder = 'Value';
            valueContainer.appendChild(newValueInput);
        });

        container.appendChild(row);
    }

    function selectMethod(method) {
        state.method = method;

        document.querySelectorAll('.http-request-method-btn').forEach(btn => {
            if (btn.dataset.method === method) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const bodySection = document.getElementById('http-request-body-section');
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            bodySection.style.display = 'block';
        } else {
            bodySection.style.display = 'none';
        }
    }

    function toggleJsonMode() {
        state.useJsonForm = !state.useJsonForm;

        const jsonForm = document.getElementById('http-request-json-form');
        const rawJson = document.getElementById('http-request-body');
        const toggleBtn = document.querySelector('#http-request-json-mode-toggle button');

        if (state.useJsonForm) {
            try {
                const jsonData = JSON.parse(rawJson.value);
                jsonForm.innerHTML = '';
                Object.keys(jsonData).forEach(key => {
                    const value = jsonData[key];
                    const type = typeof value;
                    addJsonRow(jsonForm, key, value, type);
                });
            } catch (e) {
                alert('Invalid JSON format');
                state.useJsonForm = true;
                return;
            }

            jsonForm.classList.remove('http-request-hidden');
            rawJson.classList.add('http-request-hidden');
            toggleBtn.textContent = 'Switch to Raw JSON';
        } else {
            const jsonData = collectJsonData();
            rawJson.value = JSON.stringify(jsonData, null, 2);

            jsonForm.classList.add('http-request-hidden');
            rawJson.classList.remove('http-request-hidden');
            toggleBtn.textContent = 'Switch to Form';
        }
    }

    function collectJsonData() {
        const jsonData = {};
        const rows = document.querySelectorAll('#http-request-json-form .http-request-json-row');

        rows.forEach(row => {
            const key = row.querySelector('input[type="text"]').value;
            if (!key) return;

            const type = row.querySelector('.http-request-json-type').value;
            const valueElement = row.querySelector('.http-request-json-value input, .http-request-json-value textarea');
            let value = valueElement.value;

            switch (type) {
                case 'number':
                    value = parseFloat(value);
                    break;
                case 'boolean':
                    value = value.toLowerCase() === 'true';
                    break;
                case 'object':
                case 'array':
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        value = {};
                    }
                    break;
                case 'null':
                    value = null;
                    break;
            }

            jsonData[key] = value;
        });

        return jsonData;
    }

    function updateUI() {
        document.getElementById('http-request-url').value = state.url;

        selectMethod(state.method);

        Object.keys(state.sections).forEach(section => {
            const sectionElement = document.querySelector(`.http-request-section[data-section="${section}"]`);
            if (sectionElement) {
                if (state.sections[section]) {
                    sectionElement.classList.add('collapsed');
                } else {
                    sectionElement.classList.remove('collapsed');
                }
            }
        });
    }

    function toggleSection(sectionKey) {
        state.sections[sectionKey] = !state.sections[sectionKey];
        updateUI();
    }

    function collectFormData() {
        const formData = {
            url: document.getElementById('http-request-url').value,
            method: state.method,
            headers: [],
            cookies: [],
            body: ''
        };

        const headerRows = document.querySelectorAll('#http-request-headers .http-request-key-value-pair');
        headerRows.forEach(row => {
            const key = row.querySelector('input:first-child').value;
            const value = row.querySelector('input:nth-child(2)').value;
            if (key) {
                formData.headers.push({ key, value });
            }
        });

        const cookieRows = document.querySelectorAll('#http-request-cookies .http-request-key-value-pair');
        const cookies = [];
        cookieRows.forEach(row => {
            const key = row.querySelector('input:first-child').value;
            const value = row.querySelector('input:nth-child(2)').value;
            if (key) {
                cookies.push({ key, value });
            }
        });
        formData.cookies = cookies;

        GM_setValue('http-request-tool-cookies', cookies);

        if (formData.method === 'POST' || formData.method === 'PUT' || formData.method === 'PATCH') {
            if (state.useJsonForm) {
                formData.body = JSON.stringify(collectJsonData(), null, 2);
            } else {
                formData.body = document.getElementById('http-request-body').value;
            }
        }

        return formData;
    }

    function sendRequest() {
        const data = collectFormData();

        const resultHeader = document.getElementById('http-request-result-header');
        const resultBody = document.getElementById('http-request-result-body');
        const statusCodeEl = document.getElementById('http-request-status-code');
        const statusTextEl = document.getElementById('http-request-status-text');
        const openHtmlBtn = document.getElementById('http-request-open-html-btn');

        resultHeader.style.display = 'block';
        statusCodeEl.textContent = '';
        statusTextEl.textContent = 'Sending request...';
        resultBody.textContent = '';
        openHtmlBtn.classList.add('http-request-hidden');

        const headers = {};
        data.headers.forEach(header => {
            headers[header.key] = header.value;
        });

        const cookieString = data.cookies.map(c => `${c.key}=${c.value}`).join('; ');
        if (cookieString) {
            headers['Cookie'] = cookieString;
        }

        try {
            GM_xmlhttpRequest({
                method: data.method,
                url: data.url,
                headers: headers,
                data: data.body,
                onload: function(response) {
                    const statusCode = response.status;
                    statusCodeEl.textContent = statusCode;

                    if (statusCode >= 200 && statusCode < 300) {
                        statusCodeEl.className = 'status-success';
                    } else if (statusCode >= 300 && statusCode < 400) {
                        statusCodeEl.className = 'status-redirect';
                    } else if (statusCode >= 400 && statusCode < 500) {
                        statusCodeEl.className = 'status-client-error';
                    } else {
                        statusCodeEl.className = 'status-server-error';
                    }

                    statusTextEl.textContent = response.statusText;

                    try {
                        const jsonData = JSON.parse(response.responseText);
                        resultBody.textContent = JSON.stringify(jsonData, null, 2);
                    } catch (e) {
                        resultBody.textContent = response.responseText;

                        if (response.responseText.trim().startsWith('<!DOCTYPE html>') ||
                            response.responseText.trim().startsWith('<html')) {
                            openHtmlBtn.classList.remove('http-request-hidden');
                        } else {
                            openHtmlBtn.classList.add('http-request-hidden');
                        }
                    }

                    window.httpRequestResponse = response.responseText;
                },
                onerror: function(error) {
                    statusCodeEl.textContent = 'Error';
                    statusCodeEl.className = 'status-server-error';
                    statusTextEl.textContent = '';
                    resultBody.textContent = `Request failed: ${error}`;
                    openHtmlBtn.classList.add('http-request-hidden');
                },
                ontimeout: function() {
                    statusCodeEl.textContent = 'Timeout';
                    statusCodeEl.className = 'status-server-error';
                    statusTextEl.textContent = '';
                    resultBody.textContent = 'The request timed out.';
                    openHtmlBtn.classList.add('http-request-hidden');
                }
            });
        } catch (error) {
            statusCodeEl.textContent = 'Exception';
            statusCodeEl.className = 'status-server-error';
            statusTextEl.textContent = '';
            resultBody.textContent = error.message;
            openHtmlBtn.classList.add('http-request-hidden');
        }
    }

    function copyResponseToClipboard() {
        const resultBody = document.getElementById('http-request-result-body');
        const textToCopy = resultBody.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Response copied to clipboard!');
        }).catch(err => {
            showToast('Failed to copy response: ' + err.message);
        });
    }

    function openHtmlResponse() {
        if (!window.httpRequestResponse) {
            showToast('No HTML response to open');
            return;
        }

        const newTab = window.open('about:blank', '_blank');
        if (newTab) {
            newTab.document.write(window.httpRequestResponse);
            newTab.document.close();
        } else {
            showToast('Failed to open new tab. Please allow popups for this site.');
        }
    }

    function toggleWindow() {
        const content = document.getElementById('http-request-content');
        const minimizeBtn = document.getElementById('http-request-minimize');

        state.isMinimized = !state.isMinimized;

        if (state.isMinimized) {
            content.classList.add('http-request-hidden');
            minimizeBtn.innerHTML = '<i class="fa fa-plus"></i>';
        } else {
            content.classList.remove('http-request-hidden');
            minimizeBtn.innerHTML = '';
        }
    }

    function closeWindow() {
        const floatWindow = document.getElementById('http-request-float-window');
        floatWindow.remove();
        state.isOpen = false;

        createToggleButton();
    }

    function createToggleButton() {
        const button = document.createElement('button');
        button.id = 'http-request-toggle-btn';
        button.textContent = 'HTTP Request Tool';
        button.addEventListener('click', () => {
            button.remove();
            createFloatWindow();
            state.isOpen = true;
        });

        document.body.appendChild(button);
    }

    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let isDragging = false;

        handle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            isDragging = true;

            element.style.transition = 'none';
            element.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            if (!isDragging) return;

            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;

            const maxTop = window.innerHeight - element.offsetHeight;
            const maxLeft = window.innerWidth - element.offsetWidth;

            element.style.top = Math.max(0, Math.min(maxTop, newTop)) + "px";
            element.style.left = Math.max(0, Math.min(maxLeft, newLeft)) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            isDragging = false;
            element.style.transition = 'all 0.3s ease';
            element.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }
    }

    initDefaultCookies();
    createToggleButton();
})();

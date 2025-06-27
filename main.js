// ==UserScript==
// @name         HTTP Request Tool(HRT)
// @namespace    https://github.com/heikeson/http-request-tool
// @version      2.5
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

    class HRTool {
        constructor() {
            this.state = {
                url: window.location.href,
                method: 'GET',
                headers: [{ key: 'Content-Type', value: 'application/json' }],
                cookies: [],
                body: '{}',
                useJsonForm: true,
                sections: {
                    form: false,
                    headers: false,
                    cookies: true,
                    result: false,
                    history: false
                },
                history: [],
                historyLimit: GM_getValue('historyLimit', 20),
                currentHistoryId: null,
                isFullScreen: false
            };

            this.elements = {
                floatWindow: null,
                toggleBtn: null,
                toast: null,
                fullScreenBtn: null
            };

            this.dragState = {
                isDragging: false,
                element: null,
                initialX: 0,
                initialY: 0,
                initialTop: 0,
                initialLeft: 0,
                isFullScreen: false
            };

            this.init();
        }

        init() {
            this.loadSettings();
            this.createToggleButton();
            this.addGlobalEventListeners();
        }
        loadSettings() {
            this.state.cookies = GM_getValue('cookies', []);
            this.state.history = GM_getValue('history', []);
            this.state.historyLimit = GM_getValue('historyLimit', 20);

            this.trimHistory();
        }

        saveSettings() {
            GM_setValue('cookies', this.state.cookies);
            GM_setValue('history', this.state.history);
            GM_setValue('historyLimit', this.state.historyLimit);
        }

        createToggleButton() {
            const btn = document.createElement('button');
            btn.id = 'hrt-toggle-btn';
            btn.innerHTML = '<i class="fa fa-bars"></i> HRT';
            btn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 48px;
                height: 48px;
                background: #4a90e2;
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                font-size: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                transition: all 0.2s ease;
            `;

            btn.addEventListener('click', () => {
                btn.remove();
                this.createFloatWindow();
            });

            document.body.appendChild(btn);
            this.elements.toggleBtn = btn;
            this.setupDraggableElement(btn);
        }

        createFloatWindow() {
            const floatWindow = document.createElement('div');
            floatWindow.id = 'hrt-float-window';
            floatWindow.style.cssText = `
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
            `;

            const header = this.createHeader();
            const content = document.createElement('div');
            content.id = 'hrt-content';
            content.style.padding = '16px';
            content.style.maxHeight = '70vh';
            content.style.overflowY = 'auto';

            content.appendChild(this.createFormSection());
            content.appendChild(this.createHeadersSection());
            content.appendChild(this.createCookiesSection());
            content.appendChild(this.createResultSection());
            content.appendChild(this.createHistorySection());

            floatWindow.appendChild(header);
            floatWindow.appendChild(content);
            document.body.appendChild(floatWindow);

            this.elements.floatWindow = floatWindow;
            this.setupDraggableElement(floatWindow, header);
        }

        createHeader() {
            const header = document.createElement('div');
            header.style.cssText = `
                padding: 12px 16px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 500;
                color: #333;
            `;

            const title = document.createElement('div');
            title.textContent = 'HTTP Request Tool (HRT)';

            const fullScreenBtn = document.createElement('button');
            fullScreenBtn.id = 'hrt-fullscreen-btn';
            fullScreenBtn.innerHTML = '<i class="fa fa-expand"></i>';
            fullScreenBtn.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                background: #4a90e2;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                margin-right: 8px;
            `;

            fullScreenBtn.addEventListener('click', () => this.toggleFullScreen());

            const closeBtn = document.createElement('button');
            closeBtn.id = 'hrt-close-btn';
            closeBtn.innerHTML = '<i class="fa fa-times"></i>';
            closeBtn.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                background: #ff605c;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            `;

            closeBtn.addEventListener('click', () => {
                this.elements.floatWindow.remove();
                this.createToggleButton();
            });

            header.appendChild(title);
            header.appendChild(fullScreenBtn);
            header.appendChild(closeBtn);
            this.elements.fullScreenBtn = fullScreenBtn;
            return header;
        }

        toggleFullScreen() {
            this.state.isFullScreen = !this.state.isFullScreen;
            const floatWindow = this.elements.floatWindow;

            if (this.state.isFullScreen) {
                this.state.lastPosition = {
                    top: floatWindow.style.top,
                    right: floatWindow.style.right,
                    bottom: floatWindow.style.bottom,
                    left: floatWindow.style.left,
                    width: floatWindow.style.width,
                    height: floatWindow.style.height
                };

                floatWindow.style.top = '0';
                floatWindow.style.right = '0';
                floatWindow.style.bottom = '0';
                floatWindow.style.left = '0';
                floatWindow.style.width = 'auto';
                floatWindow.style.height = 'auto';
                floatWindow.style.borderRadius = '0';
                this.elements.fullScreenBtn.innerHTML = '<i class="fa fa-compress"></i>';
            } else {
                floatWindow.style.top = this.state.lastPosition.top || '50px';
                floatWindow.style.right = this.state.lastPosition.right || '50px';
                floatWindow.style.bottom = this.state.lastPosition.bottom || 'auto';
                floatWindow.style.left = this.state.lastPosition.left || 'auto';
                floatWindow.style.width = this.state.lastPosition.width || '520px';
                floatWindow.style.height = this.state.lastPosition.height || 'auto';
                floatWindow.style.borderRadius = '8px';
                this.elements.fullScreenBtn.innerHTML = '<i class="fa fa-expand"></i>';
            }
        }

        createFormSection() {
            const section = document.createElement('div');
            section.className = 'hrt-section';
            section.dataset.section = 'form';

            const header = document.createElement('div');
            header.className = 'hrt-section-header';
            header.innerHTML = '<i class="fa fa-paper-plane hrt-toggle-icon"></i>Request';
            header.style.cssText = `
                font-weight: 500;
                margin-bottom: 8px;
                color: #555;
                display: flex;
                align-items: center;
                cursor: pointer;
            `;

            header.addEventListener('click', () => {
                this.state.sections.form = !this.state.sections.form;
                this.updateSectionVisibility('form', section);
            });

            const content = document.createElement('div');
            content.className = 'hrt-section-content';
            content.style.cssText = `
                background: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                display: ${this.state.sections.form ? 'none' : 'block'};
            `;

            const form = document.createElement('div');
            form.id = 'hrt-form';
            form.style.display = 'grid';
            form.style.gap = '12px';

            const urlInput = document.createElement('input');
            urlInput.id = 'hrt-url';
            urlInput.type = 'text';
            urlInput.value = this.state.url;
            urlInput.placeholder = 'https://api.example.com';
            urlInput.style.cssText = `
                width: 100%;
                padding: 8px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
                font-size: 14px;
                transition: border-color 0.2s ease;
            `;

            const methodsDiv = document.createElement('div');
            methodsDiv.id = 'hrt-methods';
            methodsDiv.style.display = 'flex';
            methodsDiv.style.gap = '8px';

            ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
                const btn = document.createElement('button');
                btn.className = `hrt-method-btn ${method === this.state.method ? 'active' : ''}`;
                btn.textContent = method;
                btn.dataset.method = method;
                btn.style.cssText = `
                    padding: 6px 12px;
                    background: #f0f0f0;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.2s ease;
                `;

                btn.addEventListener('click', () => {
                    document.querySelectorAll('.hrt-method-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.state.method = method;

                    const bodySection = document.getElementById('hrt-body-section');
                    bodySection.style.display = method === 'POST' || method === 'PUT' || method === 'PATCH' ? 'block' : 'none';
                });

                methodsDiv.appendChild(btn);
            });

            const bodySection = document.createElement('div');
            bodySection.id = 'hrt-body-section';
            bodySection.style.cssText = `
                margin-bottom: 12px;
                display: ${this.state.method === 'POST' || this.state.method === 'PUT' || this.state.method === 'PATCH' ? 'block' : 'none'};
            `;

            const bodyHeader = document.createElement('div');
            bodyHeader.className = 'hrt-section-header';
            bodyHeader.innerHTML = '<i class="fa fa-code hrt-toggle-icon"></i>Request Body (JSON)';
            bodyHeader.style.marginBottom = '8px';

            const bodyContent = document.createElement('div');
            bodyContent.style.cssText = `
                background: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
            `;

            const bodyEditor = document.createElement('div');
            bodyEditor.id = 'hrt-body-editor';
            bodyEditor.style.display = 'grid';
            bodyEditor.style.gap = '10px';

            const jsonForm = document.createElement('div');
            jsonForm.id = 'hrt-json-form';

            try {
                const jsonData = JSON.parse(this.state.body);
                Object.keys(jsonData).forEach(key => {
                    const value = jsonData[key];
                    const type = typeof value;
                    this.addJsonRow(jsonForm, key, value, type);
                });
            } catch (e) {
                this.addJsonRow(jsonForm, 'key', 'value', 'string');
            }

            const addJsonBtn = document.createElement('button');
            addJsonBtn.id = 'hrt-add-json-btn';
            addJsonBtn.innerHTML = '<i class="fa fa-plus"></i> Add Field';
            addJsonBtn.style.cssText = `
                padding: 6px 12px;
                background: #50e3c2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
            `;

            addJsonBtn.addEventListener('click', () => this.addJsonRow(jsonForm, '', '', 'string'));

            const jsonModeToggle = document.createElement('div');
            jsonModeToggle.id = 'hrt-json-mode-toggle';
            jsonModeToggle.style.cssText = `
                margin-top: 8px;
                text-align: right;
            `;

            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = 'Switch to Raw JSON';
            toggleBtn.style.cssText = `
                padding: 4px 8px;
                background: #f0f0f0;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            `;

            toggleBtn.addEventListener('click', () => {
                this.state.useJsonForm = !this.state.useJsonForm;
                const jsonForm = document.getElementById('hrt-json-form');
                const rawJson = document.getElementById('hrt-raw-json');

                if (this.state.useJsonForm) {
                    try {
                        const jsonData = this.collectJsonData();
                        rawJson.value = JSON.stringify(jsonData, null, 2);
                    } catch (e) {
                        alert('Invalid JSON format');
                        return;
                    }

                    jsonForm.classList.add('hrt-hidden');
                    rawJson.classList.remove('hrt-hidden');
                    toggleBtn.textContent = 'Switch to Form';
                } else {
                    try {
                        const jsonData = JSON.parse(rawJson.value);
                        jsonForm.innerHTML = '';
                        Object.keys(jsonData).forEach(key => {
                            const value = jsonData[key];
                            const type = typeof value;
                            this.addJsonRow(jsonForm, key, value, type);
                        });
                    } catch (e) {
                        alert('Invalid JSON format');
                        this.state.useJsonForm = true;
                        return;
                    }

                    jsonForm.classList.remove('hrt-hidden');
                    rawJson.classList.add('hrt-hidden');
                    toggleBtn.textContent = 'Switch to Raw JSON';
                }
            });

            jsonModeToggle.appendChild(toggleBtn);

            const rawJson = document.createElement('textarea');
            rawJson.id = 'hrt-raw-json';
            rawJson.value = this.state.body;
            rawJson.style.cssText = `
                width: 100%;
                height: 120px;
                padding: 8px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
                font-family: monospace;
                font-size: 14px;
                resize: vertical;
                ${this.state.useJsonForm ? 'display: none;' : ''}
            `;

            bodyEditor.appendChild(jsonForm);
            bodyEditor.appendChild(addJsonBtn);
            bodyEditor.appendChild(jsonModeToggle);
            bodyEditor.appendChild(rawJson);

            bodyContent.appendChild(bodyEditor);
            bodySection.appendChild(bodyHeader);
            bodySection.appendChild(bodyContent);

            const sendBtn = document.createElement('button');
            sendBtn.id = 'hrt-send-btn';
            sendBtn.textContent = 'Send Request';
            sendBtn.style.cssText = `
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
            `;

            sendBtn.addEventListener('click', () => this.sendRequest());

            form.appendChild(urlInput);
            form.appendChild(methodsDiv);
            form.appendChild(bodySection);
            form.appendChild(sendBtn);

            content.appendChild(form);
            section.appendChild(header);
            section.appendChild(content);
            return section;
        }

        addJsonRow(container, key, value, type) {
            const row = document.createElement('div');
            row.className = 'hrt-json-row';
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr 3fr 1fr auto';
            row.style.gap = '8px';
            row.style.marginBottom = '8px';

            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.placeholder = 'Key';
            keyInput.value = key;
            keyInput.style.cssText = `
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
            `;

            const typeSelect = document.createElement('select');
            typeSelect.className = 'hrt-json-type';
            typeSelect.style.cssText = `
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
            `;

            ['string', 'number', 'boolean', 'object', 'array', 'null'].forEach(t => {
                const option = document.createElement('option');
                option.value = t;
                option.textContent = t;
                option.selected = t === type;
                typeSelect.appendChild(option);
            });

            const valueContainer = document.createElement('div');
            valueContainer.className = 'hrt-json-value';

            let valueInput;
            if (type === 'string' || type === 'number') {
                valueInput = document.createElement('input');
                valueInput.type = 'text';
                valueInput.value = value;
            } else if (type === 'boolean') {
                valueInput = document.createElement('select');
                valueInput.innerHTML = `
                    <option value="true" ${value === true ? 'selected' : ''}>true</option>
                    <option value="false" ${value === false ? 'selected' : ''}>false</option>
                `;
            } else if (type === 'object' || type === 'array') {
                valueInput = document.createElement('textarea');
                try {
                    valueInput.value = JSON.stringify(value, null, 2);
                } catch (e) {
                    valueInput.value = value;
                }
                valueInput.style.height = '60px';
            } else if (type === 'null') {
                valueInput = document.createElement('select');
                valueInput.innerHTML = '<option value="null" selected>null</option>';
            }

            valueInput.style.cssText = `
                width: 100%;
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
                box-sizing: border-box;
                ${type === 'object' || type === 'array' ? 'font-family: monospace;' : ''}
            `;

            valueContainer.appendChild(valueInput);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'hrt-remove-btn';
            removeBtn.innerHTML = '<i class="fa fa-times"></i>';
            removeBtn.style.cssText = `
                padding: 6px 10px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            `;

            removeBtn.addEventListener('click', () => row.remove());

            row.appendChild(keyInput);
            row.appendChild(typeSelect);
            row.appendChild(valueContainer);
            row.appendChild(removeBtn);
            container.appendChild(row);

            typeSelect.addEventListener('change', () => {
                const newType = typeSelect.value;
                valueContainer.innerHTML = '';

                let newValueInput;
                if (newType === 'string' || newType === 'number') {
                    newValueInput = document.createElement('input');
                    newValueInput.type = 'text';
                } else if (newType === 'boolean') {
                    newValueInput = document.createElement('select');
                    newValueInput.innerHTML = `
                        <option value="true">true</option>
                        <option value="false">false</option>
                    `;
                } else if (newType === 'object' || newType === 'array') {
                    newValueInput = document.createElement('textarea');
                    newValueInput.style.height = '60px';
                } else if (newType === 'null') {
                    newValueInput = document.createElement('select');
                    newValueInput.innerHTML = '<option value="null" selected>null</option>';
                }

                newValueInput.style.cssText = `
                    width: 100%;
                    padding: 6px 8px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 13px;
                    box-sizing: border-box;
                    ${newType === 'object' || newType === 'array' ? 'font-family: monospace;' : ''}
                `;

                valueContainer.appendChild(newValueInput);
            });
        }

        createHeadersSection() {
            const section = document.createElement('div');
            section.className = 'hrt-section';
            section.dataset.section = 'headers';

            const header = document.createElement('div');
            header.className = 'hrt-section-header';
            header.innerHTML = '<i class="fa fa-header hrt-toggle-icon"></i>Headers';
            header.style.cssText = `
                font-weight: 500;
                margin-bottom: 8px;
                color: #555;
                display: flex;
                align-items: center;
                cursor: pointer;
            `;

            header.addEventListener('click', () => {
                this.state.sections.headers = !this.state.sections.headers;
                this.updateSectionVisibility('headers', section);
            });

            const content = document.createElement('div');
            content.className = 'hrt-section-content';
            content.style.cssText = `
                background: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                display: ${this.state.sections.headers ? 'none' : 'block'};
            `;

            const container = document.createElement('div');
            container.id = 'hrt-headers-container';

            this.state.headers.forEach((header, index) => {
                this.addKeyValueRow(container, header.key, header.value, index);
            });

            const addBtn = document.createElement('button');
            addBtn.id = 'hrt-add-header-btn';
            addBtn.innerHTML = '<i class="fa fa-plus"></i> Add';
            addBtn.style.cssText = `
                padding: 6px 12px;
                background: #50e3c2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
            `;

            addBtn.addEventListener('click', () => this.addKeyValueRow(container, '', ''));

            content.appendChild(container);
            content.appendChild(addBtn);
            section.appendChild(header);
            section.appendChild(content);
            return section;
        }

        createCookiesSection() {
            const section = document.createElement('div');
            section.className = 'hrt-section';
            section.dataset.section = 'cookies';

            const header = document.createElement('div');
            header.className = 'hrt-section-header';
            header.innerHTML = '<i class="fa fa-cookie hrt-toggle-icon"></i>Cookies';
            header.style.cssText = `
                font-weight: 500;
                margin-bottom: 8px;
                color: #555;
                display: flex;
                align-items: center;
                cursor: pointer;
            `;

            header.addEventListener('click', () => {
                this.state.sections.cookies = !this.state.sections.cookies;
                this.updateSectionVisibility('cookies', section);
            });

            const content = document.createElement('div');
            content.className = 'hrt-section-content';
            content.style.cssText = `
                background: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                display: ${this.state.sections.cookies ? 'none' : 'block'};
            `;

            const container = document.createElement('div');
            container.id = 'hrt-cookies-container';

            this.state.cookies.forEach((cookie, index) => {
                this.addKeyValueRow(container, cookie.key, cookie.value, index);
            });

            const loadCookiesBtn = document.createElement('button');
            loadCookiesBtn.id = 'hrt-load-cookies-btn';
            loadCookiesBtn.innerHTML = '<i class="fa fa-refresh"></i> Load Current Site Cookies';
            loadCookiesBtn.style.cssText = `
                padding: 6px 12px;
                background: #4a90e2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            `;

            loadCookiesBtn.addEventListener('click', () => this.loadCurrentSiteCookies());

            const addBtn = document.createElement('button');
            addBtn.id = 'hrt-add-cookie-btn';
            addBtn.innerHTML = '<i class="fa fa-plus"></i> Add';
            addBtn.style.cssText = `
                padding: 6px 12px;
                background: #50e3c2;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s ease;
            `;

            addBtn.addEventListener('click', () => this.addKeyValueRow(container, '', ''));

            content.appendChild(loadCookiesBtn);
            content.appendChild(container);
            content.appendChild(addBtn);
            section.appendChild(header);
            section.appendChild(content);
            return section;
        }

        loadCurrentSiteCookies() {
            const container = document.getElementById('hrt-cookies-container');
            container.innerHTML = '';

            const cookies = document.cookie.split('; ');
            cookies.forEach(cookie => {
                if (cookie) {
                    const [key, value] = cookie.split('=');
                    if (key) {
                        this.addKeyValueRow(container, key, value || '');
                    }
                }
            });

            this.state.cookies = [];
            const cookieRows = document.querySelectorAll('#hrt-cookies-container .hrt-key-value-pair');
            cookieRows.forEach(row => {
                const key = row.querySelector('input:first-child').value;
                const value = row.querySelector('input:nth-child(2)').value;
                if (key) {
                    this.state.cookies.push({ key, value });
                }
            });

            this.saveSettings();
            this.showToast('Current site cookies loaded');
        }

        createResultSection() {
            const section = document.createElement('div');
            section.className = 'hrt-section';
            section.dataset.section = 'result';

            const header = document.createElement('div');
            header.className = 'hrt-section-header';
            header.innerHTML = '<i class="fa fa-reply hrt-toggle-icon"></i>Response';
            header.style.cssText = `
                font-weight: 500;
                margin-bottom: 8px;
                color: #555;
                display: flex;
                align-items: center;
                cursor: pointer;
            `;

            header.addEventListener('click', () => {
                this.state.sections.result = !this.state.sections.result;
                this.updateSectionVisibility('result', section);
            });

            const content = document.createElement('div');
            content.className = 'hrt-section-content';
            content.style.cssText = `
                background: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                display: ${this.state.sections.result ? 'none' : 'block'};
            `;

            const resultContainer = document.createElement('div');
            resultContainer.id = 'hrt-result-container';
            resultContainer.style.cssText = `
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
            `;

            const resultHeader = document.createElement('div');
            resultHeader.style.cssText = `
                font-weight: 500;
                margin-bottom: 8px;
                color: #555;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const statusCode = document.createElement('span');
            statusCode.id = 'hrt-status-code';
            statusCode.style.cssText = `
                display: inline-block;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: 500;
                margin-right: 8px;
            `;

            const statusText = document.createElement('span');
            statusText.id = 'hrt-status-text';
            statusText.textContent = 'Ready to send request...';

            const actions = document.createElement('div');
            actions.className = 'hrt-result-actions';
            actions.style.display = 'flex';
            actions.style.gap = '8px';

            const copyBtn = document.createElement('button');
            copyBtn.id = 'hrt-copy-btn';
            copyBtn.innerHTML = '<i class="fa fa-copy"></i> Copy';
            copyBtn.style.cssText = `
                padding: 4px 8px;
                background: #f0f0f0;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            `;

            const openBtn = document.createElement('button');
            openBtn.id = 'hrt-open-btn';
            openBtn.innerHTML = '<i class="fa fa-external-link"></i> Open in New Tab';
            openBtn.style.cssText = `
                padding: 4px 8px;
                background: #f0f0f0;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            `;

            actions.appendChild(copyBtn);
            actions.appendChild(openBtn);

            resultHeader.appendChild(statusCode);
            resultHeader.appendChild(statusText);
            resultHeader.appendChild(actions);

            const resultBody = document.createElement('div');
            resultBody.id = 'hrt-result-body';
            resultBody.textContent = 'Ready to send request...';

            resultContainer.appendChild(resultHeader);
            resultContainer.appendChild(resultBody);

            copyBtn.addEventListener('click', () => this.copyResponseToClipboard(resultBody.textContent));
            openBtn.addEventListener('click', () => this.openResponseInNewTab(resultBody.textContent));

            content.appendChild(resultContainer);
            section.appendChild(header);
            section.appendChild(content);
            return section;
        }

        createHistorySection() {
            const section = document.createElement('div');
            section.className = 'hrt-section';
            section.dataset.section = 'history';

            const header = document.createElement('div');
            header.className = 'hrt-section-header';
            header.innerHTML = '<i class="fa fa-history hrt-toggle-icon"></i>History';
            header.style.cssText = `
                font-weight: 500;
                margin-bottom: 8px;
                color: #555;
                display: flex;
                align-items: center;
                cursor: pointer;
            `;

            header.addEventListener('click', () => {
                this.state.sections.history = !this.state.sections.history;
                this.updateSectionVisibility('history', section);
            });

            const content = document.createElement('div');
            content.className = 'hrt-section-content';
            content.style.cssText = `
                background: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                display: ${this.state.sections.history ? 'none' : 'block'};
            `;

            const controls = document.createElement('div');
            controls.id = 'hrt-history-controls';
            controls.style.display = 'flex';
            controls.style.justifyContent = 'space-between';
            controls.style.alignItems = 'center';
            controls.style.marginBottom = '8px';

            const limitLabel = document.createElement('label');
            limitLabel.textContent = 'Max history items: ';

            const limitInput = document.createElement('input');
            limitInput.id = 'hrt-history-limit';
            limitInput.type = 'number';
            limitInput.min = '1';
            limitInput.max = '100';
            limitInput.value = this.state.historyLimit;
            limitInput.style.cssText = `
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 12px;
            `;

            limitInput.addEventListener('change', (e) => {
                const limit = parseInt(e.target.value);
                if (!isNaN(limit) && limit >= 1 && limit <= 100) {
                    this.state.historyLimit = limit;
                    this.trimHistory(); 
                    this.saveSettings();
                    this.renderHistory(content);
                }
            });

            const clearHistoryBtn = document.createElement('button');
            clearHistoryBtn.id = 'hrt-clear-history-btn';
            clearHistoryBtn.innerHTML = '<i class="fa fa-trash"></i> Clear History';
            clearHistoryBtn.style.cssText = `
                padding: 4px 12px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            `;

            clearHistoryBtn.addEventListener('click', () => this.clearHistory());

            controls.appendChild(limitLabel);
            controls.appendChild(limitInput);
            controls.appendChild(clearHistoryBtn);

            const historyList = document.createElement('div');
            historyList.id = 'hrt-history-list';
            historyList.style.cssText = `
                max-height: 200px;
                overflow-y: auto;
                margin-top: 8px;
                border: 1px solid #eee;
                border-radius: 4px;
            `;

            this.renderHistory(historyList);

            content.appendChild(controls);
            content.appendChild(historyList);
            section.appendChild(header);
            section.appendChild(content);
            return section;
        }

        clearHistory() {
            if (this.state.history.length === 0) {
                this.showToast('History is already empty');
                return;
            }

            this.state.history = [];
            this.state.currentHistoryId = null;
            this.saveSettings();
            this.renderHistory(document.getElementById('hrt-history-list'));
            this.showToast('History cleared successfully');
        }

        trimHistory() {
            if (this.state.history.length <= this.state.historyLimit) return;

            this.state.history.sort((a, b) => a.timestamp - b.timestamp);
            this.state.history = this.state.history.slice(-this.state.historyLimit);
            this.saveSettings();
        }

        renderHistory(container) {
            container.innerHTML = '';

            if (this.state.history.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'hrt-history-item';
                emptyItem.textContent = 'No history yet';
                container.appendChild(emptyItem);
                return;
            }

            this.state.history.slice().reverse().forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = `hrt-history-item ${item.id === this.state.currentHistoryId ? 'active' : ''}`;
                historyItem.dataset.id = item.id;
                historyItem.style.cssText = `
                    padding: 8px 12px;
                    border-bottom: 1px solid #eee;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;

                historyItem.addEventListener('click', () => this.loadHistoryItem(item.id));

                const urlElement = document.createElement('div');
                urlElement.className = 'hrt-history-url';
                urlElement.style.fontWeight = '500';
                urlElement.style.marginBottom = '4px';
                urlElement.textContent = `${item.method} ${item.url}`;

                const detailsElement = document.createElement('div');
                detailsElement.className = 'hrt-history-details';
                detailsElement.style.fontSize = '12px';
                detailsElement.style.color = '#666';
                detailsElement.style.display = 'flex';
                detailsElement.style.gap = '12px';

                const statusElement = document.createElement('span');
                statusElement.className = 'hrt-history-status';
                statusElement.style.padding = '1px 4px';
                statusElement.style.borderRadius = '2px';
                statusElement.style.fontSize = '11px';
                statusElement.textContent = item.status;

                const timeElement = document.createElement('span');
                timeElement.textContent = new Date(item.timestamp).toLocaleString();

                if (item.status >= 200 && item.status < 300) {
                    statusElement.className = 'hrt-history-status status-success';
                    statusElement.style.backgroundColor = '#e8f5e9';
                    statusElement.style.color = '#2e7d32';
                } else if (item.status >= 300 && item.status < 400) {
                    statusElement.className = 'hrt-history-status status-redirect';
                    statusElement.style.backgroundColor = '#e8eaf6';
                    statusElement.style.color = '#1a237e';
                } else if (item.status >= 400 && item.status < 500) {
                    statusElement.className = 'hrt-history-status status-client-error';
                    statusElement.style.backgroundColor = '#fff3e0';
                    statusElement.style.color = '#f57c00';
                } else {
                    statusElement.className = 'hrt-history-status status-server-error';
                    statusElement.style.backgroundColor = '#ffebee';
                    statusElement.style.color = '#b71c1c';
                }

                detailsElement.appendChild(statusElement);
                detailsElement.appendChild(timeElement);

                historyItem.appendChild(urlElement);
                historyItem.appendChild(detailsElement);
                container.appendChild(historyItem);
            });
        }

        loadHistoryItem(id) {
            const item = this.state.history.find(h => h.id === id);
            if (!item) return;

            this.state.currentHistoryId = id;
            this.renderHistory(document.getElementById('hrt-history-list'));

            document.getElementById('hrt-url').value = item.url;

            document.querySelectorAll('.hrt-method-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.method === item.method) {
                    btn.classList.add('active');
                }
            });
            this.state.method = item.method;

            const bodySection = document.getElementById('hrt-body-section');
            bodySection.style.display = item.method === 'POST' || item.method === 'PUT' || item.method === 'PATCH' ? 'block' : 'none';

            const headersContainer = document.getElementById('hrt-headers-container');
            headersContainer.innerHTML = '';
            item.request.headers.forEach(header => {
                this.addKeyValueRow(headersContainer, header.key, header.value);
            });

            const cookiesContainer = document.getElementById('hrt-cookies-container');
            cookiesContainer.innerHTML = '';
            item.request.cookies.forEach(cookie => {
                this.addKeyValueRow(cookiesContainer, cookie.key, cookie.value);
            });

            if (item.method === 'POST' || item.method === 'PUT' || item.method === 'PATCH') {
                bodySection.style.display = 'block';

                try {
                    const jsonData = JSON.parse(item.request.body);
                    const jsonForm = document.getElementById('hrt-json-form');
                    jsonForm.innerHTML = '';
                    Object.keys(jsonData).forEach(key => {
                        const value = jsonData[key];
                        const type = typeof value;
                        this.addJsonRow(jsonForm, key, value, type);
                    });
                    this.state.useJsonForm = true;
                    document.getElementById('hrt-raw-json').classList.add('hrt-hidden');
                    document.getElementById('hrt-json-mode-toggle').querySelector('button').textContent = 'Switch to Raw JSON';
                } catch (e) {
                    document.getElementById('hrt-raw-json').value = item.request.body;
                    this.state.useJsonForm = false;
                    document.getElementById('hrt-json-form').classList.add('hrt-hidden');
                    document.getElementById('hrt-json-mode-toggle').querySelector('button').textContent = 'Switch to Form';
                }
            } else {
                bodySection.style.display = 'none';
            }

            const statusCode = document.getElementById('hrt-status-code');
            const statusText = document.getElementById('hrt-status-text');
            const resultBody = document.getElementById('hrt-result-body');

            statusCode.textContent = item.status;
            statusText.textContent = item.statusText;

            if (item.status >= 200 && item.status < 300) {
                statusCode.className = 'status-success';
                statusCode.style.backgroundColor = '#e8f5e9';
                statusCode.style.color = '#2e7d32';
            } else if (item.status >= 300 && item.status < 400) {
                statusCode.className = 'status-redirect';
                statusCode.style.backgroundColor = '#e8eaf6';
                statusCode.style.color = '#1a237e';
            } else if (item.status >= 400 && item.status < 500) {
                statusCode.className = 'status-client-error';
                statusCode.style.backgroundColor = '#fff3e0';
                statusCode.style.color = '#f57c00';
            } else {
                statusCode.className = 'status-server-error';
                statusCode.style.backgroundColor = '#ffebee';
                statusCode.style.color = '#b71c1c';
            }

            try {
                const jsonData = JSON.parse(item.response.body);
                resultBody.textContent = JSON.stringify(jsonData, null, 2);
            } catch (e) {
                resultBody.textContent = item.response.body;
            }

            window.httpRequestResponse = item.response.body;

            this.state.sections.result = false;
            this.updateSectionVisibility('result', document.querySelector('[data-section="result"]'));
        }

        addKeyValueRow(container, key, value, index = null) {
            const row = document.createElement('div');
            row.className = 'hrt-key-value-pair';
            row.style.display = 'grid';
            row.style.gridTemplateColumns = '1fr 3fr auto';
            row.style.gap = '8px';
            row.style.marginBottom = '8px';

            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.placeholder = 'Key';
            keyInput.value = key;
            keyInput.style.cssText = `
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
            `;

            const valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.placeholder = 'Value';
            valueInput.value = value;
            valueInput.style.cssText = `
                padding: 6px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-size: 13px;
            `;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'hrt-remove-btn';
            removeBtn.innerHTML = '<i class="fa fa-times"></i>';
            removeBtn.style.cssText = `
                padding: 6px 10px;
                background: #ff6b6b;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            `;

            removeBtn.addEventListener('click', () => row.remove());

            row.appendChild(keyInput);
            row.appendChild(valueInput);
            row.appendChild(removeBtn);
            container.appendChild(row);

            return row;
        }

        collectJsonData() {
            const result = {};
            const rows = document.querySelectorAll('#hrt-json-form .hrt-json-row');

            rows.forEach(row => {
                const key = row.querySelector('input[type="text"]').value;
                if (!key) return;

                const type = row.querySelector('.hrt-json-type').value;
                const valueContainer = row.querySelector('.hrt-json-value');
                const valueInput = valueContainer.querySelector('input, select, textarea');
                let value;

                switch (type) {
                    case 'string':
                        value = valueInput.value;
                        break;
                    case 'number':
                        value = parseFloat(valueInput.value);
                        if (isNaN(value)) value = 0;
                        break;
                    case 'boolean':
                        value = valueInput.value === 'true';
                        break;
                    case 'object':
                        try {
                            value = JSON.parse(valueInput.value || '{}');
                        } catch (e) {
                            value = {};
                        }
                        break;
                    case 'array':
                        try {
                            value = JSON.parse(valueInput.value || '[]');
                        } catch (e) {
                            value = [];
                        }
                        break;
                    case 'null':
                        value = null;
                        break;
                }

                result[key] = value;
            });

            return result;
        }

        sendRequest() {
            const url = document.getElementById('hrt-url').value;
            if (!url) {
                this.showToast('URL is required');
                return;
            }

            this.state.url = url;

            const headers = [];
            const headerRows = document.querySelectorAll('#hrt-headers-container .hrt-key-value-pair');
            headerRows.forEach(row => {
                const key = row.querySelector('input:first-child').value;
                const value = row.querySelector('input:nth-child(2)').value;
                if (key) {
                    headers.push({ key, value });
                }
            });
            this.state.headers = headers;

            const cookies = [];
            const cookieRows = document.querySelectorAll('#hrt-cookies-container .hrt-key-value-pair');
            cookieRows.forEach(row => {
                const key = row.querySelector('input:first-child').value;
                const value = row.querySelector('input:nth-child(2)').value;
                if (key) {
                    cookies.push({ key, value });
                }
            });
            this.state.cookies = cookies;

            let body = '';
            if (this.state.method === 'POST' || this.state.method === 'PUT' || this.state.method === 'PATCH') {
                if (this.state.useJsonForm) {
                    try {
                        body = JSON.stringify(this.collectJsonData());
                    } catch (e) {
                        this.showToast('Invalid JSON format');
                        return;
                    }
                } else {
                    body = document.getElementById('hrt-raw-json').value;
                    try {
                        JSON.parse(body); 
                    } catch (e) {

                    }
                }
            }

            this.state.body = body;

            const requestConfig = {
                method: this.state.method,
                url: url,
                headers: headers.reduce((obj, header) => {
                    obj[header.key] = header.value;
                    return obj;
                }, {}),
                data: body,
                onload: (response) => {
                    this.handleResponse(response);
                },
                onerror: (error) => {
                    this.handleResponse(error);
                },
                ontimeout: (error) => {
                    this.handleResponse(error);
                }
            };

            if (cookies.length > 0) {
                requestConfig.headers['Cookie'] = cookies.map(c => `${c.key}=${c.value}`).join('; ');
            }

            const statusCode = document.getElementById('hrt-status-code');
            const statusText = document.getElementById('hrt-status-text');
            const resultBody = document.getElementById('hrt-result-body');

            statusCode.textContent = '...';
            statusCode.className = '';
            statusCode.style.backgroundColor = '#f0f0f0';
            statusCode.style.color = '#555';
            statusText.textContent = 'Sending request...';
            resultBody.textContent = 'Waiting for response...';

            this.state.sections.result = false;
            this.updateSectionVisibility('result', document.querySelector('[data-section="result"]'));

            GM_xmlhttpRequest(requestConfig);
        }

        handleResponse(response) {
            const statusCode = document.getElementById('hrt-status-code');
            const statusText = document.getElementById('hrt-status-text');
            const resultBody = document.getElementById('hrt-result-body');

            statusCode.textContent = response.status;
            statusText.textContent = response.statusText || (response.error ? response.error : 'Unknown error');

            if (response.status >= 200 && response.status < 300) {
                statusCode.className = 'status-success';
                statusCode.style.backgroundColor = '#e8f5e9';
                statusCode.style.color = '#2e7d32';
            } else if (response.status >= 300 && response.status < 400) {
                statusCode.className = 'status-redirect';
                statusCode.style.backgroundColor = '#e8eaf6';
                statusCode.style.color = '#1a237e';
            } else if (response.status >= 400 && response.status < 500) {
                statusCode.className = 'status-client-error';
                statusCode.style.backgroundColor = '#fff3e0';
                statusCode.style.color = '#f57c00';
            } else {
                statusCode.className = 'status-server-error';
                statusCode.style.backgroundColor = '#ffebee';
                statusCode.style.color = '#b71c1c';
            }

            try {
                const jsonData = JSON.parse(response.responseText);
                resultBody.textContent = JSON.stringify(jsonData, null, 2);
            } catch (e) {
                resultBody.textContent = response.responseText || 'No response body';
            }

            window.httpRequestResponse = response.responseText;

            const historyItem = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                method: this.state.method,
                url: this.state.url,
                status: response.status,
                statusText: response.statusText,
                request: {
                    headers: this.state.headers,
                    cookies: this.state.cookies,
                    body: this.state.body
                },
                response: {
                    headers: response.responseHeaders,
                    body: response.responseText
                }
            };

            this.state.history.push(historyItem);
            this.state.currentHistoryId = historyItem.id;
            this.trimHistory();
            this.saveSettings();
            this.renderHistory(document.getElementById('hrt-history-list'));

            this.showToast(`Request completed with status ${response.status}`);
        }

        copyResponseToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Response copied to clipboard');
            }).catch(err => {
                this.showToast('Failed to copy text: ' + err);
            });
        }

        openResponseInNewTab(text) {
            try {
                const blob = new Blob([text], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                GM_openInTab(url, { active: true });
            } catch (e) {
                this.showToast('Failed to open response in new tab: ' + e);
            }
        }

        showToast(message) {
            if (!this.elements.toast) {
                const toast = document.createElement('div');
                toast.id = 'hrt-toast';
                toast.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    z-index: 10000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                `;
                document.body.appendChild(toast);
                this.elements.toast = toast;
            }

            this.elements.toast.textContent = message;
            this.elements.toast.style.opacity = '1';

            setTimeout(() => {
                this.elements.toast.style.opacity = '0';
            }, 3000);
        }

        updateSectionVisibility(sectionName, sectionElement) {
            const content = sectionElement.querySelector('.hrt-section-content');
            const icon = sectionElement.querySelector('.hrt-toggle-icon');

            if (this.state.sections[sectionName]) {
                content.style.display = 'none';
                icon.className = 'fa fa-plus hrt-toggle-icon';
            } else {
                content.style.display = 'block';
                icon.className = 'fa fa-minus hrt-toggle-icon';
            }
        }

        setupDraggableElement(element, handle = null) {
            const draggable = handle || element;
            const self = this;

            draggable.addEventListener('mousedown', function(e) {
                if (e.button !== 0) return;
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                self.dragState.isFullScreen = self.state.isFullScreen;
                if (self.state.isFullScreen) {
                    self.toggleFullScreen();
                    setTimeout(() => {
                        initDrag(e);
                    }, 100);
                } else {
                    initDrag(e);
                }
            });

            function initDrag(e) {
                self.dragState.isDragging = true;
                self.dragState.element = element;
                self.dragState.initialX = e.clientX;
                self.dragState.initialY = e.clientY;

                const style = window.getComputedStyle(element);
                const top = parseInt(style.top, 10) || 0;
                const left = parseInt(style.left, 10) || 0;
                const right = parseInt(style.right, 10) || 0;
                const bottom = parseInt(style.bottom, 10) || 0;

                if (style.top !== 'auto' && style.left !== 'auto') {
                    self.dragState.initialTop = top;
                    self.dragState.initialLeft = left;
                } else if (style.bottom !== 'auto' && style.right !== 'auto') {
                    self.dragState.initialTop = window.innerHeight - bottom - element.offsetHeight;
                    self.dragState.initialLeft = window.innerWidth - right - element.offsetWidth;
                } else if (style.top !== 'auto' && style.right !== 'auto') {
                    self.dragState.initialTop = top;
                    self.dragState.initialLeft = window.innerWidth - right - element.offsetWidth;
                } else if (style.bottom !== 'auto' && style.left !== 'auto') {
                    self.dragState.initialTop = window.innerHeight - bottom - element.offsetHeight;
                    self.dragState.initialLeft = left;
                }
            }
        }

        addGlobalEventListeners() {
            document.addEventListener('mousemove', (e) => {
                if (!this.dragState.isDragging) return;

                const element = this.dragState.element;
                const dx = e.clientX - this.dragState.initialX;
                const dy = e.clientY - this.dragState.initialY;
                const newTop = this.dragState.initialTop + dy;
                const newLeft = this.dragState.initialLeft + dx;
                const minTop = 0;
                const minLeft = 0;
                const maxTop = window.innerHeight - element.offsetHeight;
                const maxLeft = window.innerWidth - element.offsetWidth;

                element.style.top = Math.max(minTop, Math.min(maxTop, newTop)) + 'px';
                element.style.left = Math.max(minLeft, Math.min(maxLeft, newLeft)) + 'px';
                element.style.right = 'auto';
                element.style.bottom = 'auto';
            });

            document.addEventListener('mouseup', () => {
                this.dragState.isDragging = false;
                this.dragState.element = null;
            });

            window.addEventListener('resize', () => {
                if (this.state.isFullScreen) return;

                const floatWindow = this.elements.floatWindow;
                if (!floatWindow) return;
                const rect = floatWindow.getBoundingClientRect();

                if (rect.right > window.innerWidth) {
                    floatWindow.style.left = (window.innerWidth - rect.width) + 'px';
                }

                if (rect.bottom > window.innerHeight) {
                    floatWindow.style.top = (window.innerHeight - rect.height) + 'px';
                }
            });
        }
    }

    GM_addStyle(`
        .status-success { background: #e8f5e9; color: #2e7d32; }
        .status-redirect { background: #e8eaf6; color: #1a237e; }
        .status-client-error { background: #fff3e0; color: #f57c00; }
        .status-server-error { background: #ffebee; color: #b71c1c; }

        .hrt-hidden { display: none !important; }

        .hrt-method-btn.active {
            background: #4a90e2;
            color: white;
        }

        .hrt-history-item {
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .hrt-history-item:hover {
            background: #f5f5f5;
        }

        .hrt-history-item.active {
            background: #e8f5e9;
        }

        button:hover {
            filter: brightness(0.95);
        }

        button:active {
            transform: translateY(1px);
        }
    `);

    new HRTool();
})();

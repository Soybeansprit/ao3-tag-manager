// ==UserScript==
// @name         AO3 Excluded Tag Manager
// @namespace    https://github.com/Soybeansprit/ao3-tag-manager
// @version      0.2.0
// @description  Manage permanent excluded tags on AO3。实现永久屏蔽tags。
// @include        https://archiveofourown.org/*
// @include      http*://archiveofourown.gay/*
// @match        https://neversleep.top/*
// @match        https://jdkg.org/*
// @match        https://bk3.jdkg.org/*
// @match        https://archiveofourown.site/*
// @match        https://ao3mirror.site/*
// @match        https://ao1s.top/*
// @match        https://ao3l.site/*
// @match        https://i.aois.top/*
// @match        https://xn--iao3-lw4b.ws/*
// @match        https://ao3sg.hyf9588.tech/*
// @match        https://ao3rc.hyf9588.tech/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";


    // =========================================================
    // 配置
    // =========================================================

    const EXCLUDED_TAG_PARAM =
        "work_search[excluded_tag_names]";

    const STORAGE_KEY =
        "excludedTags";


    const DEFAULT_WORK_SEARCH_PARAMS = {

        "commit": "Sort+and+Filter",

        "work_search[sort_column]": "revised_at",

        "work_search[other_tag_names]": "",

        "work_search[crossover]": "",

        "work_search[complete]": "",

        "work_search[words_from]": "",

        "work_search[words_to]": "",

        "work_search[date_from]": "",

        "work_search[date_to]": "",

        "work_search[query]": "",

        "work_search[language_id]": ""
    };


    // =========================================================
    // 页面类型
    // =========================================================

    function getPageType(url) {

        const pathname = url.pathname;


        // 作品详情页
        if (/^\/works\/\d+$/.test(pathname)) {
            return "WORK_DETAIL";
        }


        // 关键词搜索
        if (pathname === "/works/search") {
            return "WORK_SEARCH";
        }


        // 普通作品列表
        if (pathname === "/works") {
            return "WORK_LIST";
        }


        // Tag 作品列表
        if (/^\/tags\/.+\/works$/.test(pathname)) {
            return "TAG_WORKS";
        }


        // 作者作品列表
        if (
            /^\/users\/[^/]+\/pseuds\/[^/]+\/works$/.test(pathname)
        ) {
            return "AUTHOR_WORKS";
        }


        return "OTHER";
    }


    // =========================================================
    // 判断页面是否需要处理
    // =========================================================

    function shouldProcessPage(pageType) {

        switch (pageType) {

            case "WORK_LIST":
            case "WORK_SEARCH":
            case "TAG_WORKS":
            case "AUTHOR_WORKS":
                return true;

            default:
                return false;
        }
    }


    // =========================================================
    // Storage
    // =========================================================

    function getExcludedTags() {

        return GM_getValue(
            STORAGE_KEY,
            []
        );
    }


    function saveExcludedTags(tags) {

        GM_setValue(
            STORAGE_KEY,
            tags
        );
    }


    // =========================================================
    // URL：添加默认参数
    // =========================================================

    function addDefaultWorkSearchParams(url) {

        for (
            const [key, value]
            of Object.entries(DEFAULT_WORK_SEARCH_PARAMS)
        ) {

            if (url.searchParams.has(key)) {
                continue;
            }

            url.searchParams.set(
                key,
                value
            );
        }
    }


    // =========================================================
    // URL：添加 excluded tags
    // =========================================================

    function updateExcludedTags(
        url,
        excludedTags
    ) {

        const currentValue =
            url.searchParams.get(
                EXCLUDED_TAG_PARAM
            ) || "";


        const currentTags =
            currentValue
                .split(",")
                .map(tag => tag.trim())
                .filter(Boolean);


        let changed = false;


        for (const tag of excludedTags) {

            if (currentTags.includes(tag)) {
                continue;
            }

            currentTags.push(tag);

            changed = true;
        }


        if (!changed) {
            return false;
        }


        url.searchParams.set(
            EXCLUDED_TAG_PARAM,
            currentTags.join(",")
        );


        return true;
    }


    // =========================================================
    // URL：处理
    // =========================================================

    function processUrl(
        url,
        pageType,
        excludedTags
    ) {

        /*
         * WORK_SEARCH 不添加默认参数
         */
        if (pageType !== "WORK_SEARCH") {

            addDefaultWorkSearchParams(url);
        }


        return updateExcludedTags(
            url,
            excludedTags
        );



    }


    // =========================================================
    // 页面跳转
    // =========================================================

    function processCurrentPage() {

        const originalUrl =
            window.location.href;


        const url =
            new URL(originalUrl);


        const pageType =
            getPageType(url);


        console.log(
            "[AO3 Tag Manager]",
            "Page Type:",
            pageType
        );


        if (!shouldProcessPage(pageType)) {
            return;
        }


        const excludedTags =
            getExcludedTags();


        if (excludedTags.length === 0) {
            return;
        }


        const shouldUpdate = processUrl(
            url,
            pageType,
            excludedTags
        );


        /*
         * URL 没发生变化
         *
         * 不重新请求
         */
        if (
            !shouldUpdate
        ) {
            console.log(
            "[AO3 Tag Manager]",
            "Do not update...",
            url.toString()
        );
            return;
        }


        console.log(
            "[AO3 Tag Manager]",
            "Redirect:",
            url.toString()
        );


        window.location.href =
            url.toString();
    }


    // =========================================================
    // UI：创建样式
    // =========================================================

    function createStyles() {

        const style =
            document.createElement("style");


        style.textContent = `

            #ao3-tag-manager {

                position: fixed;

                right: 20px;

                bottom: 20px;

                z-index: 999999;

                font-family:
                    Arial,
                    sans-serif;
            }


            #ao3-tag-manager-button {

                border: none;

                border-radius: 6px;

                padding: 10px 14px;

                background: #900;

                color: white;

                cursor: pointer;

                font-size: 14px;

                box-shadow:
                    0 2px 8px
                    rgba(0, 0, 0, 0.25);
            }


            #ao3-tag-manager-panel {

                display: none;

                width: 320px;

                margin-bottom: 10px;

                padding: 16px;

                background: white;

                border: 1px solid #ccc;

                border-radius: 8px;

                box-shadow:
                    0 4px 16px
                    rgba(0, 0, 0, 0.25);

                color: #333;

                box-sizing: border-box;
            }


            #ao3-tag-manager-panel h3 {

                margin:
                    0 0 12px 0;

                font-size: 18px;
            }


            #ao3-tag-manager-input {

                width: 100%;

                box-sizing: border-box;

                padding: 8px;

                margin-bottom: 8px;

                border:
                    1px solid #aaa;

                border-radius: 4px;

                font-size: 14px;
            }


            #ao3-tag-manager-add {

                width: 100%;

                padding: 8px;

                border: none;

                border-radius: 4px;

                background: #900;

                color: white;

                cursor: pointer;

                font-size: 14px;
            }


            #ao3-tag-manager-list {

                margin-top: 14px;

                max-height: 300px;

                overflow-y: auto;
            }


            .ao3-tag-item {

                display: flex;

                align-items: center;

                justify-content: space-between;

                gap: 8px;

                padding:
                    7px 0;

                border-bottom:
                    1px solid #eee;

                font-size: 13px;
            }


            .ao3-tag-name {

                flex: 1;

                word-break: break-word;
            }


            .ao3-tag-delete {

                flex-shrink: 0;

                border: none;

                background: none;

                color: #900;

                cursor: pointer;

                font-size: 13px;

                padding: 2px 4px;
            }


            .ao3-tag-empty {

                color: #777;

                font-size: 13px;

                padding: 8px 0;
            }

        `;


        document.head.appendChild(style);
    }


    // =========================================================
    // UI：刷新 Tag 列表
    // =========================================================

    function renderTagList(listElement) {

        listElement.innerHTML = "";


        const tags =
            getExcludedTags();


        if (tags.length === 0) {

            const empty =
                document.createElement("div");


            empty.className =
                "ao3-tag-empty";


            empty.textContent =
                "还没有屏蔽任何 Tag";


            listElement.appendChild(empty);

            return;
        }


        tags.forEach((tag, index) => {

            const item =
                document.createElement("div");


            item.className =
                "ao3-tag-item";


            const name =
                document.createElement("span");


            name.className =
                "ao3-tag-name";


            name.textContent =
                tag;


            const deleteButton =
                document.createElement("button");


            deleteButton.className =
                "ao3-tag-delete";


            deleteButton.textContent =
                "删除";


            deleteButton.addEventListener(
                "click",
                () => {

                    const tags =
                        getExcludedTags();


                    tags.splice(index, 1);


                    saveExcludedTags(tags);


                    renderTagList(
                        listElement
                    );
                }
            );


            item.appendChild(name);

            item.appendChild(
                deleteButton
            );


            listElement.appendChild(item);
        });
    }


    // =========================================================
    // UI：创建 UI
    // =========================================================

    function createUI() {

        /*
         * document.head 在 document-start
         * 阶段可能还不存在。
         *
         * 所以等待 DOM。
         */
        if (!document.head || !document.body) {

            setTimeout(
                createUI,
                100
            );

            return;
        }


        createStyles();


        // 最外层
        const container =
            document.createElement("div");


        container.id =
            "ao3-tag-manager";


        // Panel
        const panel =
            document.createElement("div");


        panel.id =
            "ao3-tag-manager-panel";


        // 标题
        const title =
            document.createElement("h3");


        title.textContent =
            "AO3 Tag Manager";


        // 输入框
        const input =
            document.createElement("input");


        input.id =
            "ao3-tag-manager-input";


        input.type =
            "text";


        input.placeholder =
            "输入要屏蔽的 Tag";


        // 添加按钮
        const addButton =
            document.createElement("button");


        addButton.id =
            "ao3-tag-manager-add";


        addButton.textContent =
            "添加 Tag";


        // Tag 列表
        const list =
            document.createElement("div");


        list.id =
            "ao3-tag-manager-list";


        // 组装 Panel
        panel.appendChild(title);

        panel.appendChild(input);

        panel.appendChild(addButton);

        panel.appendChild(list);


        // 主按钮
        const button =
            document.createElement("button");


        button.id =
            "ao3-tag-manager-button";


        button.textContent =
            "AO3 Tags Blocker";


        // 打开 / 关闭
        button.addEventListener(
            "click",
            () => {

                const isOpen =
                    panel.style.display === "block";


                panel.style.display =
                    isOpen
                        ? "none"
                        : "block";


                if (!isOpen) {

                    renderTagList(list);
                }
            }
        );


        // 添加 Tag
        function addTag() {

            const tag =
                input.value.trim();


            if (!tag) {
                return;
            }


            const tags =
                getExcludedTags();


            /*
             * 已经存在
             */
            if (tags.includes(tag)) {

                input.value = "";

                return;
            }


            tags.push(tag);


            saveExcludedTags(tags);


            input.value = "";


            renderTagList(list);
        }


        addButton.addEventListener(
            "click",
            addTag
        );


        /*
         * Enter 添加
         */
        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    addTag();
                }
            }
        );


        container.appendChild(panel);

        container.appendChild(button);


        document.body.appendChild(
            container
        );
    }


    // =========================================================
    // 启动
    // =========================================================

    processCurrentPage();


    /*
     * UI 不需要在 document-start
     * 阶段立即创建。
     *
     * 等页面 DOM 准备好以后创建。
     */
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            createUI
        );

    } else {

        createUI();
    }

})();

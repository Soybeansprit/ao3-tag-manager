// ==UserScript==
// @name         AO3 Tag Blocker
// @namespace    https://github.com/Soybeansprit/ao3-tag-manager
// @version      1.0.2
// @author       Soybeansprit
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
// @updateURL    https://raw.githubusercontent.com/Soybeansprit/ao3-tag-manager/main/ao3-tag-manager.user.js
// @downloadURL  https://raw.githubusercontent.com/Soybeansprit/ao3-tag-manager/main/ao3-tag-manager.user.js
// ==/UserScript==

(function () {
    "use strict";


    // =========================================================
    // 配置
    // =========================================================

    const EXCLUDED_TAG_PARAM =
        "work_search[excluded_tag_names]";
    const QUERY_PARAM = "work_search[query]";
    
    

    const EXCLUDED_TAGS_STORAGE_KEY =
        "excludedTags";
    const EXCLUDED_KEYWORDS_STORAGE_KEY = "excludedKeywords";


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
            EXCLUDED_TAGS_STORAGE_KEY,
            []
        );
    }


    function saveExcludedTags(tags) {

        GM_setValue(
            EXCLUDED_TAGS_STORAGE_KEY,
            tags
        );
    }
    
    function getExcludedKeywords() {
        return GM_getValue(
            EXCLUDED_KEYWORDS_STORAGE_KEY,
            []
        );
    }

    function saveExcludedKeywords(keywords) {
        GM_setValue(
            EXCLUDED_KEYWORDS_STORAGE_KEY,
            keywords
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
    // URL：添加默认参数
    // =========================================================
    function updateExcludedKeywordsToUrl(
     url, 
     excludedKeywords,
     pageType
    ) {

    if (!excludedKeywords.length) {
        return false;
    }

    let currentQuery =
        url.searchParams.get(QUERY_PARAM) || "";

    let hasChanged = false;

    if(pageType !== "WORK_SEARCH") {
        for (const keyword of excludedKeywords) {

            const excludeExpression =
                `-"${keyword}"`;


            // 如果当前 URL 已经有这个关键词
            // 就不重复添加
            if (
                !currentQuery.includes(
                    excludeExpression
                )
            ) {

                currentQuery += excludeExpression;

                hasChanged = true;
            }
        }
    } else {
        for (const keyword of excludedKeywords) {

            const excludeExpression =
                `NOT "${keyword}"`;


            // 如果当前 URL 已经有这个关键词
            // 就不重复添加
            if (
                !currentQuery.includes(
                    excludeExpression
                )
            ) {

                currentQuery += " " + excludeExpression;

                hasChanged = true;
            }
        }

    }


    if (hasChanged) {

        url.searchParams.set(
            QUERY_PARAM,
            currentQuery
        );
    }


    return hasChanged;
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
        excludedTags,
        excludeKeyWords
    ) {

        /*
         * WORK_SEARCH 不添加默认参数
         */
        if (pageType !== "WORK_SEARCH") {

            addDefaultWorkSearchParams(url);
        }


        const hasTagChange = updateExcludedTags(
            url,
            excludedTags
        );
        
        const hasKeyWordChange = updateExcludedKeywordsToUrl(
            url,
            excludeKeyWords,
            pageType
        );
        
        return hasTagChange || hasKeyWordChange



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
        const excludeKeyWords = 
              getExcludedKeywords();


        if (excludedTags.length === 0 && excludeKeyWords.length === 0) {
            return;
        }


        const shouldUpdate = processUrl(
            url,
            pageType,
            excludedTags,
            excludeKeyWords
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

                max-width:
                    calc(100vw - 40px);

                max-height:
                    calc(100vh - 100px);

                overflow-y: auto;

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


            .ao3-tag-manager-input {

                width: 100%;

                box-sizing: border-box;

                padding: 8px;

                margin-bottom: 8px;

                border:
                    1px solid #aaa;

                border-radius: 4px;

                font-size: 14px;
            }


            #ao3-tag-add {

                width: 40%;

                padding: 8px;

                border: none;

                border-radius: 4px;

                background: #900;

                color: white;

                cursor: pointer;

                font-size: 14px;
            }

            #ao3-keyword-add {

                width: 40%;

                padding: 8px;

                border: none;

                border-radius: 4px;

                background: #900;

                color: white;

                cursor: pointer;

                font-size: 14px;
            }


            .ao3-tag-manager-list {

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


    // 添加 Tag
        function addTag(content) {

            const tag =
                content.trim();


            if (!tag) {
                return;
            }


            const tags = getExcludedTags();

            console.log("addTag", "tags: " + tags)


            /*
             * 已经存在
             */
            if (tags.includes(tag)) {

                return;
            }


            tags.push(tag);

            console.log("addTag", "new tags: " + tags)


            saveExcludedTags(tags);
        }
        
        
        // add exclude keyword
        function addExcludedKeyword(content) {

            const keyword = content.trim();

            if (!keyword) {
                return;
            }


            const keywords = getExcludedKeywords();

            console.log("addExcludedKeyword", "keywords: " + keywords)


            if (
                keywords.includes(keyword)
            ) {
                return;
            }


            keywords.push(keyword);

            console.log("addExcludedKeyword", "new keywords: " + keywords)

            saveExcludedKeywords(
                keywords
            );
        }
        
        // delete exclude keyword
        function removeExcludedKeyword(keyword) {

            const keywords =
                  getExcludedKeywords();

            console.log("removeExcludedKeyword", "keywords: " + keywords)


            const newKeywords =
                keywords.filter(
                    item => item !== keyword
                );
                
            console.log("removeExcludedKeyword", "new keywords: " + newKeywords)


            saveExcludedKeywords(
                newKeywords
            );
        }

        // delete exclude keyword
        function removeExcludedTag(tag) {

            const tags = getExcludedTags();
            
            console.log("removeExcludedTag", "tags: " + tags)


            const newTags =
                tags.filter(
                    item => item !== tag
                );

            console.log("removeExcludedTag", "new tags: " + newTags)

            

            saveExcludedTags(
                newTags
            );
        }

    function rendTagOrKeywrodItem(content, type, listElement) {
        const item =
                document.createElement("div");


            item.className =
                "ao3-tag-item";


            const name =
                document.createElement("span");


            name.className =
                "ao3-tag-name";


            name.textContent =
                "[" + type + "] " + content;


            const deleteButton =
                document.createElement("button");


            deleteButton.className =
                "ao3-tag-delete";


            deleteButton.textContent =
                "删除";


            deleteButton.addEventListener(
                "click",
                () => {

                    if(type === "TAG") {
                        removeExcludedTag(content);
                    } else if(type == "KEYWORD") {
                        removeExcludedKeyword(content);
                    }


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
    }

    function renderTagList(listElement) {

        listElement.innerHTML = "";


        const tags = getExcludedTags();
        const keywords = getExcludedKeywords();


        if (tags.length === 0 && keywords.length === 0) {

            const empty =
                document.createElement("div");


            empty.className =
                "ao3-tag-empty";

            empty.textContent =
                "还没有屏蔽任何 Tag 或者 Keyword";
            listElement.appendChild(empty);

            return;
        }


        tags.forEach((tag) => {

            rendTagOrKeywrodItem(tag, "TAG", listElement);
        });

        keywords.forEach((keyword) => {
            rendTagOrKeywrodItem(keyword, "KEYWORD", listElement);
            
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
        const tagInput =
            document.createElement("input");


        tagInput.className =
            "ao3-tag-manager-input";


        tagInput.type =
            "text";


        tagInput.placeholder =
            "输入要屏蔽的 Tag";

        // 输入框
        const keywordInput =
            document.createElement("input");


        keywordInput.className =
            "ao3-tag-manager-input";


        keywordInput.type =
            "text";


        keywordInput.placeholder =
            "输入要屏蔽的 Keyword";


        // 添加Tag按钮
        const addTagButton =
            document.createElement("button");


        addTagButton.id =
            "ao3-tag-add";


        addTagButton.textContent =
            "添加 Tag";
        
        // 添加Keyword按钮
        const addKeywordButton =
            document.createElement("button");


        addKeywordButton.id =
            "ao3-keyword-add";


        addKeywordButton.textContent =
            "添加 Keyword";


        // Tag 列表
        const tagList =
            document.createElement("div");


        tagList.className =
            "ao3-tag-manager-list";
        
        
        


        // 组装 Panel
        panel.appendChild(title);

        panel.appendChild(tagInput);

        panel.appendChild(addTagButton);

        panel.appendChild(keywordInput);

        panel.appendChild(addKeywordButton)

        panel.appendChild(tagList);


        // 主按钮
        const button =
            document.createElement("button");


        button.id =
            "ao3-tag-manager-button";


        button.textContent =
            "AO3 Tag Blocker";


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

                    renderTagList(tagList);
                }
            }
        );


        


        addTagButton.addEventListener(
            "click",
            () => {
                addTag(tagInput.value.trim());
                tagInput.value = "";
                renderTagList(tagList);
            }
        );
        addKeywordButton.addEventListener(
            "click",
            () => {
                addExcludedKeyword(keywordInput.value.trim());
                keywordInput.value = "";
                renderTagList(tagList);
            }
        )


        /*
         * Enter 添加
         */
        tagInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    addTag(tagInput.value.trim());
                    tagInput.value = "";
                    renderTagList(tagList);
                }
            }
        );

        keywordInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    addExcludedKeyword(keywordInput.value.trim());
                    keywordInput.value = "";
                    renderTagList(tagList);
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

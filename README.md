# AO3 Tag 屏蔽器

一个用于 [Archive of Our Own (AO3)](https://archiveofourown.org/) 的 Tampermonkey 用户脚本。

用于管理需要长期屏蔽的 AO3 Tags 和 Keywords。**Tags 为作者给文章添加的标签；Keywords 为文章中包括目录、标签、文章内容中的精准关键词。**

AO3 原生的 Tag/Keywords 的屏蔽功能通常只对当前搜索生效。这个脚本允许用户保存一组长期需要排除的 Tags/Keywords，在访问 AO3 作品列表、Tag 作品列表或作者作品列表时，自动将这些 Tags 添加到 `work_search[excluded_tag_names]` 参数中。

---

## 功能

### 已实现

- 保存需要长期屏蔽的 Tags（支持添加 Tag｜删除 Tag）
- 保存需要长期屏蔽的关键词 Keywords（支持添加 Keywords｜删除 Keywords）
- URL 没有发生变化时不会重新请求页面
- 保留原 URL 中已有的其他参数
- 支持 Tag 作品列表
- 支持作者作品列表
- 支持普通作品列表
- 支持 AO3 作品搜索页面

### 页面支持

目前会处理以下页面：

| 页面 | 示例 | 是否处理 |
|---|---|---|
| 普通作品列表 | `/works` | ✅ |
| 关键词搜索 | `/works/search` | ✅ |
| Tag 作品列表 | `/tags/.../works` | ✅ |
| 作者作品列表 | `/users/.../pseuds/.../works` | ✅ |
| 作品详情页 | `/works/123456` | ❌ |
| AO3 首页 | `/` | ❌ |

---

## 工作原理

AO3 的作品筛选可以通过 URL 参数实现。

## 安装使用

### 1. 在浏览器安装 [Tampermonkey](https://www.tampermonkey.net/) 
### 2. 安装 AO3 Tag 屏蔽器

安装 Tampermonkey 后，点击下面的链接：

**[点击安装 AO3 Tag Blocker](https://raw.githubusercontent.com/Soybeansprit/ao3-tag-manager/main/ao3-tag-manager.user.js)**

Tampermonkey 会自动打开用户脚本安装页面。

点击 **「安装」** 即可。

### 3. 确认安装

打开 Tampermonkey 控制面板：

```text
Tampermonkey
    ↓
控制面板
    ↓
已安装脚本
```

### 4. 更新插件

打开 Tampermonkey 控制面板，找到 ```已安装脚本``` -> 找到 AO3 Tag Blocker 脚本 -> 点击在脚本的**最后更新**对应的时间一栏即可更新

### 5. 使用

安装完成后打开/刷新 AO3。

**点击右上角 Tampermonkey 快捷面板，打开 AO3 Tag Blocker。**

页面右下角会出现：

`AO3 Tag Blocker` 按钮，点击即可管理需要长期屏蔽的 Tags 和 Keywords。

添加要屏蔽的 Tags/Keywords 后，刷新页面或者下次请求即可生效。



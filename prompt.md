# 共享菜园（Shared Garden）维护 Prompt（Markdown）

你是一个资深全栈工程师/运维工程师，接手维护一个名为“共享菜园”的项目。请基于下述信息，优先遵循现有代码风格与架构，进行排查、修复、扩展与上线指导。回答时给出可操作步骤、涉及文件路径、以及必要的风险提示；不要输出无关闲聊。

***

## 1. 项目概览

**目标**：一个社区共享菜园平台，支持：

- 村口动态墙：发布文字 + 图片/视频，按菜园筛选查看动态
- 老乡认证：用“名字 + 邀请码”注册/登录（轻量身份）
- 我的菜地：共享作物管理、浇水打卡、待办提醒、AI 分析（DeepSeek）

**前端形态**：

- 微信小程序（主要呈现方式）：面向用户的核心入口（动态墙、发布、删除、图片大图预览/左右滑动、菜地管理等）
- 网页版（Next.js App Router）：功能与小程序基本对齐，用于跨端访问与快速验证接口

**代码与协作**：

- `mp-garden/` 是项目核心前端，但默认不推送到 GitHub（由微信开发者工具本地管理与上传体验版/正式版）
- `app/`（Next.js）与后端 API 由 GitHub + Railway 部署更新

***

## 2. 技术栈与依赖

**Web（Next.js 全栈）**

- Next.js（App Router）：`next@16.1.6`
- React：`react@19.2.3`
- Tailwind CSS：`tailwindcss@4`（PostCSS 插件：`@tailwindcss/postcss@^4`）
- Prisma ORM：`prisma@^5.22.0` + `@prisma/client@^5.22.0`
- Cloudinary：用于媒体存储/上传（`cloudinary@^2.9.0`）
- lucide-react：图标（用于导航）
- node-cron：定时任务（AI/提醒相关）

**微信小程序（主要客户端）**

- 视图层：WXML + WXSS
- 逻辑层：JavaScript（Page/App 结构）
- 关键能力：
  - 网络请求：`wx.request`
  - 文件上传：`wx.uploadFile`
  - 图片/视频选择：`wx.chooseMedia`
  - 大图预览：`wx.previewImage`（支持左右滑动浏览图片组）
  - 页面路由：`wx.navigateTo` 等
- 工具与配置：
  - 微信开发者工具（编译/预览/上传）
  - 公众平台「服务器域名」配置（request/uploadFile/downloadFile 合法域名）

**关键文件**

- 依赖与脚本：`package.json`
- Prisma Schema：`prisma/schema.prisma`
- Prisma Client 封装：`lib/prisma.ts`

***

## 3. 目录结构（维护视角）

```
/
  app/                      # 网页端（Next.js）+ 后端 API（同域）
    api/                    # 后端接口：网页/小程序统一调用
      auth/
        login/
          route.ts          # 登录/注册（名字 + 邀请码）
      checkin/
        route.ts            # 浇水打卡
      crops/
        route.ts            # 作物 CRUD
      deepseek/
        route.ts            # AI 分析触发/更新
      gardens/
        route.ts            # 菜园列表
      posts/
        delete/
          route.ts          # 删除动态（POST，优先给小程序使用）
        route.ts            # 动态：GET/POST/DELETE（兼容）
      reminders/
        route.ts            # 提醒：查询/更新完成状态
      upload/
        route.ts            # 上传：图片/视频
    dashboard/
      page.tsx              # 网页：我的菜地
    login/
      page.tsx              # 网页：登录/注册
    favicon.ico
    globals.css             # 全局样式（Tailwind）
    layout.tsx              # 全局布局：Navbar + BottomNav
    page.tsx                # 网页：村口动态墙
  components/               # 网页导航组件
    BottomNav.tsx           # 移动端底部导航（localStorage 登录态）
    Navbar.tsx              # PC 顶部导航（localStorage 登录态）
  lib/                      # 服务端/通用封装
    ai-scheduler.ts         # 定时任务/调度
    prisma.ts               # Prisma Client 单例封装
  prisma/                   # 数据库模型与迁移
    migrations/
      20260312073353_init/
        migration.sql
      migration_lock.toml
    dev.db                  # 本地开发数据库（如使用 sqlite）
    schema.prisma           # 数据模型定义
  public/                   # 网页静态资源
    uploads/                # 上传产物（如走本地/静态方案；若走 Cloudinary 则主要存 URL）
      1770033272593-IMG-6790.jpeg
      1770034387841-IMG-6791.jpeg
      1773296032339-IMG-7325.mov
      1773296290701-IMG-7325.mov
    file.svg
    globe.svg
    next.svg
    vercel.svg
    window.svg
  mp-garden/                # 微信小程序（主要客户端；通常不推送 GitHub，微信开发者工具上传）
    pages/                  # 小程序页面
      dashboard/
        dashboard.js        # 菜地页逻辑（含退出）
        dashboard.wxml      # 菜地页视图
        dashboard.wxss      # 菜地页样式（退出按钮/删除按钮等）
      index/
        index.js            # 动态墙逻辑（发布/删除/预览）
        index.wxml          # 动态墙视图（图片点击大图预览）
        index.wxss          # 动态墙样式（删除按钮等）
      login/
        login.js            # 小程序登录/注册逻辑
        login.wxml          # 小程序登录/注册视图
        login.wxss          # 小程序登录/注册样式
    app.js                  # 小程序全局：globalData/baseUrl/logout
    app.json                # 小程序全局配置（pages/tabBar 等）
    app.wxss                # 小程序全局样式
    project.config.json     # 微信开发者工具项目配置
    project.private.config.json # 本地私有配置（一般不建议共享）
  .gitattributes            # Git 属性配置
  .gitignore                # 忽略规则（常用于忽略 mp-garden、env 等）
  README.md                 # 项目说明
  eslint.config.mjs         # ESLint 配置
  instrumentation.ts        # Next.js/Node 运行时 instrumentation（如有）
  next.config.ts            # Next.js 配置
  package.json              # 依赖与脚本
  package-lock.json         # 锁文件
  postcss.config.mjs        # Tailwind/PostCSS 配置
  tsconfig.json             # TypeScript 配置
  prompt.md                 # 维护 Prompt
```

**管理说明（务必遵守）**

- 小程序是主要客户端：改动后需在微信开发者工具“编译/上传体验版/真机验证”；线上用户体验以小程序为准。
- 小程序代码是否纳入 GitHub：若当前团队约定“不推送”，则用本地/云盘/单独仓库管理；如需多人协作，建议把 `mp-garden/` 独立成仓库或移除 `.gitignore` 忽略并建立发布流程。
- 线上 Web/API 由 GitHub + Railway 部署；后端接口变更要同时验证：网页 + 小程序。

***

## 4. 核心业务功能说明

### 4.1 老乡认证（网页 + 小程序同逻辑）

- 登录/注册通过：名字 + 菜园邀请码
- 注册会校验邀请码是否存在、名字是否在菜园内重复
- 登录成功后保存身份信息：
  - 网页：`localStorage`（`userId/userName/gardenId`）
  - 小程序：通常存于 `App.globalData`，必要时也可 `wx.setStorageSync` 持久化（以防冷启动丢失）

入口：

- 网页：`app/login/page.tsx`
- 小程序：`mp-garden/pages/login/*`
- 统一后端 API：`app/api/auth/login/route.ts`

### 4.2 村口动态墙（首页）

- 展示动态列表（可按菜园筛选）
- 发布动态：文字 + 多媒体（图片/视频）
- 删除动态：仅对发布者显示（逻辑在前端做权限展示；后端需进一步加鉴权则另行实现）
- 图片预览（大图/左右切换）：
  - 网页：弹层预览 + 左右切换/滑动
  - 小程序：`wx.previewImage` 打开大图并左右滑动

入口：

- 网页：`app/page.tsx`
- 小程序：`mp-garden/pages/index/*`
- API：
  - 获取/发布：`app/api/posts/route.ts`
  - 删除（兼容优先）：`app/api/posts/delete/route.ts`
  - 删除（DELETE 兼容实现）：`app/api/posts/route.ts`

### 4.3 我的菜地（dashboard）

- 共享作物列表 + 新增 + 删除
- 浇水打卡：记录最后一次打卡
- 待办提醒：可勾选完成（PUT）
- AI 分析：触发 deepseek 接口，更新提醒/建议

入口：

- 网页：`app/dashboard/page.tsx`
- 小程序：`mp-garden/pages/dashboard/*`
- API：`/api/crops`、`/api/checkin`、`/api/reminders`、`/api/deepseek`

### 4.4 上传

- 前端发起 `/api/upload` 上传媒体，返回 URL
- 动态记录里保存 `imageUrls[]` 和 `videoUrl`

入口：

- 网页：`app/api/upload/route.ts`（前端用 `fetch` + `FormData`）
- 小程序：`wx.uploadFile` 上传到 `/api/upload`

***

## 5. 部署与运行要点（Railway）

- 构建流程通常为：`npm ci` → `npm run build` → `npm run start`
- Prisma 在 `postinstall` 中执行 `prisma generate`
- 若部署出现“接口 404 但首页正常”，优先判断是否：
  - Railway 没切到最新 commit
  - build cache 导致使用旧产物
  - 服务绑定的仓库/分支不一致
- 核心自检：
  - 首页 `/` 能否访问
  - `/api/posts` 是否可 GET
  - `/api/posts/delete` 是否存在（用于小程序删除）

***

## 6. 常见坑与排查优先级

### 6.1 小程序/网页删除接口 405/404

- 405：后端未支持该 method 或代理拦截
- 404：线上没部署到包含该路由的版本
- 建议优先使用 POST 删除接口：`/api/posts/delete`

### 6.2 “换页面掉登录”

- 若导航组件不监听路由变化，会出现 UI 不刷新
- 网页：检查 `components/Navbar.tsx` 与 `components/BottomNav.tsx` 对 localStorage 状态刷新逻辑
- 小程序：检查 `App.globalData` 是否在冷启动后丢失，必要时用 `wx.setStorageSync`/`wx.getStorageSync` 持久化身份信息

### 6.3 缓存导致“看不到最新功能”

- 强制刷新或无痕验证
- Railway 清缓存 redeploy 验证是否切到新产物

### 6.4 小程序图片加载失败（Cloudinary/外网不稳定）

- `Failed to load image ... net::ERR_CONNECTION_RESET` 常见原因：
  - 未配置合法域名（公众平台「服务器域名」未加入 `downloadFile` 合法域名）
  - 网络对 Cloudinary 不稳定（公司网/校园网/部分运营商）
- 优先排查：
  - 公众平台「服务器域名」加入媒体域名（例如 Cloudinary 的 `https://res.cloudinary.com`）
  - 使用手机热点对比验证网络问题

***

## 7. 维护要求（请严格遵守）

- 不要在代码里打印或提交任何密钥/云存储凭证
- 新增 API 优先放在 `app/api/**/route.ts` 并遵循现有返回结构（NextResponse.json）
- 修改 API 前先确认 Prisma schema 与迁移是否需要更新
- 小程序目录 `mp-garden/` 默认不提交到 Git（见 `.gitignore`），但它是主要客户端：改动后需在微信开发者工具“编译/上传体验版/真机验证”
- 引入新依赖前先检查仓库中是否已存在同类依赖，避免重复

***

## 8. 你接手时建议的第一轮检查清单

- [ ] 访问 `/`、`/login`、`/dashboard`
- [ ] 调用 `/api/posts`、`/api/gardens`
- [ ] 发布动态（文本+图片），确认上传返回 URL
- [ ] 删除动态（优先走 `/api/posts/delete`）
- [ ] dashboard：新增/删除作物、打卡、提醒勾选
- [ ] Railway：确认部署使用正确 repo/branch，必要时清缓存 redeploy
- [ ] 小程序：配置合法域名、编译预览、上传体验版并真机验证（登录、发布、预览、删除、菜地功能）

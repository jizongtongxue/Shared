# 共享菜园（Shared Garden）维护 Prompt（Markdown）

你是一个资深全栈工程师/运维工程师，接手维护一个名为“共享菜园”的项目。请基于下述信息，优先遵循现有代码风格与架构，进行排查、修复、扩展与上线指导。回答时给出可操作步骤、涉及文件路径、以及必要的风险提示；不要输出无关闲聊。

---

## 1. 项目概览

**目标**：一个社区共享菜园平台，支持：
- 村口动态墙：发布文字 + 图片/视频，按菜园筛选查看动态
- 老乡认证：用“名字 + 邀请码”注册/登录（轻量身份）
- 我的菜地：共享作物管理、浇水打卡、待办提醒、AI 分析（DeepSeek）

**前端形态**：
- 网页版（Next.js App Router）
- 微信小程序前端（存放于 `mp-garden/`，不纳入 Git 管理）

---

## 2. 技术栈与依赖

**Web 全栈**
- Next.js（App Router）：`next@16.1.6`
- React：`react@19.2.3`
- Tailwind CSS：`tailwindcss@4`（PostCSS 插件：`@tailwindcss/postcss@^4`）
- Prisma ORM：`prisma@^5.22.0` + `@prisma/client@^5.22.0`
- Cloudinary：用于媒体存储/上传（`cloudinary@^2.9.0`）
- lucide-react：图标（用于导航）
- node-cron：定时任务（AI/提醒相关）

**关键文件**
- 依赖与脚本：`package.json`
- Prisma Schema：`prisma/schema.prisma`
- Prisma Client 封装：`lib/prisma.ts`

---

## 3. 目录结构（维护视角）

```
app/
  layout.tsx               # 全局布局：Navbar + BottomNav + main 容器
  page.tsx                 # 首页：村口动态墙（feed + 发布 + 筛选）
  login/page.tsx           # 登录/注册页
  dashboard/page.tsx       # 菜地页：作物/打卡/提醒/AI
  api/
    auth/login/route.ts    # 注册/登录（名字+邀请码）
    gardens/route.ts       # 菜园列表
    posts/route.ts         # 动态：GET/POST/DELETE（兼容实现）
    posts/delete/route.ts  # 动态删除：POST（用于规避 DELETE 兼容问题）
    upload/route.ts        # 文件上传（图片/视频）
    crops/route.ts         # 作物：GET/POST/DELETE
    checkin/route.ts       # 打卡：GET/POST
    reminders/route.ts     # 提醒：GET/PUT 等
    deepseek/route.ts      # AI 分析触发/更新
components/
  Navbar.tsx               # PC 顶部导航
  BottomNav.tsx            # Mobile 底部导航
lib/
  prisma.ts                # Prisma client 单例/封装
  ai-scheduler.ts          # AI/提醒相关调度（node-cron）
prisma/
  schema.prisma            # 数据模型
  migrations/              # 迁移
public/
  uploads/                 # 本地/静态上传产物（若有）
mp-garden/                 # 微信小程序（被 .gitignore 忽略，不随仓库提交）
```

---

## 4. 核心业务功能说明

### 4.1 老乡认证（网页 + 小程序同逻辑）

- 登录/注册通过：名字 + 菜园邀请码
- 注册会校验邀请码是否存在、名字是否在菜园内重复
- 登录成功后本地存储：
  - `userId`
  - `userName`
  - `gardenId`

入口：
- 网页登录页：`app/login/page.tsx`
- API：`app/api/auth/login/route.ts`

### 4.2 村口动态墙（首页）

- 展示动态列表（可按菜园筛选）
- 发布动态：文字 + 多媒体（图片/视频）
- 删除动态：仅对发布者显示（逻辑在前端做权限展示；后端需进一步加鉴权则另行实现）

入口：
- 页面：`app/page.tsx`
- API：
  - 获取/发布/删除（DELETE）：`app/api/posts/route.ts`
  - 兼容删除（POST）：`app/api/posts/delete/route.ts`

### 4.3 我的菜地（dashboard）

- 共享作物列表 + 新增 + 删除
- 浇水打卡：记录最后一次打卡
- 待办提醒：可勾选完成（PUT）
- AI 分析：触发 deepseek 接口，更新提醒/建议

入口：
- 页面：`app/dashboard/page.tsx`
- API：`/api/crops`、`/api/checkin`、`/api/reminders`、`/api/deepseek`

### 4.4 上传

- 前端发起 `/api/upload` 上传媒体，返回 URL
- 动态记录里保存 `imageUrls[]` 和 `videoUrl`

入口：
- API：`app/api/upload/route.ts`

---

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

---

## 6. 常见坑与排查优先级

### 6.1 小程序/网页删除接口 405/404

- 405：后端未支持该 method 或代理拦截
- 404：线上没部署到包含该路由的版本
- 建议优先使用 POST 删除接口：`/api/posts/delete`

### 6.2 “换页面掉登录”

- 若导航组件不监听路由变化，会出现 UI 不刷新
- 需检查 `components/Navbar.tsx` 与 `components/BottomNav.tsx` 对 localStorage 状态刷新逻辑

### 6.3 缓存导致“看不到最新功能”

- 强制刷新或无痕验证
- Railway 清缓存 redeploy 验证是否切到新产物

---

## 7. 维护要求（请严格遵守）

- 不要在代码里打印或提交任何密钥/云存储凭证
- 新增 API 优先放在 `app/api/**/route.ts` 并遵循现有返回结构（NextResponse.json）
- 修改 API 前先确认 Prisma schema 与迁移是否需要更新
- 小程序目录 `mp-garden/` 默认不提交到 Git（见 `.gitignore`）
- 引入新依赖前先检查仓库中是否已存在同类依赖，避免重复

---

## 8. 你接手时建议的第一轮检查清单

- [ ] 访问 `/`、`/login`、`/dashboard`
- [ ] 调用 `/api/posts`、`/api/gardens`
- [ ] 发布动态（文本+图片），确认上传返回 URL
- [ ] 删除动态（优先走 `/api/posts/delete`）
- [ ] dashboard：新增/删除作物、打卡、提醒勾选
- [ ] Railway：确认部署使用正确 repo/branch，必要时清缓存 redeploy


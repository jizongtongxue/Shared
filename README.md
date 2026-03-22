# 共享菜园（Shared Garden）

以“微信小程序”为主要呈现方式的共享菜园社区应用；网页端（Next.js）用于跨端访问与接口联调验证。后端 API 与网页端同仓库同域部署（Railway）。

## 1) 技术栈

- Web 全栈：Next.js App Router + React + Tailwind
- 数据库：PostgreSQL + Prisma
- 媒体：Cloudinary（上传后返回 URL）
- 小程序：WXML/WXSS/JS（`mp-garden/`，默认不推送到 GitHub）

## 2) 目录结构（简要）

- `mp-garden/`：微信小程序（主要客户端，通常通过微信开发者工具管理/上传）
- `app/`：网页端 + `app/api/**` 后端接口（网页/小程序共用）
- `prisma/`：数据模型与迁移
- `lib/`：Prisma 封装、AI 调度等

更完整目录结构见 [prompt.md](./prompt.md)。

## 3) 本地启动（Web + API）

安装依赖：

```bash
npm install
```

启动开发：

```bash
npm run dev
```

生产构建与启动：

```bash
npm run build
npm run start
```

## 4) 环境变量（不要提交到 Git）

本项目依赖以下环境变量（变量名即可，不要在仓库提交真实值）：

```bash
# PostgreSQL
DATABASE_URL=

# Cloudinary（历史/兼容方案：/api/upload）
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# 腾讯云 COS（直传方案：/api/upload-token）
TENCENT_SECRET_ID=
TENCENT_SECRET_KEY=
COS_BUCKET=shared-garden-media-1301483365
COS_REGION=ap-guangzhou
COS_PUBLIC_BASE_URL=https://shared-garden-media-1301483365.cos.ap-guangzhou.myqcloud.com

# DeepSeek（可选：不填则使用兜底建议）
DEEPSEEK_API_KEY=
```

## 5) 推送到 GitHub（Web/API）

常用流程（在仓库根目录执行）：

```bash
git status
git add -A
git commit -m "你的提交说明"
git push origin main
```

常用排查：

```bash
git log -n 5 --oneline
git diff
git diff --staged
```

重要说明：

- `mp-garden/` 默认在 `.gitignore` 中被忽略，不会随 `git push` 提交到 GitHub
- Web/API 代码推送到 GitHub 后，会触发 Railway 自动构建/部署（若你已在 Railway 绑定仓库）

## 6) 数据库管理（Prisma + PostgreSQL）

Prisma Schema 在 `prisma/schema.prisma`，数据库连接使用 `DATABASE_URL`。

生成 Prisma Client（通常 `npm install` 后会自动执行，但可手动运行）：

```bash
npx prisma generate
```

本地开发：创建迁移并应用到数据库（推荐）：

```bash
npx prisma migrate dev --name <migration_name>
```

生产/线上：应用已有迁移（推荐用于 Railway/生产环境）：

```bash
npx prisma migrate deploy
```

查看数据库数据（打开 Prisma Studio）：

```bash
npx prisma studio
```

检查迁移状态：

```bash
npx prisma migrate status
```

高风险命令（会清库/重置，不要在生产环境执行）：

```bash
npx prisma migrate reset
```

## 7) 微信小程序（mp-garden）联调要点

小程序是项目主要客户端，主要通过微信开发者工具运行与上传：

- 本地调试：微信开发者工具打开 `mp-garden/` 项目 → 编译
- 上传版本：上传体验版 → 真机验证 → 再发布

小程序常用能力与对应实现：

- 请求后端：`wx.request`（baseUrl 通常在 `mp-garden/app.js` 的 `globalData`）
- 上传（直传推荐）：`wx.request` → `/api/upload-token` → COS 直传 → 写入 `posts.imageUrls/videoUrl`
- 上传（兼容/旧）：`wx.uploadFile` → `/api/upload`（Cloudinary）
- 大图预览：`wx.previewImage`（支持左右滑动浏览图片组）
- 删除动态：建议调用 `POST /api/posts/delete`（更稳健，避免部分网络对 DELETE 的限制）

服务器域名配置（公众平台“开发设置”）建议至少包含：

- request 合法域名：你的 Railway 域名（例如 `https://shared-app-production.up.railway.app`）
- uploadFile 合法域名：
  - 若走旧上传 `/api/upload`：Railway 域名
  - 若走 COS 直传：COS 上传域名（bucket 对应的 cos 域名）
- downloadFile 合法域名：
  - COS 默认访问域名（例如 `https://shared-garden-media-1301483365.cos.ap-guangzhou.myqcloud.com`）
  - （若仍保留旧内容）`https://res.cloudinary.com`

## 8) Railway 部署排查（常用）

若出现“网页正常但某些 API 404/未更新”的情况，优先：

- 确认 Railway 部署的 commit 与 GitHub 最新提交一致
- 清理 build cache 后 redeploy（构建缓存可能导致仍使用旧产物）

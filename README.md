# 食品安全智慧管理云平台 — Monorepo (Skeleton)

本仓库为单体 Monorepo 骨架，采用 pnpm 管理，多端多服务代码结构已就位，可按需继续扩展为完整功能。

## 技术栈（已确认）
- Node.js 20
- 前端 Web：Vue 3 + Vite + TypeScript + Pinia + Vue Router + Element Plus
- 移动端：UniApp（HBuilderX 兼容），提供演示壳工程
- 后端：NestJS（api-gateway、user-service 示例）
- 数据/缓存/对象存储/消息队列：PostgreSQL、Redis、MinIO、Kafka
- 反向代理：Nginx（含 WebSocket 转发）

## 目录结构
- `apps/`
  - `web-school` 学校端（Vite + Vue3）
  - `web-regulator` 监管端（Vite + Vue3）
  - `mobile-device` 设备管理（UniApp 壳）
  - `mobile-emergency` 应急管理（UniApp 壳）
- `services/`
  - `api-gateway` 网关（NestJS + Swagger）
  - `user-service` 用户服务（NestJS 示例）
- `libs/shared/models` TypeScript 接口 + Zod 校验
- `infra/` docker-compose 与 nginx 配置
- `scripts/` 一键演示脚本骨架

## 快速开始
1. 使用 npm（免 Corepack）：确保 Node 20，运行 `npm --version` 验证
2. 安装依赖（工作区）：`npm install --workspaces`
3. 本地开发（多包并行）：`npm run dev --workspaces --if-present`
4. 构建：`npm run build --workspaces --if-present`
5. 一键演示（容器）：`bash scripts/demo.sh`

> 说明：当前仅为骨架，可启动基础服务与示例接口，后续可逐步补全数据库、鉴权、AI 事件流、导出等能力。

## 环境变量
复制 `.env.example` 为 `.env` 并按需修改。

## OpenAPI
- API 文档：启动 `api-gateway` 后访问 `http://localhost/api/docs`

## 备注
- UniApp 项目建议用 HBuilderX 打开进行运行/打包。
- docker-compose 已包含 Postgres/Redis/MinIO/Kafka/Nginx 与示例服务镜像构建（Dockerfile 已改为使用 npm）。

### 单独运行某个包（npm 示例）
- 网关开发：`npm --prefix services/api-gateway run dev`
- 用户服务开发：`npm --prefix services/user-service run dev`
- 学校端 Web：`npm --prefix apps/web-school run dev`
- 监管端 Web：`npm --prefix apps/web-regulator run dev`

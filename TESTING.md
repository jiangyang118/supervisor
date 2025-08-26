# 测试与验证手册

本手册说明如何在本仓库运行静态检查、类型检查、E2E 测试，并解释常见问题的处理方式。所有命令在仓库根目录执行。

## 前置条件

- Node.js 20+
- 安装依赖：`npm i`（已启用 workspaces）
- 安装浏览器依赖（首次）：`npx playwright install`
- 初始化 Husky 钩子（可选）：`npm run prepare`

## 脚本速查（在根目录执行）

- Lint（Prettier）：`npm run lint`
- Lint（ESLint）：`npm run lint:eslint`，自动修复：`npm run lint:fix`
- 类型检查（vue-tsc）：`npm run typecheck`
- 端到端测试（Playwright）：
  1. `npx playwright install`（首次，下载浏览器）
  2. `npm run test:e2e`（会自动启动 4200/4300 开发服务器）
  3. `npm run e2e:report`（打开测试报告）

也可在子包内执行（效果相同）：

- 学校端：`npm --prefix apps/web-school run test:e2e` 或进入 `apps/web-school` 后 `npm run test:e2e`
- 监管端：`npm --prefix apps/web-regulator run test:e2e` 或进入 `apps/web-regulator` 后 `npm run test:e2e`

## 用例说明

- e2e/school-pages.spec.ts：学校端主要页面可达性（首页、农残快检、消毒）。
- e2e/school-pages-extended.spec.ts：学校端扩展模块的页面可达性（AI 预警、明厨亮灶、公示、应急、统计/设备/系统等）。
- e2e/regulator-ledgers.spec.ts：监管端主要台账可达性（农残、消毒）。
- e2e/flow-pesticide.spec.ts：业务流用例（学校端创建一条“农残不合格”记录 → 监管端农残台账可见）。
  - 说明：当前通过浏览器 Cookie 在同域（localhost）跨端口共享数据，模拟后端入库效果，便于演示联动流程。上线前会替换为真实 API。

## 常见问题

- Playwright 未安装浏览器：执行 `npx playwright install`。
- 端口被占用：手动关闭本地 4200/4300 端口占用进程，或先手动启动前端后再跑测试（测试会复用）。
- Husky 未触发：运行 `npm run prepare` 再试；或检查 `.husky/_/husky.sh` 是否存在且可执行。

## CI

示例工作流位于 `.github/workflows/ci.yml`，按顺序执行安装 → Lint → Typecheck → E2E。可根据需求打开失败阻断或生成报告工件。

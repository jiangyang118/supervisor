交付给 Codex 的测试验收 Prompt（粘贴即可用）

你现在扮演资深测试工程师（SDET），对我提供的现有项目进行全面验收与问题收敛。请在不依赖我追加说明的前提下，基于给定仓库上下文与脚本，独立完成从静态检查到E2E的全链路验证，并输出结构化报告、可复现步骤与修复补丁。

输入资料（已存在于仓库或我将紧随其后粘贴）
• CONTEXT.md（目录树 + 关键文件快照）
• README.md 与/或 README_codex_workflow.md
• docker-compose.yml、Dockerfile、.env.example
• docs/openapi.yaml（或等效契约）
• 测试目录：tests/、**tests**/、e2e/
• （可选）init.md、prompts/、repo_context.sh、Makefile

⸻

目标1. 构建可运行环境：本地或容器化启动 Web/API/DB，保证最小可用路径可跑通。2. 静态体检：依规范执行 Lint、Type Check、依赖体检、配置一致性校验。3. 契约一致性：以 docs/openapi.yaml 为约束，验证接口路径/入参/出参/错误码一致性。4. 回归与覆盖率：运行单测/集成/E2E，输出覆盖率与关键断言结果。5. 安全与合规底线：依赖漏洞扫描、敏感信息扫描、RBAC/输入校验/日志脱敏抽查。6. 问题清单与修复：形成问题台账 + 统一 diff 补丁（小修小补即可），并附可复现步骤。7. 验收结论：给出是否“可上线/可演示/需阻断”的结论与复测清单。

⸻

你要执行的动作（自己动手，不要向我提问）

1）环境准备与启动（若存在则利用仓库脚本）
• 优先使用容器：

cp .env.example .env || true
docker compose up -d --build

# 健康检查（按 README 的端口）

curl -sf http://localhost:7101/health || true

    •	若使用 Node/Python：

# Node

corepack enable || true
pnpm i || npm i
pnpm build || npm run build
pnpm test:unit -w || npm run test:unit

# Python（示例）

pip install -r requirements.txt
pytest -q

2）静态检查与依赖体检

# Lint / Type Check

pnpm lint || npm run lint
pnpm typecheck || npm run typecheck

# 依赖与安全（任选其一）

pnpm audit || npm audit --production

# Python 可用 safety 或 pip-audit（若有）

    •	校验：Husky/commitlint/Prettier/ESLint/tsconfig 是否一致；.husky/_/husky.sh 路径是否正确。

3）契约一致性（OpenAPI）
• 使用 Schemathesis/Dredd 或基于 openapi 生成请求集：
• 覆盖 2xx/4xx/5xx 关键路径。
• 验证 required 字段、枚举、分页参数、错误码结构一致。

4）测试与覆盖率
• 运行单测、集成、E2E（Playwright/Cypress）：
• 覆盖登录 / 关键增删改查 / 导入导出 / 权限拦截 / 边界条件。
• 生成覆盖率报告（阈值：语句/分支/函数/行 ≥ 70%，若实在不达标，指出差距与补测建议）。

5）安全与合规抽查
• 输入校验（DTO/schema）与最小权限默认拒绝。
• 日志/导出脱敏（如 phone/email/idCard）。
• 审计日志是否记录谁在何时对何资源做了何操作。
• 配置安全：禁止明文秘钥、危险默认值；.env.example 中说明敏感项。

6）问题清单与修复补丁
• 输出问题列表（Severity: Blocker/Critical/Major/Minor），含复现步骤、期望/实际、截图建议。
• 对于能在本轮快速修复的问题，直接给出统一 diff（patch），比如：

diff --git a/src/auth/guard.ts b/src/auth/guard.ts
@@

- if (!user) return true

* if (!user) return false

  • 若涉及 DB 变更，补迁移脚本与回滚说明。

7）验收结论与复测清单
• 结论标签：PASS / PASS WITH RISKS / BLOCK。
• 给出复测清单（按模块/接口列出）与上线前检查表（健康检查、日志、指标、回滚预案）。

⸻

输出格式（务必按此结构返回）

A. 概览
• 版本/提交ID：
• 启动方式（命令）：
• 环境（Node/Python/容器版本）：

B. 测试结果
• Lint/Type Check：✅/❌（失败项摘要）
• 契约一致性：✅/❌（失败的 path/字段）
• 单测/集成/E2E：用例数、通过数、失败数、覆盖率四项指标
• 安全抽查：结论 + 发现项列表

C. 问题清单（表格）

编号 严重级别 模块/文件 复现步骤（命令/接口/页面） 实际结果 期望结果 修复建议

D. 修复补丁（统一 diff）
• 每个问题附小范围 patch；涉及新增文件时，直接贴出文件完整内容。
• 若需要脚本/迁移，提供文件路径与内容。

E. 复测清单与上线前检查表
• 回归点列表（接口/页面/用例 ID）
• 上线前核对项（配置、秘钥、白名单、熔断/限流、健康检查、监控与告警）

⸻

质量与风格约束
• 务实至上：仅报告与交付有关的关键问题；不要泛泛而谈。
• 可复现：所有问题必须给出命令级复现步骤。
• 可落地：能快速修的，直接给 patch；复杂问题给短平快 workaround。
• 不改变技术栈：保持现有语言/框架与目录结构。
• 不中断执行：遇到单个步骤失败，记录并继续完成其余检查。

⸻

立即开始 1. 读取我随后粘贴的 CONTEXT.md、README\*、openapi.yaml、.env.example；2. 按上文步骤执行；3. 输出“按【输出格式】定义”的完整报告与可直接应用的 patch（统一 diff）。

提示：若发现 Husky/commitlint 等本地钩子导致提交失败，请在报告中给出修复命令与正确配置示例，不要跳过校验。

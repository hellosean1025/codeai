# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式（TypeScript 监听编译）
npm run dev

# 构建（编译 TypeScript）
npm run build

# 运行 CLI（构建后）
bin/codeai

# 或者在开发期间
npm run dev  # 在一个终端
bin/codeai   # 在另一个终端
```

## 环境变量

必需的环境变量：
- `CODEAI_BASE_URL`: AI 模型 API 端点的基础 URL
- `CODEAI_AUTH_TOKEN`: API 访问认证令牌
- `CODEAI_MODEL_ID`: 模型标识符（可选，调用 API 时必须提供）

## 高层架构

这是一个基于终端的 AI 编码助手，采用智能体循环（agentic loop）架构。

### 核心组件

1. **CLI 界面** (`src/cli/index.tsx`)
   - 使用 Ink 的基于 React 的终端 UI
   - 主应用入口点，带有交互式 REPL
   - 处理用户输入并显示消息日志和待办事项列表

2. **查询引擎** (`src/query.ts`)
   - 实现智能体循环模式
   - 管理用户、LLM 和工具之间的对话流
   - 处理工具执行，出错时自动重试
   - 支持只读工具的并行执行
   - 在内部格式和 Vercel AI SDK 格式之间转换消息

3. **工具系统** (`src/tools/`)
   - 模块化工具架构，具有标准化接口
   - 每个工具定义：name、description（可以是异步函数）、inputSchema（Zod）、isReadOnly 标志和 execute 函数
   - 工具分类：只读（read、grep、glob、ls）、写入（write、edit、bash）和特殊（task、todo）
   - **重要**：工具描述可以是异步函数 - 访问时始终要 await

4. **LLM 集成** (`src/llm.ts`)
   - 可配置的模型提供者（兼容 OpenAI 的 API）
   - 使用环境变量进行 API 配置

5. **任务工具** (`src/tools/task.ts`)
   - 为复杂的多步骤任务启动子智能体
   - 每个任务独立运行，拥有自己的上下文
   - 不能递归使用任务工具（任务工具从子智能体工具中过滤掉）
   - 将最终的助手消息返回给父智能体

### 关键架构模式

**智能体循环**：
- 用户输入 → LLM 生成响应 + 工具调用 → 工具执行 → 结果反馈给 LLM → 循环继续直到没有更多工具调用
- 自动错误恢复：LLM 错误和工具错误触发重试，并将错误消息作为上下文
- 迭代跟踪，可选的最大迭代次数限制

**工具执行策略**：
- 当批次中的所有工具都是只读时，只读工具并行执行
- 写入工具串行执行以保持一致性
- 工具使用 Zod schemas 进行输入验证

**消息流**：
- 三种消息类型：user、assistant（带可选的 toolCalls）、tool（带 toolCallId）
- 消息维护对话历史以提供上下文
- 工具结果作为工具消息注入回对话

**UI 架构**：
- React 组件使用 Ink 在终端中渲染
- 通过监听器模式实时更新待办事项列表
- 消息日志显示带语法格式化的对话历史

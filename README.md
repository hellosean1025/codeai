
这是一个基于终端的 AI 编码助手,功能类似 claude code，主要目的是用来学习。

## 功能
- 支持多轮对话，可完成常见的代码分析、功能开发、文档生成等任务；
- 集成常用工具，如文本处理、待办管理、任务执行与搜索等；
- 支持子代理任务调度机制；
- 具备一定的异常自适应能力，能够应对常见的规划失败、工具执行错误等问题。

## 使用
1.在 zshrc 配置token，然后 source ~/.zshrc
```bash
export CODEAI_BASE_URL=""
export CODEAI_AUTH_TOKEN="{{apikey}}"
export CODEAI_MODEL_ID=""
```

2.安装和启动
> Node 版本需要 >= 22
```bash
npm i -g mycodeai
mycodeai # 启动
```

## 支持能力
- 支持多轮对话，可完成常见的代码分析、功能开发、文档生成等任务；
- 集成常用工具，如文本处理、待办管理、任务执行与搜索等；
- 支持子代理任务调度机制；
- 具备一定的异常自适应能力，能够应对常见的规划失败、工具执行错误等问题。

## 二次开发命令

```bash
# 安装依赖
npm install

# 开发模式（TypeScript 监听编译）
npm run dev

# 运行 CLI（构建后）
bin/mycodeai

```

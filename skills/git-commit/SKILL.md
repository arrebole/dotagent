---
name: git-commit
description: 生成 Linux 内核风格的 Git 提交信息。当用户明确调用 /git-commit 或输入"生成 git commit"等命令时使用。基于 git diff 分析改动，自动生成符合内核 SubmittingPatches 规范的提交信息（祈使语气、≤50/72 字符标题、72 字符断行正文、子系统前缀、Signed-off-by 标签）。
---

# Git Commit — Linux 内核风格提交信息生成

## 概述

生成 Linux 内核 `SubmittingPatches` 风格的 Git 提交信息。分析暂存区改动（`git diff --staged`），自动提取子系统前缀，生成祈使语气标题和结构化正文。

## 核心规则

生成提交信息时严格遵循以下规范：

1. **标题行**：祈使语气（"Fix bug"，非 "Fixed bug"/"Fixes bug"），以子系统前缀开头，优先控制在 ≤50 字符，硬上限 72 字符。
2. **标题后必须有且仅有一个空行**，然后进入正文。
3. **正文**：每行严格 ≤72 字符，建议按 **问题→方案→影响** 三部分组织（简单改动可省略）。
4. **正文末尾空一行**，然后追加 `Signed-off-by: Name <email>`（默认启用，可跳过）。

## 工作流

### 步骤 1：获取改动内容

1. 检查当前目录是否为 Git 仓库（`git rev-parse --git-dir`）。
2. 如果不是 Git 仓库：
   - 报错："当前目录不是 Git 仓库。请在 Git 项目中使用此命令，或者直接将 `git diff` 输出粘贴给我。"
   - 如果用户随后贴了 diff 内容，跳到步骤 2。
3. 如果是 Git 仓库：
   - 优先运行 `git diff --staged`（只看暂存区改动）。
   - 如果 `--staged` 为空，运行 `git diff`（fallback 到未暂存改动）。
   - 如果两者都为空：报错"当前没有暂存或未暂存的改动。请先 `git add` 要提交的文件。"
4. 如果 diff 输出超过约 200 行，采用分层策略：
   - 先运行 `git diff --stat` 获取文件范围和改动量概况。
   - 然后选择改动最集中的关键文件的完整 diff 进行细读。
   - 基于整体概览 + 关键细节生成提交信息。

### 步骤 2：分析改动内容

解析 diff 输出，提取以下信息：

- **改动的文件路径**：用来推断子系统前缀
- **改动的性质**：新增、修改、删除、重构、修复
- **改动的意图**：从代码变更推断本次提交想要达成的目标

**子系统前缀推断规则**：

1. 从改动文件路径的最顶层目录提取，例如：
   - `src/auth/login.py` → 子系统 `src/auth`，前缀 `auth:`
   - `drivers/net/ethernet/intel/e1000.c` → 前缀 `net: e1000:`
   - `Documentation/admin-guide/` → 前缀 `Documentation:`
   - `include/linux/sched.h` → 前缀 `include: sched:`
2. 取改动涉及的最顶层公共目录作为前缀。
3. 如果改动涉及 ≥3 个不同的顶层子系统（目录），**建议用户拆分为多个提交**。告知用户："你的改动涉及 X 个不同子系统（xxx, yyy, zzz）。Linux 最佳实践是每个提交只做一件事、只改一个子系统。建议拆分为独立提交。"
   - 如果用户坚持合并在一个提交，使用改动最多的目录作为前缀。

### 步骤 3：生成提交信息

按以下模板生成：

```
<subsystem-prefix>: <imperative-one-line-summary>

<description of the problem (what was wrong)>
<description of the solution (what this change does and why)>
<description of the impact (what is fixed, any side effects to note)>

Signed-off-by: <author-name> <author-email>
```

**标题生成要点**：

- 必须以祈使动词开头（Fix, Add, Remove, Update, Refactor, Revert, Improve, Avoid, Prevent, Support, Enable, Disable）
- 动词首字母大写
- 不要以句号结尾
- 优先压缩在 50 字符内，允许放宽到 72 字符
- 示例：`auth: Fix null pointer dereference on empty token`
- 示例：`docs: Add setup guide for OAuth2 integration`
- 示例：`net: tcp: Prevent race in connect timeout handler`

**正文生成要点**：

- 使用中文作为主体编写正文，英文辅助。 
- 每行严格 ≤72 字符，自动硬断行。绝不能出现超过 72 字符的行。
- 建议三段式（what → why → how），简单改动或 typo fix 可只有一段。
- 用普通现在时描述问题，用祈使语气描述方案。
- 不要使用 Markdown 格式（纯文本）。
- 避免冗长——正文的每一段都应当传达一个清晰的信息点。

**Signed-off-by 标签**：

1. 默认自动追加 `Signed-off-by`，从 `git config user.name` 和 `git config user.email` 获取姓名和邮箱。
2. 如果用户明确说"不加 Signed-off-by""--no-signoff"或类似措辞，则省略此标签。
3. Signed-off-by 前空一行，放在正文之后。

**Fixes 标签**：

- 仅在用户明确提供信息时追加。例如用户说"这个修复了 commit a1b2c3d"或"Fixes: #456"。
- 格式：`Fixes: <12-char-abbrev-commit-SHA> ("<original-commit-title>")` 或 `Fixes: #<issue-number>`。
- 放在 Signed-off-by 行之前。

### 步骤 4：输出

将生成的提交信息以代码块形式输出，并在代码块后附带一行简洁的使用提示。

输出示例：

```
这里是你生成的 Linux 风格提交信息：

    .gitignore: Add wildcard patterns for clientapi build artifacts

    现有的 .gitignore 文件仅覆盖了 Linux 二进制文件
    (clientapi-linux) 和裸二进制文件名 (clientapi)。其他
    平台二进制文件 (clientapi-darwin、clientapi-arm64) 以及
    打包产物 (clientapi.exe、clientapi.tar.gz) 并未被忽略。

    添加通配符模式 "clientapi-*" 以匹配所有平台特定的
    二进制文件，以及 "clientapi.*" 以覆盖打包产物和
    归档文件。

    Fixes: a1b2c3d4e5f6 ("mm: Optimize page reclaim locking")
    Signed-off-by: Zhang San <zs@example.com>

→ 复制后执行 `git commit -e`，在编辑器中粘贴即可使用。
```

## 禁止事项

- 在标题中使用过去式或第三人称（如 "Fixed""Fixes""Changed"）
- 标题以句号结尾
- 正文行超过 72 字符
- 使用 Markdown 格式（`**粗体**`、列表标记等）
- 在无改动时仍然生成提交信息
- 生成后自动执行 `git commit` 或修改任何文件

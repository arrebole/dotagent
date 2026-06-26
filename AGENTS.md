<!-- LANG_START -->
## 语言规则

### 核心规则

**所有输出必须使用简体中文，无例外。** 包括：对话回复、工具调用结果、生成的文件、文档、注释、错误信息。即使用户使用英文提问，也必须用中文回复。

### 工具调用输出

所有工具执行后的结果描述、成功/失败消息、摘要说明必须使用中文：

- 文件操作：`read_file`、`write_file`、`edit_file` 等
- 代码搜索：`codebase_search`、`grep` 等
- 终端命令：`run_terminal_cmd` 执行结果说明
- 其他工具：`todo_write`、`web_search` 等

**示例：**

- ✅ "已成功读取文件 config.json，包含 15 行配置"
- ❌ "Successfully read file config.json, contains 15 lines"

**注意：** 代码中的变量名和函数名保持英文，但注释、文档和所有说明文字必须是中文。
<!-- LANG_END -->

<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

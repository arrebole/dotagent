# Pi extensions

Pi extensions for **pi 1.5.2 or later** and **Node.js 22.19 or later**. The websearch extension uses native provider authentication and `@earendil-works/pi-schema`; older pi APIs and TypeBox schemas are not supported by this package.

## Install

```bash
pi install git:github.com/arrebole/dotagent
```

To select only websearch in `~/.pi/agent/settings.json`:

```json
{
  "packages": [
    {
      "source": "git:github.com/arrebole/dotagent",
      "extensions": ["extensions/websearch/index.ts"]
    }
  ]
}
```

## Web search Authentication

Use pi's native login commands inside a session:

```text
/login api.exa.ai/default
/login api.tavily.com/default
/login api.firecrawl.dev/default
```

Alternatively, set `EXA_API_KEY`, `TAVILY_API_KEY`, and/or `FIRECRAWL_API_KEY` before starting pi. Stored credentials take priority over environment variables. All providers appear in pi's login interface without adding chat models to the model selector.

Pi stores credentials in `~/.pi/agent/auth.json`:

```json
{
  "api.firecrawl.dev/default": {
    "type": "api_key",
    "key": "YOUR_FIRECRAWL_API_KEY"
  },
  "api.exa.ai/default": {
    "type": "api_key",
    "key": "YOUR_EXA_API_KEY"
  },
  "api.tavily.com/default": {
    "type": "api_key",
    "key": "YOUR_TAVILY_API_KEY"
  }
}
```
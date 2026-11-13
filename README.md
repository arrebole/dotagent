# dotagent

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

## Authentication

Use pi's native login commands inside a session:

```text
/login api.exa.ai/default
/login api.tavily.com/default
```

Alternatively, set `EXA_API_KEY` and/or `TAVILY_API_KEY` before starting pi. Stored credentials take priority over environment variables. Both providers appear in pi's login interface without adding chat models to the model selector.

Pi stores credentials in `~/.pi/agent/auth.json`:

```json
{
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

## Web search

The `websearch` tool accepts `provider` (`exa` or `tavily`) and a nonempty `query`. Common filters live at the top level; advanced options live under `options`. Unknown parameter names are rejected. Options belonging to the other provider are ignored.

Exa supports up to 100 results; Tavily supports up to 20. Tavily dates must use `YYYY-MM-DD`.

Each result includes source links. Output is limited to approximately 24 KiB and 240 lines, with excerpts limited to 2,000 characters per Exa page or 1,500 per Tavily page. Successful output is hidden until expanded; errors remain visible when collapsed.

## Development

```bash
npm install --ignore-scripts
npm run check
npm test
```

Tests exercise the installed pi loader, native authentication, parameter validation, provider request mapping and rendering. HTTP responses and credentials are simulated; tests do not call paid search APIs.

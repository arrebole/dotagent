

## PI use

### config auth.json
```json
{
  "api.exa.ai/default":{
    "type": "api_key",
    "key": ""
  },
  "api.tavily.com/default": {
    "type": "api_key",
    "key": ""
  }
}
```

### config settings.json
```json
{
  "packages": [
    {
      "source": "git:github.com/arrebole/dotagent",
      "extensions": [
        "extensions/websearch/index.ts",
        "extensions/subagent/index.ts"
      ]
    }
  ]
}
```
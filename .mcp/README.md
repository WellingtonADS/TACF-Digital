# MCP servers (local examples) ⚠️

- **Do not commit real secrets.** Keep secrets in `.env.mcp` or CI secrets (GitHub Actions). Never check in tokens.
- Copy `.env.mcp.example` → `.env.mcp` and fill `FIGMA_ACCESS_TOKEN`.

Example local server entry (use `mcp/servers.example.json` as a template):

```json
{
  "servers": {
    "local.figma": {
      "type": "process",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${env:FIGMA_ACCESS_TOKEN}"
      }
    }
  }
}
```

Run locally (PowerShell):

```powershell
$env:FIGMA_ACCESS_TOKEN = "<your_token>"
npx -y @modelcontextprotocol/server-figma
```

Or in Unix shells:

```bash
FIGMA_ACCESS_TOKEN=<your_token> npx -y @modelcontextprotocol/server-figma
```

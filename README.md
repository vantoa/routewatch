# routewatch

A CLI tool that diffs API route changes between Next.js app versions.

## Installation

```bash
npm install -g routewatch
```

## Usage

Run `routewatch` from the root of your Next.js project to compare API routes between two versions or branches:

```bash
# Compare current working tree against a git ref
routewatch diff --from main --to HEAD

# Compare two specific directories
routewatch diff --from ./v1 --to ./v2
```

Example output:

```
+ /api/users/[id]        (added)
- /api/posts/delete      (removed)
~ /api/auth/login        (method changed: GET → POST)
```

### Options

| Flag | Description |
|------|-------------|
| `--from` | Base version, git ref, or directory |
| `--to` | Target version, git ref, or directory |
| `--json` | Output results as JSON |
| `--silent` | Suppress output, exit code only |

## Requirements

- Node.js 16+
- A Next.js project using the `app/` or `pages/api/` directory

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)
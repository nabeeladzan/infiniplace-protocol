# InfiniPlace Protocol

Shared TypeScript types and helpers that define the protocol between InfiniPlace
clients and servers. Keep this package in sync with any breaking protocol
changes and publish a new version before updating the server or UI.

## Development

```bash
pnpm install
pnpm run build
```

The build command emits ESM JavaScript and type declarations into `dist/`.

## Publishing

1. Bump the version in `package.json`.
2. `pnpm run build`
3. `pnpm publish --access public`

Consumers should depend on `@infiniplace/protocol` and import from the package
root.

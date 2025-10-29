# DecaNotes

A decentralized markdown editor with block-based architecture supporting multiple storage backends including Sia Renterd and IPFS. Features real-time markdown editing, drag & drop functionality, and cross-platform compatibility.

## Build & Run

1. Install dependencies

   ```bash
   bun install
   ```

2. Start development server (uses Expo Go by default)
   ```bash
   bun run start
   ```
3. Run on devices

   ```bash
   # iOS (development build)
   bun run ios

   # Android (development build)
   bun run android
   ```

4. Build locally for production

   ```bash
   # iOS production build
   eas build --platform ios --profile production --local

   # Android production build
   eas build --platform android --profile production --local
   ```

## Development

### Type checking

Check TypeScript compilation:

```bash
# Type check
bun run tsc --noEmit

# Watch mode
bun run tsc --noEmit --watch
```

### Testing

```bash
# Run tests
bun run test
```

### Linting

```bash
# Check for issues
bun run lint

# Auto-fix issues
bun run format
```

## Features

- Block-based markdown editor with real-time rendering
- Multiple storage backends (Local, Renterd, IPFS-ready)
- Dark/light theme support
- Cross-platform (iOS, Android, Web)

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

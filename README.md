# playwright-automation-generator

Generate enterprise-grade Playwright automation frameworks with opinionated architecture, modular templates, and AI-ready design.

## Documentation

| Document                                     | Description                                    |
| -------------------------------------------- | ---------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, components, generation pipeline |
| [docs/DECISIONS.md](docs/DECISIONS.md)       | Chronological log of technical decisions       |
| [docs/ROADMAP.md](docs/ROADMAP.md)           | Milestone progress and upcoming work           |
| [docs/CHANGELOG.md](docs/CHANGELOG.md)       | User-visible changes per milestone             |
| [docs/adr/](docs/adr/)                       | Architecture Decision Records                  |

## Quick Start

```bash
npm install
npm run build
node dist/cli/index.js new --name "My App" --org "My Org" --app "MyApp" --output ../my-framework
```

## Roadmap

- [x] Framework Generator MVP
- [x] Template Engine
- [x] Enterprise Core
- [ ] Authentication Module
- [ ] API Module
- [ ] Database Module
- [ ] Reporting Module
- [ ] Azure DevOps Pipeline Generator
- [ ] AI Test Author
- [ ] Framework Upgrade Engine

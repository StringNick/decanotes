# Markdown Showcase :rocket:

This document demonstrates all supported Markdown features in DecaNotes.

## Headings with Custom IDs {#headings}

Regular headings and headings with custom IDs for deep linking:

### Level 3 Heading {#level-3}
#### Level 4 Heading {#level-4}
##### Important Section {#important}

## Text Formatting

**Bold text** using double asterisks or __double underscores__

*Italic text* using single asterisks or _single underscores_

***Bold and italic*** combined

`Inline code` with backticks

~~Strikethrough text~~ for deleted content

==Highlighted text== for important notes

## Subscript and Superscript

Chemical formula: H~2~O (water)

Mathematical expression: E=mc^2^

CO~2~ emissions and 10^6^ calculations

## Emoji Support :tada:

Common emojis: :smile: :heart: :rocket: :fire: :star:

Reactions: :thumbsup: :thumbsdown: :clap: :pray:

Symbols: :white_check_mark: :x: :warning: :bulb: :bell:

Tech: :computer: :iphone: :email: :package: :bug:

## Lists

### Unordered Lists

- First item
- Second item
  - Nested item 1
  - Nested item 2
- Third item

### Ordered Lists

1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Third step

### Checklists

- [ ] Unchecked task
- [x] Completed task
- [ ] Another pending task
- [x] Another completed task

## Quotes

> Simple quote on one line

> Multi-line quote
> that continues here
> and here

>> Nested quote level 2

>>> Triple nested quote

## Code Blocks

### JavaScript
```javascript
function hello(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

### Python
```python
def calculate_sum(a, b):
    """Calculate sum of two numbers"""
    return a + b

result = calculate_sum(5, 3)
print(f"Result: {result}")
```

### TypeScript
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const createUser = (data: User): User => {
  return { ...data };
};
```

## Callouts (GitHub-style alerts)

> [!NOTE]
> This is a note callout with useful information

> [!TIP]
> This is a tip callout with helpful advice

> [!INFO]
> This is an info callout with general information

> [!WARNING]
> This is a warning callout - be careful!

> [!DANGER]
> This is a danger callout - critical warning!

## Tables

### Simple Table

| Name | Age | City |
| --- | --- | --- |
| Alice | 30 | New York |
| Bob | 25 | London |
| Charlie | 35 | Tokyo |

### Table with Alignment

| Left | Center | Right |
| :--- | :---: | ---: |
| Text | Text | Text |
| A | B | C |
| 1 | 2 | 3 |

### Complex Table

| Feature | Status | Priority | Notes |
| --- | --- | --- | --- |
| Authentication | ✅ Complete | High | OAuth integration |
| Dashboard | 🚧 In Progress | High | UI redesign |
| Analytics | ⏳ Planned | Medium | Data collection |
| Settings | ✅ Complete | Low | User preferences |

## Images

![Sample Image](https://via.placeholder.com/400x200 "Image with caption")

![Landscape](https://via.placeholder.com/600x300)

## Footnotes

Here is a simple footnote[^1] with a reference.

You can also use named footnotes[^note] for better organization.

Multiple references to the same footnote[^1] are supported.

Automatic URL linking works too: Visit https://github.com or check http://example.com for more info.

[^1]: This is the first footnote definition.

[^note]: Named footnotes are useful for longer documents.

## Definition Lists

Markdown
: A lightweight markup language for creating formatted text

DecaNotes
: A note-taking application built with React Native and Expo

IPFS
: InterPlanetary File System for decentralized storage

TypeScript
: A typed superset of JavaScript that compiles to plain JavaScript

## Dividers

Use three dashes, asterisks, or underscores:

---

Content after divider

***

Another section

___

## Mixed Formatting Examples

### Code with Emoji
Here's some code :computer: with emoji support :sparkles:

```bash
npm install :package:
npm run dev :rocket:
```

### Formatted Text in Lists

1. **Bold item** with emphasis
2. *Italic item* for style
3. `Code item` for technical terms
4. ~~Crossed out~~ completed item
5. ==Highlighted== important item

### Complex Paragraph

This paragraph contains **bold**, *italic*, `code`, ~~strikethrough~~, and ==highlighted== text. You can also use H~2~O and E=mc^2^ for scientific notation. Don't forget emoji :smile: :heart: :rocket:!

## Nested Structures

### Lists in Quotes

> **Important checklist:**
> - [x] Review documentation
> - [x] Test all features
> - [ ] Deploy to production

### Code in Lists

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the application:
   ```bash
   npm start
   ```

### Tables in Callouts

> [!TIP]
> Quick reference table:
> 
> | Shortcut | Action |
> | --- | --- |
> | Cmd+B | Bold |
> | Cmd+I | Italic |
> | Cmd+K | Code |

## Real-world Example

### Project Setup Guide

Follow these steps to set up the project:

1. **Clone the repository**
   ```bash
   git clone https://github.com/user/project.git
   cd project
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment**
   
   Create a `.env` file:
   ```env
   API_KEY=your_api_key
   DATABASE_URL=postgresql://localhost:5432/db
   ```

4. **Run tests** :white_check_mark:
   ```bash
   bun run test
   ```

> [!WARNING]
> Make sure to set up your environment variables before running the application!

5. **Start development server** :rocket:
   ```bash
   bun run start
   ```

### Expected Output

| Step | Status | Time |
| :--- | :---: | ---: |
| Clone | ✅ | 2min |
| Install | ✅ | 5min |
| Configure | ✅ | 1min |
| Test | ✅ | 3min |
| Start | ✅ | 1min |

---

## Summary

This document showcases all supported Markdown features:

- [x] Headings (H1-H6)
- [x] Text formatting (bold, italic, code, strikethrough, highlight)
- [x] Subscript and superscript
- [x] Emoji shortcodes
- [x] Lists (unordered, ordered, nested)
- [x] Checklists
- [x] Quotes (single and nested)
- [x] Code blocks with syntax highlighting
- [x] Callouts (note, tip, info, warning, danger)
- [x] Tables with alignment
- [x] Images with captions
- [x] Footnotes
- [x] Definition lists
- [x] Dividers
- [x] Mixed and nested structures

**Total features**: 15+ :tada:

Happy note-taking with DecaNotes! :notebook: :sparkles:

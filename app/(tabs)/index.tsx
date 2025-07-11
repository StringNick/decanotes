import type { MarkdownStyle } from '@expensify/react-native-live-markdown';
import { MarkdownTextInput, parseExpensiMark } from '@expensify/react-native-live-markdown';
import React from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';

const FONT_FAMILY_MONOSPACE = Platform.select({
  ios: 'Courier',
  default: 'monospace',
});

const FONT_FAMILY_EMOJI = Platform.select({
  ios: 'System',
  android: 'Noto Color Emoji',
  default: 'System, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji',
});

const markdownStyle: MarkdownStyle = {
  syntax: {
    color: 'gray',
  },
  link: {
    color: 'blue',
  },
  h1: {
    fontSize: 25,
  },
  emoji: {
    fontSize: 20,
    fontFamily: FONT_FAMILY_EMOJI,
  },
  blockquote: {
    borderColor: 'gray',
    borderWidth: 6,
    marginLeft: 6,
    paddingLeft: 6,
  },
  code: {
    fontFamily: FONT_FAMILY_MONOSPACE,
    fontSize: 10,
    color: 'black',
    backgroundColor: 'lightgray',
  },
  pre: {
    fontFamily: FONT_FAMILY_MONOSPACE,
    fontSize: 20,
    color: 'black',
    backgroundColor: 'lightgray',
  },
  mentionHere: {
    color: 'green',
    backgroundColor: 'lime',
  },
  mentionUser: {
    color: 'blue',
    backgroundColor: 'cyan',
  },
};

var initialMarkdownContent = `# Markdown Examples

## Headers
# H1
## H2
### H3
#### H4
##### H5
###### H6

## Text Formatting
*Italic text*  
**Bold text**  
~~Strikethrough~~  
**Bold and _nested italic_**  
***All bold and italic***

## Lists
### Ordered List
1. First item
2. Second item
3. Third item

### Unordered List
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2

### Task List
- [x] Completed task
- [ ] Pending task

## Links and Images
[Visit Google](https://www.google.com)  
![Alt text](https://via.placeholder.com/150 "Optional title")

## Blockquotes
> This is a blockquote.
> It can span multiple lines.

## Code
### Inline code
Use \`fmt.Println(\"Hello, World!\")\` for printing in Go.

### Code block with syntax highlighting
\`\`\`go
package main

import (
    \"fmt\"
    \"log\"
    \"context\"
    \"os\"
    \"golang.org/x/exp/slog\"
)

type User struct {
    ID    int
    Name  string
    Email string
}

func main() {
    // Initialize logger
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
    
    // Create a new context
    ctx := context.Background()
    
    // Add context values
    ctx = context.WithValue(ctx, \"request_id\", \"abc123\")
    
    // Example user data
    user := User{
        ID:    1,
        Name:  \"John Doe\",
        Email: \"john@example.com\",
    }
    
    // Log with context
    logger.InfoCtx(ctx, \"User logged in\", \"user\", user)
    
    // Log with additional fields
    logger.Info(\"Processing request\", \"path\", \"/api/users\", \"method\", \"GET\")
    
    // Error logging
    if err := someFunction(); err != nil {
        logger.Error(\"Operation failed\", \"error\", err)
    }
}

func someFunction() error {
    return fmt.Errorf(\"something went wrong\")
}
\`\`\`

## Tables
| Name  |    Type     |  Value   |  json   |
| :---: | :---------: | :------: | :-----: |
|  Key  |   string    |   ключ   |  "key"  |
| Value | interface{} | значение | "value" |

## Horizontal Rule
---

## Footnotes
Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.

## Definition Lists
Term 1
: Definition 1

Term 2
: Definition 2

## Strikethrough
~~This text is struck through.~~

## Emoji
:smile: :heart: :rocket:

## Checkboxes
- [x] Task 1
- [ ] Task 2
- [ ] Task 3
`;

export default function HomeScreen() {
  const [value, setValue] = React.useState(initialMarkdownContent);

  return (
    <ScrollView style={{ padding: 16 }}>
      <MarkdownTextInput
        value={value}
        multiline={true}
        onChangeText={setValue}
        style={styles.input}
        parser={parseExpensiMark}
        markdownStyle={markdownStyle}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  content: {
    marginTop: 60,
  },
  input: {
    fontSize: 13,
    width: '100%',
    padding: 5,
    borderColor: 'gray',
    borderWidth: 1,
    textAlignVertical: 'top',
    backgroundColor: 'white',
  },
  text: {
    fontFamily: 'Courier New',
    marginTop: 10,
    height: 100,
  },
});
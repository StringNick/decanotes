import {
  EditorJSData,
  Renderer as Renderer2,
  RendererAppearance,
  RendererConfig
} from '@biblebytes/editorjs-renderer-react-native';
import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import type { RendererInterface } from "react-native-marked";
import { Renderer } from "react-native-marked";
import { ViewStyle } from 'react-native/Libraries/StyleSheet/StyleSheetTypes';


const data: EditorJSData = {
  blocks: [{
    id: "header-1",
    type: "header",
    data: {
      text: "Header 1",
      level: 1,
    },
  }]
};

const config: RendererConfig = {
  enableFallback: false
};


class CustomRenderer extends Renderer implements RendererInterface {
  constructor() {
    super();
  }

  text(text: string | ReactNode[], styles?: TextStyle): ReactNode {
    if (typeof text === 'string') {
      console.log('text', styles);
      return (
        <TextInput
          value={text}
          editable={false}
          multiline
          style={{ ...styles, color: 'white' }}
          selectionColor="rgba(0, 122, 255, 0.3)"
        />
      );
    }

    for (let i = 0; i < text.length; i++) {
      console.log(text[i], typeof text[i]);
    }

    return (
      <>
        {text}
      </>
    );
  }

  heading(text: string | ReactNode[], styles?: TextStyle): ReactNode {
    // Convert ReactNode array to string if needed
    const textValue = Array.isArray(text)
      ? text.map(node => typeof node === 'string' ? node : '').join('')
      : String(text);

    return (
      <TextInput
        value={textValue}
        editable={false}
        multiline
        style={styles}
        selectionColor="rgba(0, 122, 255, 0.3)"
      />
    );
  }

  code(text: string, _language?: string, containerStyle?: ViewStyle, textStyle?: TextStyle): ReactNode {
    return (
      <View style={containerStyle}>
        <TextInput
          value={text}
          editable={false}
          multiline

          style={{
            ...textStyle,
          }}
          // style={containerStyle}
          selectionColor="rgba(0, 122, 255, 0.3)"
        />
      </View>
    )
  }

  codespan(text: string, _styles?: TextStyle): ReactNode {
    // Convert ReactNode array to string if needed
    const textValue = Array.isArray(text)
      ? text.map(node => typeof node === 'string' ? node : '').join('')
      : String(text);

    return (
      <TextInput
        value={textValue}
        editable={false}
        multiline
      // style={styles}xx
      // selectionColor="rgba(0, 122, 255, 0.3)"
      />
    );
  }


}

const renderer = new CustomRenderer();

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
    <>
      {/* <Markdown
        value={value}
        flatListProps={{
          initialNumToRender: 8,
        }}
        renderer={renderer}
      /> */}
      <ScrollView>
        <Text style={{ color: 'white' }}>{value}</Text>
        <Renderer2
          data={data}
          config={config}
          appearance={RendererAppearance.light}
        />
      </ScrollView>

    </>
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
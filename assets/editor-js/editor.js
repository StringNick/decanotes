document.addEventListener('DOMContentLoaded', function() {
  const editor = new EditorJS({
    holder: 'editorjs',
    placeholder: 'Start writing your content here...',
    autofocus: true,
    tools: {
      header: {
        class: Header,
        inlineToolbar: true,
        config: {
          placeholder: 'Enter a header',
          levels: [2, 3, 4],
          defaultLevel: 2
        }
      },
    //   list: {
    //     class: List,
    //     inlineToolbar: true,
    //   },
      image: {
        class: ImageTool,
        config: {
          endpoints: {
            byFile: 'https://your-image-upload-endpoint.com/upload',
          }
        }
      }
    },
    onReady: () => {
      console.log('Editor.js is ready to work!');
      // Notify React Native that the editor is ready
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'editor:ready',
          data: { status: 'ready' }
        }));
      }
    },
    onChange: (api, event) => {
      // You can add change handling here if needed
      console.log('Content changed');
    }
  });

  // Handle messages from React Native
  window.addEventListener('message', function(event) {
    try {
      const message = JSON.parse(event.data);
      
      if (message.type === 'getContent') {
        editor.save().then((output) => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'content',
              data: output
            }));
          }
        });
      }
      
      if (message.type === 'setContent' && message.data) {
        editor.blocks.render(message.data);
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  });
});

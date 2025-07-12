import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const EditorJSWebView = () => {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { height: windowHeight } = useWindowDimensions();
  
  // Calculate the available height for the WebView
  // Add extra padding to ensure content doesn't overflow
  const bottomSafeArea = insets.bottom > 0 ? insets.bottom : 20;
  const webViewHeight = windowHeight - insets.top - tabBarHeight - bottomSafeArea;
  
  // HTML content for the editor with proper bottom padding
  const editorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>Editor.js</title>
      <script src="https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest"></script>
      <script src="https://cdn.jsdelivr.net/npm/@editorjs/header@latest"></script>
      <script src="https://cdn.jsdelivr.net/npm/@editorjs/list@latest"></script>
      <script src="https://cdn.jsdelivr.net/npm/@editorjs/image@latest"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        #editorjs {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          max-width: 800px;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div id="editorjs"></div>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const editor = new EditorJS({
            holder: 'editorjs',
            placeholder: 'Start writing your content here...',
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
              },
              // Add more tools as needed
            },
            onReady: () => {
              console.log('Editor.js is ready to work!');
            },
            onChange: (api, event) => {
              console.log('Content changed');
            }
          });
        });
      </script>
    </body>
    </html>
  `;

    // Calculate container height by subtracting bottom insets
    const containerHeight = windowHeight - insets.bottom;
    
    return (
      <View style={[styles.container, { paddingTop: insets.top, height: containerHeight }]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <View style={styles.webviewContainer}>
          <WebView
            source={{ 
              html: editorHtml.replace(
                '<div id="editorjs"></div>', 
                `<div id="editorjs" style="padding-bottom: ${tabBarHeight + insets.bottom + 60}px"></div>`
              )
            }}
            style={[styles.webview, { height: webViewHeight, maxHeight: webViewHeight }]}
            scrollEnabled={true}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            contentInset={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            onError={(e) => console.log(e)}
          />
        </View>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
    paddingBottom: 16, // Extra padding at the bottom
  },
  webview: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        // iOS-specific styles
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        marginTop: StatusBar.currentHeight || 0,
        elevation: 2,
      },
    }),
  },
});

export default EditorJSWebView;

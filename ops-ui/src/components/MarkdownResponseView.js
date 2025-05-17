import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Box, Paper, Typography } from '@mui/material';

const MarkdownResponseView = ({ content }) => {
  // Filter out content within <think></think> tags using string methods instead of regex
  let filteredContent = content;
  const startTag = "<think>";
  const endTag = "</think>";
  
  let startIndex = filteredContent.indexOf(startTag);
  let endIndex = filteredContent.indexOf(endTag);
  
  // Remove all occurrences of <think>...</think>
  while (startIndex !== -1 && endIndex !== -1) {
    // +7 to include the closing tag length "</think>"
    filteredContent = filteredContent.substring(0, startIndex) + filteredContent.substring(endIndex + endTag.length);
    
    // Check for more occurrences
    startIndex = filteredContent.indexOf(startTag);
    endIndex = filteredContent.indexOf(endTag);
  }
  
  // Trim any excess whitespace
  filteredContent = filteredContent.trim();
  
  return (
    <Box sx={{ mb: 4 }}>
      <Paper
        elevation={2}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: '#f8fcff',
          border: '1px solid #bbdefb',
        }}
      >
        <Typography variant="h6" gutterBottom color="#4285F4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Response
        </Typography>
        
        <Box 
          sx={{ 
            '& pre': { mt: 2, mb: 2 },
            '& code': { 
              backgroundColor: '#f5f5f5', 
              px: 1, 
              py: 0.5, 
              borderRadius: 1,
              fontFamily: 'monospace'
            },
            '& a': { color: '#4285F4' },
            '& img': { maxWidth: '100%' },
            '& blockquote': { 
              borderLeft: '4px solid #bbdefb', 
              pl: 2, 
              ml: 0,
              color: 'text.secondary' 
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': { 
              color: '#333',
              fontWeight: 'bold',
              mt: 2,
              mb: 1
            },
            '& ul, & ol': { pl: 3 },
            '& table': { 
              borderCollapse: 'collapse', 
              width: '100%',
              my: 2
            },
            '& th, & td': { 
              border: '1px solid #ddd',
              p: 1 
            },
            '& th': { 
              backgroundColor: '#f2f2f2',
              fontWeight: 'bold'
            }
          }}
        >
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={materialLight}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {filteredContent}
          </ReactMarkdown>
        </Box>
      </Paper>
    </Box>
  );
};

export default MarkdownResponseView; 
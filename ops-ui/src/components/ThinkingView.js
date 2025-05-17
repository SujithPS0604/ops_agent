import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';

const ThinkingView = ({ content }) => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ mb: 4, mt: 3 }}>
      <Accordion 
        expanded={expanded} 
        onChange={handleChange}
        sx={{
          borderRadius: '8px !important',
          '&:before': {
            display: 'none',
          },
          boxShadow: expanded ? '0px 3px 6px rgba(0,0,0,0.1)' : 'none',
          border: '1px solid #E1F5FE',
          overflow: 'hidden',
          bgcolor: '#F3F9FF'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: '#4285F4' }} />}
          sx={{
            minHeight: '48px',
            '& .MuiAccordionSummary-content': {
              margin: '12px 0',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon sx={{ color: '#4285F4', mr: 1.5 }} />
            <Typography sx={{ fontWeight: 'medium', color: '#4285F4' }}>
              Thinking Process
            </Typography>
            <Chip 
              label={expanded ? "Hide" : "View"} 
              size="small" 
              variant="outlined"
              sx={{ 
                ml: 2, 
                fontSize: '0.7rem', 
                height: '20px',
                borderColor: '#4285F4',
                color: '#4285F4'
              }} 
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 1.5,
              bgcolor: 'white',
              borderColor: '#E1F5FE',
              maxHeight: '400px',
              overflow: 'auto'
            }}
          >
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.5
              }}
            >
              {content}
            </Typography>
          </Paper>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ThinkingView; 
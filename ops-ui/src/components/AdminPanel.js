import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  Slider,
  TextField,
  Typography,
  Alert,
  IconButton,
  Collapse,
  Tabs,
  Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TestDataGenerator from '../services/TestDataGenerator';
import DLQViewer from './DLQViewer';
import OpenSearchViewer from './OpenSearchViewer';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      style={{ display: value === index ? 'block' : 'none' }}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      aria-hidden={value !== index}
      {...other}
    >
      <Box sx={{ pt: 3 }}>
        {children}
      </Box>
    </div>
  );
}

const AdminPanel = () => {
  const [dlqCount, setDlqCount] = useState(1);
  const [osCount, setOsCount] = useState(1);
  const [eventType, setEventType] = useState('error');
  const [loading, setLoading] = useState({ dlq: false, os: false });
  const [result, setResult] = useState({ success: false, message: '', open: false });
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleGenerateDLQ = async () => {
    setLoading({ ...loading, dlq: true });
    try {
      const response = await TestDataGenerator.generateDLQMessages(dlqCount);
      setResult({ 
        success: true, 
        message: `Successfully generated ${response.count || dlqCount} DLQ messages`, 
        open: true 
      });
    } catch (error) {
      setResult({ 
        success: false, 
        message: error.message || 'Failed to generate DLQ messages', 
        open: true 
      });
    } finally {
      setLoading({ ...loading, dlq: false });
    }
  };

  const handleGenerateOpenSearch = async () => {
    setLoading({ ...loading, os: true });
    try {
      const response = await TestDataGenerator.generateOpenSearchEvents(osCount, eventType);
      setResult({ 
        success: true, 
        message: `Successfully generated ${response.count || osCount} OpenSearch ${eventType} events`, 
        open: true 
      });
    } catch (error) {
      setResult({ 
        success: false, 
        message: error.message || 'Failed to generate OpenSearch events', 
        open: true 
      });
    } finally {
      setLoading({ ...loading, os: false });
    }
  };

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardHeader 
        title="Admin Panel" 
        titleTypographyProps={{ variant: 'h6' }}
        sx={{ bgcolor: '#E8F0FE', color: '#4285F4' }}
      />

      <CardContent>
        <Collapse in={result.open}>
          <Alert
            severity={result.success ? "success" : "error"}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setResult({ ...result, open: false })}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {result.message}
          </Alert>
        </Collapse>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="admin panel tabs">
            <Tab label="Generate Test Data" />
            <Tab label="View DLQ Messages" />
            <Tab label="View OpenSearch Logs" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* DLQ Generator */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #E0E0E0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Generate DLQ Messages
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography id="dlq-count-slider" gutterBottom>
                    Message Count: {dlqCount}
                  </Typography>
                  <Slider
                    value={dlqCount}
                    onChange={(_, newValue) => setDlqCount(newValue)}
                    aria-labelledby="dlq-count-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={10}
                  />
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGenerateDLQ}
                  disabled={loading.dlq}
                  fullWidth
                >
                  {loading.dlq ? <CircularProgress size={24} /> : "Generate DLQ Messages"}
                </Button>
              </Box>
            </Grid>

            {/* OpenSearch Generator */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #E0E0E0', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Generate OpenSearch Events
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography id="os-count-slider" gutterBottom>
                    Event Count: {osCount}
                  </Typography>
                  <Slider
                    value={osCount}
                    onChange={(_, newValue) => setOsCount(newValue)}
                    aria-labelledby="os-count-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={1}
                    max={10}
                  />
                </Box>
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <FormLabel component="legend">Event Type</FormLabel>
                  <RadioGroup
                    row
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    <FormControlLabel value="error" control={<Radio />} label="Error" />
                    <FormControlLabel value="warn" control={<Radio />} label="Warning" />
                    <FormControlLabel value="info" control={<Radio />} label="Info" />
                  </RadioGroup>
                </FormControl>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleGenerateOpenSearch}
                  disabled={loading.os}
                  fullWidth
                >
                  {loading.os ? <CircularProgress size={24} /> : "Generate OpenSearch Events"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <DLQViewer />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <OpenSearchViewer />
        </TabPanel>
      </CardContent>
    </Card>
  );
};

export default AdminPanel; 
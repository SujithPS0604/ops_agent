import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Collapse,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TestDataGenerator from '../services/TestDataGenerator';

const DLQViewer = () => {
  const [dlqData, setDlqData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  const fetchAllMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TestDataGenerator.fetchAllDLQMessages();
      setDlqData(response.dlqs || []);
      if (response.totalMessages === 0) {
        setError('No messages found in any DLQs');
        setAlertOpen(true);
      }
    } catch (err) {
      setError(err.message);
      setAlertOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMessages();
  }, []);

  const toggleRow = (queueName, id) => {
    setExpandedRows({
      ...expandedRows,
      [`${queueName}-${id}`]: !expandedRows[`${queueName}-${id}`]
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">All DLQ Messages</Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          onClick={fetchAllMessages}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Collapse in={alertOpen}>
        <Alert
          severity={error ? "warn" : "info"}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setAlertOpen(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {error || "DLQ messages loaded successfully"}
        </Alert>
      </Collapse>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <div>
          {dlqData.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">No DLQ data found</Typography>
            </Paper>
          ) : (
            dlqData.map((dlq) => (
              <Accordion key={dlq.queueName} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">
                      <Badge badgeContent={dlq.count} color="primary" sx={{ mr: 2 }}>
                        <Chip 
                          label={dlq.queueName} 
                          color={dlq.success ? "primary" : "error"}
                          variant="outlined"
                          sx={{ mr: 2 }}
                        />
                      </Badge>
                      {dlq.source && <Chip label={`Source: ${dlq.source}`} size="small" variant="outlined" />}
                    </Typography>
                    {!dlq.success && (
                      <Typography variant="body2" color="error">
                        {dlq.error}
                      </Typography>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {dlq.count > 0 ? (
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Event Id</TableCell>
                            <TableCell>Trace Id</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dlq.messages.map((message) => (
                            <React.Fragment key={`${dlq.queueName}-${message.id || message.eventId}`}>
                              <TableRow 
                                hover 
                                onClick={() => toggleRow(dlq.queueName, message.id || message.eventId)}
                                sx={{ cursor: 'pointer' }}
                              >
                                <TableCell>{message.type}</TableCell>
                                <TableCell>{message.eventTime}</TableCell>
                                <TableCell>{message.eventId}</TableCell>
                                <TableCell>{message.traceId}</TableCell>
                                <TableCell>
                                  <Button 
                                    size="small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRow(dlq.queueName, message.id || message.eventId);
                                    }}
                                  >
                                    {expandedRows[`${dlq.queueName}-${message.id || message.eventId}`] ? 'Hide' : 'Details'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {expandedRows[`${dlq.queueName}-${message.id || message.eventId}`] && (
                                <TableRow>
                                  <TableCell colSpan={5} sx={{ backgroundColor: '#f9f9f9' }}>
                                    <Box sx={{ p: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom>Event</Typography>
                                      <Paper variant="outlined" sx={{ p: 2, background: '#f5f5f5' }}>
                                        <Typography variant="body2" component="div">
                                          <strong>Event ID:</strong> {message.eventId || 'N/A'}<br />
                                          <strong>Trace ID:</strong> {message.traceId || 'N/A'}<br />
                                          <strong>Event Time:</strong> {message.eventTime || 'N/A'}<br />
                                          <strong>Type:</strong> {message.type || 'N/A'}<br />
                                          <strong>Version:</strong> {message.version || 'N/A'}<br />
                                          <strong>Data:</strong> {JSON.stringify(message.data) || 'N/A'}<br />
                                        </Typography>
                                      </Paper>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ p: 2, textAlign: 'center' }}>
                      No messages found in this queue
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </div>
      )}
    </Box>
  );
};

export default DLQViewer; 
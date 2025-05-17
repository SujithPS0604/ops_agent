import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import TestDataGenerator from '../services/TestDataGenerator';

const getLevelColor = (level) => {
  switch (level?.toUpperCase()) {
    case 'ERROR':
      return 'error';
    case 'WARN':
      return 'warn';
    case 'INFO':
      return 'success';
    default:
      return 'default';
  }
};

const OpenSearchViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [levelFilter, setLevelFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TestDataGenerator.fetchOpenSearchLogs(levelFilter);
      setLogs(response.logs || []);
      if (response.count === 0) {
        setError('No logs found in OpenSearch');
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
    fetchLogs();
  }, [levelFilter]);

  const toggleRow = (id) => {
    setExpandedRows({
      ...expandedRows,
      [id]: !expandedRows[id]
    });
  };

  const handleLevelChange = (event) => {
    setLevelFilter(event.target.value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">OpenSearch Logs</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="level-filter-label">Level</InputLabel>
            <Select
              labelId="level-filter-label"
              id="level-filter"
              value={levelFilter}
              onChange={handleLevelChange}
              label="Level"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>
          <Button 
            startIcon={<RefreshIcon />} 
            variant="outlined" 
            onClick={fetchLogs}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
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
          {error || "OpenSearch logs loaded successfully"}
        </Alert>
      </Collapse>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Level</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Event ID</TableCell>
                <TableCell>Trace ID</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id || log.event_id}>
                    <TableRow 
                      hover 
                      onClick={() => toggleRow(log.id || log.event_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Chip 
                          label={log.level} 
                          size="small"
                          color={getLevelColor(log.level)}
                        />
                      </TableCell>
                      <TableCell>{log.service}</TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message}
                      </TableCell>
                      <TableCell>{new Date(log['@timestamp']).toLocaleString()}</TableCell>
                      <TableCell>{log.status_code}</TableCell>
                      <TableCell>{log.event_id}</TableCell>
                      <TableCell>{log.trace_id}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(log.id || log.event_id);
                          }}
                        >
                          {expandedRows[log.id || log.event_id] ? 'Hide' : 'Details'}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedRows[log.id || log.event_id] && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ backgroundColor: '#f9f9f9' }}>
                          <Box sx={{ p: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Log Details</Typography>
                            <Paper variant="outlined" sx={{ p: 2, mb: 2, background: '#f5f5f5' }}>
                              <Typography variant="body2" component="div">
                                <strong>Message:</strong> {log.message}<br />
                                <strong>Service:</strong> {log.service}<br />
                                <strong>Level:</strong> {log.level}<br />
                                <strong>Timestamp:</strong> {new Date(log['@timestamp']).toLocaleString()}<br />
                                <strong>Status Code:</strong> {log.status_code}<br />
                                <strong>Duration:</strong> {log.duration_ms}ms<br />
                                <strong>User ID:</strong> {log.user_id}<br />
                                <strong>Event ID:</strong> {log.event_id}<br />
                                <strong>Trace ID:</strong> {log.trace_id}<br />
                                <strong>Request ID:</strong> {log.request_id}
                              </Typography>
                            </Paper>
                            
                            <Typography variant="subtitle2" gutterBottom>Metadata</Typography>
                            <Paper variant="outlined" sx={{ p: 2, background: '#f5f5f5' }}>
                              <Typography variant="body2" component="div">
                                <strong>Environment:</strong> {log.metadata?.environment || 'N/A'}<br />
                                <strong>Region:</strong> {log.metadata?.region || 'N/A'}<br />
                                <strong>Version:</strong> {log.metadata?.version || 'N/A'}
                              </Typography>
                            </Paper>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default OpenSearchViewer; 
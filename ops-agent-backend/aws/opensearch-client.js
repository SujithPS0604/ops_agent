import { search } from './os-client.js';

/**
 * Get logs from OpenSearch
 * @param {string} indexName - The index to search
 * @param {string} level - Log level to filter by (optional)
 * @param {number} size - Maximum number of logs to return
 * @returns {Promise<Array>} - Array of log entries
 */
const getOpenSearchLogs = async (indexName = 'cwl-logs', level = null, size = 50) => {
  try {
    console.log(`Searching logs in index: ${indexName}, level: ${level || 'all'}, size: ${size}`);
    
    // Build query
    let query = { match_all: {} };
    
    // If level is specified, filter by it
    if (level) {
      query = {
        bool: {
          must: [
            { term: { level: level.toUpperCase() } }
          ]
        }
      };
    }
    
    // Perform search
    const results = await search(indexName, query, size);
    console.log(`Found ${results.length} logs`);
    
    return { 
      logs: results,
      count: results.length
    };
  } catch (error) {
    console.error(`Error searching logs in index ${indexName}:`, error);
    throw error;
  }
};

export { getOpenSearchLogs }; 
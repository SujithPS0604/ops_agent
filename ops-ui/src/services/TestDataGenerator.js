import axios from 'axios';

class TestDataGenerator {
  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  }

  async generateDLQMessages(count = 1) {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/generate/dlq`, {
        count: count
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async generateOpenSearchEvents(count = 1, eventType = 'error') {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/api/generate/opensearch`, {
        count: count,
        eventType: eventType
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  async fetchDLQMessages() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/dlq/messages`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  async fetchAllDLQMessages() {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/dlq/all-messages`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  async fetchOpenSearchLogs(level = null, indexName = 'cwl-logs', size = 50) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/api/opensearch/logs`, {
        params: { level, indexName, size }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error('Error generating test data:', error);
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      throw new Error(
        `Cannot connect to API server at ${this.apiBaseUrl}. ` +
        `Please make sure the API server is running.`
      );
    } else if (error.response) {
      throw new Error(`Server error: ${error.response.data.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error(`No response from server at ${this.apiBaseUrl}`);
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

const instance = new TestDataGenerator();
export default instance; 
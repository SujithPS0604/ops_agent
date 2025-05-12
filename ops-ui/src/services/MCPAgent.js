import axios from 'axios';

class MCPAgent {
  constructor() {
    // API endpoint for our API server
    this.apiBaseUrl = 'http://localhost:3002'; 
    console.log(`MCPAgent initialized with API URL: ${this.apiBaseUrl}`);
  }

  async invokeAgent(prompt) {
    try {
      console.log(`Sending prompt to API: ${prompt}`);
      
      const response = await axios.post(`${this.apiBaseUrl}/api/invoke`, {
        prompt: prompt
      }, {
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Response received from API');
      return response.data;
    } catch (error) {
      console.error('Error during agent execution:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        // Connection refused or network error
        throw new Error(
          `Cannot connect to API server at ${this.apiBaseUrl}. ` +
          `Please make sure you've started the API server by running: ` +
          `node start-api.js in the ops_automation directory.`
        );
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Server error: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`Time out or No response from server at ${this.apiBaseUrl}. Please ensure the API server is running.`);
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }
}

// Create a singleton instance
const instance = new MCPAgent();
export default instance;
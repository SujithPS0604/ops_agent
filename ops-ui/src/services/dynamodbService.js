import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const fetchOrders = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/orders`);
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
}; 
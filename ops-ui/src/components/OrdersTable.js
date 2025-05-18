import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { fetchOrders } from '../services/dynamodbService';

const getStatusColor = (status) => {
  switch (status) {
    case 'CREATED':
      return 'primary';
    case 'SHIPPED':
      return 'success';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
};

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        setOrders(data?.orders || []);
        setError(null);
      } catch (err) {
        setError('Failed to load orders. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Orders
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Order ID</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) =>
              order.positions.map((position) =>
                position.orderPositionItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>
                      {new Date(order.orderDate).toLocaleString()}
                    </TableCell>
                    <TableCell>{position.product.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="contained" color="primary" onClick={() => setSelectedOrder(order)}> 
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {selectedOrder && (
        <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </Box>
  );
};

const OrderDetails = ({ order, onClose }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6">Order Details</Typography>
      <Button variant="contained" color="primary" onClick={onClose}>Close</Button>
      <pre>{JSON.stringify(order, null, 2)}</pre>
    </Box>
  );
};

export default OrdersTable; 
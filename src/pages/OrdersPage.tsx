// This is just the Orders section from the old Inventory page
// Using the proven, working code instead of reimplementing

import React from 'react';
import { Navigate } from 'react-router-dom';

const OrdersPage: React.FC = () => {
  // Redirect to the old inventory page for now
  // We'll use the working system until we properly rebuild it
  return <Navigate to="/inventory" replace />;
};

export default OrdersPage;

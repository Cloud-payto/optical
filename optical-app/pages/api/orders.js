import { createOrder, query } from '../../lib/database';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get session for authentication
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountId = session.user.accountId;

  if (req.method === 'GET') {
    try {
      const { vendor_id, status, from_date, to_date, order_number } = req.query;
      
      let whereConditions = ['account_id = $1'];
      let params = [accountId];
      let paramCount = 1;
      
      if (vendor_id) {
        paramCount++;
        whereConditions.push(`vendor_id = $${paramCount}`);
        params.push(vendor_id);
      }
      
      if (status) {
        paramCount++;
        whereConditions.push(`status = $${paramCount}`);
        params.push(status);
      }
      
      if (order_number) {
        paramCount++;
        whereConditions.push(`order_number ILIKE $${paramCount}`);
        params.push(`%${order_number}%`);
      }
      
      if (from_date) {
        paramCount++;
        whereConditions.push(`order_date >= $${paramCount}`);
        params.push(from_date);
      }
      
      if (to_date) {
        paramCount++;
        whereConditions.push(`order_date <= $${paramCount}`);
        params.push(to_date);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      const result = await query(`
        SELECT o.*, v.name as vendor_name,
               COUNT(DISTINCT i.id) as item_count,
               SUM(i.quantity) as total_quantity
        FROM orders o
        LEFT JOIN vendors v ON o.vendor_id = v.id
        LEFT JOIN inventory i ON o.id = i.order_id
        WHERE ${whereClause}
        GROUP BY o.id, v.name
        ORDER BY o.order_date DESC, o.created_at DESC
        LIMIT 100
      `, params);
      
      return res.status(200).json({
        success: true,
        count: result.rows.length,
        orders: result.rows
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const orderData = {
        ...req.body,
        account_id: accountId
      };
      
      // Validate required fields
      const requiredFields = ['order_number', 'customer_name'];
      for (const field of requiredFields) {
        if (!orderData[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`
          });
        }
      }
      
      const order = await createOrder(orderData);
      
      return res.status(200).json({
        success: true,
        order: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Handle duplicate order error
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'Order with this number already exists for this customer'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updates = req.body;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }
      
      // Build update query dynamically
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      Object.keys(updates).forEach(key => {
        if (key !== 'id' && key !== 'account_id') {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
          paramCount++;
        }
      });
      
      values.push(id);
      values.push(accountId);
      
      const result = await query(`
        UPDATE orders 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND account_id = $${paramCount + 1}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        order: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }
      
      // Check if order has inventory items
      const inventoryCheck = await query(`
        SELECT COUNT(*) as count FROM inventory WHERE order_id = $1
      `, [id]);
      
      if (parseInt(inventoryCheck.rows[0].count) > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete order with existing inventory items'
        });
      }
      
      const result = await query(`
        DELETE FROM orders 
        WHERE id = $1 AND account_id = $2
        RETURNING id
      `, [id, accountId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Order deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
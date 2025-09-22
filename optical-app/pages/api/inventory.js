import { getInventoryByAccount, saveInventoryItems, query } from '../../lib/database';
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
      const { vendor_id, status, brand, search } = req.query;
      
      let filters = {};
      if (vendor_id) filters.vendor_id = vendor_id;
      if (status) filters.status = status;
      if (brand) filters.brand = brand;
      
      const inventory = await getInventoryByAccount(accountId, filters);
      
      // Apply search filter if provided
      let filteredInventory = inventory;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredInventory = inventory.filter(item => 
          item.brand?.toLowerCase().includes(searchLower) ||
          item.model?.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.color_name?.toLowerCase().includes(searchLower)
        );
      }
      
      return res.status(200).json({
        success: true,
        count: filteredInventory.length,
        items: filteredInventory
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Items array is required'
        });
      }
      
      const savedItems = await saveInventoryItems(accountId, items);
      
      return res.status(200).json({
        success: true,
        message: `${savedItems.length} items added to inventory`,
        itemIds: savedItems.map(item => item.id)
      });
    } catch (error) {
      console.error('Error saving inventory items:', error);
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
          error: 'Item ID is required'
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
        UPDATE inventory 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND account_id = $${paramCount + 1}
        RETURNING *
      `, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        item: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
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
          error: 'Item ID is required'
        });
      }
      
      const result = await query(`
        DELETE FROM inventory 
        WHERE id = $1 AND account_id = $2
        RETURNING id
      `, [id, accountId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Item not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
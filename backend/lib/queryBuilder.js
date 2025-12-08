/**
 * Query Builder Utility
 * Provides server-side sorting and pagination for Supabase queries
 */

/**
 * Apply sorting and pagination to a Supabase query
 *
 * @param {Object} query - Supabase query object
 * @param {Object} options - Sorting and pagination options
 * @param {string} options.sortBy - Column name to sort by
 * @param {string} options.sortOrder - Sort direction ('asc' or 'desc')
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.pageSize - Number of items per page
 * @param {Array<string>} options.allowedColumns - Whitelist of sortable columns
 * @param {string} options.defaultSort - Default column to sort by
 * @param {string} options.defaultOrder - Default sort order
 * @returns {Object} Modified Supabase query with sorting and pagination
 */
function applySortingAndPagination(query, options = {}) {
  const {
    sortBy,
    sortOrder = 'desc',
    page = 1,
    pageSize = 50,
    allowedColumns = [],
    defaultSort = 'created_at',
    defaultOrder = 'desc'
  } = options;

  // Validate and apply sorting
  let finalSortColumn = defaultSort;
  let finalSortOrder = defaultOrder;

  if (sortBy) {
    // Security: Only allow whitelisted columns
    if (allowedColumns.length > 0 && !allowedColumns.includes(sortBy)) {
      console.warn(`⚠️ Invalid sort column: ${sortBy}. Using default: ${defaultSort}`);
      finalSortColumn = defaultSort;
    } else {
      finalSortColumn = sortBy;
    }
  }

  // Validate sort order
  if (sortOrder && ['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    finalSortOrder = sortOrder.toLowerCase();
  }

  // Apply sorting to query
  query = query.order(finalSortColumn, { ascending: finalSortOrder === 'asc' });

  // Apply pagination
  const pageNumber = Math.max(1, parseInt(page) || 1);
  const limit = Math.min(Math.max(1, parseInt(pageSize) || 50), 100); // Max 100 items per page
  const offset = (pageNumber - 1) * limit;

  query = query.range(offset, offset + limit - 1);

  return query;
}

/**
 * Get pagination metadata
 *
 * @param {number} totalCount - Total number of records
 * @param {number} page - Current page number
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Pagination metadata
 */
function getPaginationMetadata(totalCount, page, pageSize) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  return {
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
}

/**
 * Extract and validate query parameters from request
 *
 * @param {Object} req - Express request object
 * @returns {Object} Validated query parameters
 */
function extractQueryParams(req) {
  const {
    sortBy,
    sortOrder = 'desc',
    page = 1,
    pageSize = 50
  } = req.query;

  return {
    sortBy: sortBy || null,
    sortOrder: sortOrder || 'desc',
    page: parseInt(page) || 1,
    pageSize: Math.min(parseInt(pageSize) || 50, 100) // Max 100 items
  };
}

module.exports = {
  applySortingAndPagination,
  getPaginationMetadata,
  extractQueryParams
};

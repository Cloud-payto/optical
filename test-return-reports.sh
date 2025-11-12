#!/bin/bash
# Test script for Return Reports API endpoints
# Usage: ./test-return-reports.sh <AUTH_TOKEN>

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3001}"
AUTH_TOKEN="${1}"

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}Error: AUTH_TOKEN required${NC}"
    echo "Usage: ./test-return-reports.sh <your-auth-token>"
    echo ""
    echo "To get your auth token:"
    echo "1. Login to the app"
    echo "2. Open browser console"
    echo "3. Run: localStorage.getItem('supabase.auth.token')"
    exit 1
fi

echo -e "${YELLOW}Testing Return Reports API...${NC}"
echo "API URL: $API_URL"
echo ""

# Test 1: List reports
echo -e "${YELLOW}Test 1: GET /api/return-reports${NC}"
response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$API_URL/api/return-reports")

status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✓ Success (200)${NC}"
    echo "Response: $body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}✗ Failed ($status_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 2: Create report (with sample data)
echo -e "${YELLOW}Test 2: POST /api/return-reports${NC}"
report_number="RR-2025-TEST-$(date +%s)"
sample_data='{
  "vendor_name": "Test Vendor",
  "report_number": "'$report_number'",
  "filename": "Return_Report_Test_'$report_number'.pdf",
  "pdf_path": "test-user/2025/Return_Report_Test_'$report_number'.pdf",
  "item_count": 3,
  "total_quantity": 5,
  "status": "pending"
}'

response=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$sample_data" \
    "$API_URL/api/return-reports")

status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$status_code" = "200" ]; then
    echo -e "${GREEN}✓ Success (200)${NC}"
    echo "Response: $body" | jq '.' 2>/dev/null || echo "$body"
    
    # Extract report ID for next test
    report_id=$(echo "$body" | jq -r '.data.id' 2>/dev/null)
    echo "Created Report ID: $report_id"
else
    echo -e "${RED}✗ Failed ($status_code)${NC}"
    echo "Response: $body"
fi
echo ""

# Test 3: Get specific report (if we created one)
if [ ! -z "$report_id" ] && [ "$report_id" != "null" ]; then
    echo -e "${YELLOW}Test 3: GET /api/return-reports/$report_id${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/api/return-reports/$report_id")
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ Success (200)${NC}"
        echo "Response: $body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed ($status_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
    
    # Test 4: Update report status
    echo -e "${YELLOW}Test 4: PATCH /api/return-reports/$report_id${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -X PATCH \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"status": "submitted", "notes": "Test update"}' \
        "$API_URL/api/return-reports/$report_id")
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ Success (200)${NC}"
        echo "Response: $body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed ($status_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
    
    # Test 5: Delete report
    echo -e "${YELLOW}Test 5: DELETE /api/return-reports/$report_id${NC}"
    response=$(curl -s -w "\n%{http_code}" \
        -X DELETE \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_URL/api/return-reports/$report_id")
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✓ Success (200)${NC}"
        echo "Response: $body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Failed ($status_code)${NC}"
        echo "Response: $body"
    fi
    echo ""
fi

echo -e "${YELLOW}Testing complete!${NC}"

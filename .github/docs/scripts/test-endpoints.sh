#!/bin/bash
# test-endpoints.sh - Test all Triva endpoints
# Usage: ./test-endpoints.sh [port]

PORT=${1:-3333}
BASE_URL="http://localhost:$PORT"

echo "🧪 Testing Triva Endpoints"
echo "=========================="
echo "Base URL: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "  $method $BASE_URL$endpoint"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ Success ($http_code)${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "  ${RED}✗ Failed ($http_code)${NC}"
        echo "$body"
    fi
    echo ""
}

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is ready!${NC}"
        echo ""
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Server not responding. Is it running on port $PORT?${NC}"
        echo ""
        echo "Start the server first:"
        echo "  cd /tmp/triva-test-* && node test.js"
        exit 1
    fi
    sleep 0.5
done

# Run tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "BASIC TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/health" "" "Health check"
test_endpoint "GET" "/test" "" "Basic GET request"
test_endpoint "GET" "/test?foo=bar&baz=qux" "" "GET with query params"
test_endpoint "GET" "/users/123" "" "GET with route params"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "CACHE TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/cache-test" "" "Cache operations"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "LOGGING TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/logs" "" "Get recent logs"
test_endpoint "GET" "/logs/stats" "" "Get log statistics"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "POST TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "POST" "/echo" '{"message":"Hello Triva","timestamp":123456}' "POST with JSON body"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "THROTTLE TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${YELLOW}Testing throttle limits (sending 12 rapid requests)...${NC}"
echo ""

success_count=0
throttled_count=0

for i in {1..12}; do
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/throttle-test")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 429 ]; then
        echo -e "  Request $i: ${RED}✗ Throttled (429)${NC}"
        ((throttled_count++))
    else
        echo -e "  Request $i: ${GREEN}✓ Success ($http_code)${NC}"
        ((success_count++))
    fi
    
    # Small delay between requests
    sleep 0.1
done

echo ""
echo "Results:"
echo "  Successful: $success_count"
echo "  Throttled: $throttled_count"

if [ $throttled_count -gt 0 ]; then
    echo -e "  ${GREEN}✓ Throttling is working correctly!${NC}"
else
    echo -e "  ${YELLOW}⚠ Expected some requests to be throttled${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ERROR HANDLING TESTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint "GET" "/nonexistent" "" "404 Not Found"
test_endpoint "POST" "/echo" 'invalid json' "Invalid JSON body"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All tests completed!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

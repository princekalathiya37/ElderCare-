#!/bin/bash

# ============================================
# ElderCare+ AUTOMATED TEST SUITE
# ============================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           ElderCare+ Automated Test Suite                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Configuration
API_URL="http://localhost:5000/api"
TEST_EMAIL="test$(date +%s)@eldercare.com"
TEST_PASSWORD="Test@123456"
TEST_TOKEN=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

# Helper function to test API
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_code="$5"

    echo -n "Testing: $name ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TEST_TOKEN" \
            -d "$data" \
            "$API_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (Expected $expected_code, got $http_code)"
        echo "Response: $body"
        ((FAILED++))
    fi
}

# ============ TEST SUITE ============

echo -e "\n${YELLOW}1. Authentication Tests${NC}"

# Register user
echo -n "Register: Creating test user ... "
register_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"name\": \"Test User\",
        \"phone\": \"+1234567890\",
        \"role\": \"elder\"
    }" \
    "$API_URL/auth/register")

TEST_TOKEN=$(echo "$register_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$register_response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -n "$TEST_TOKEN" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $register_response"
    ((FAILED++))
fi

# Login
echo -n "Login: Testing authentication ... "
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }" \
    "$API_URL/auth/login")

LOGIN_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$LOGIN_TOKEN" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
    TEST_TOKEN="$LOGIN_TOKEN"
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

# Get Profile
test_api "Get Profile" "GET" "/auth/profile" "" "200"

echo -e "\n${YELLOW}2. Medicine Management Tests${NC}"

# Add Medicine
echo -n "Add Medicine: Creating test medicine ... "
medicine_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{
        "name": "Aspirin",
        "dosage": "100mg",
        "frequency": "once-daily",
        "scheduledTimes": ["8:00 AM"],
        "smsContact": "+1234567890",
        "smsAlert": true,
        "pushNotification": true
    }' \
    "$API_URL/medicines")

MEDICINE_ID=$(echo "$medicine_response" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
if [ -n "$MEDICINE_ID" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Response: $medicine_response"
    ((FAILED++))
fi

# Get Medicines
test_api "Get All Medicines" "GET" "/medicines" "" "200"

# Get Today's Medicines
test_api "Get Today's Medicines" "GET" "/medicines/today/list" "" "200"

# Confirm Medicine Taken
echo -n "Confirm Medicine: Mark as taken ... "
confirm_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{"time": "8:00 AM"}' \
    "$API_URL/medicines/$MEDICINE_ID/confirm")

http_code=$(echo "$confirm_response" | tail -n 1)
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

# Get Medicine Confirmations
test_api "Get Confirmations" "GET" "/medicines/$MEDICINE_ID/confirmations" "" "200"

echo -e "\n${YELLOW}3. Emergency SOS Tests${NC}"

# Trigger SOS
echo -n "Trigger SOS: Testing emergency alert ... "
sos_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TEST_TOKEN" \
    -d '{
        "location": {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "123 Test St, Test City"
        }
    }' \
    "$API_URL/sos/trigger")

http_code=$(echo "$sos_response" | tail -n 1)
body=$(echo "$sos_response" | head -n -1)
SOS_ID=$(echo "$body" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ "$http_code" = "201" ] && [ -n "$SOS_ID" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ FAILED${NC}"
    ((FAILED++))
fi

# Get Active SOS
test_api "Get Active SOS" "GET" "/sos/active" "" "200"

# Get SOS History
test_api "Get SOS History" "GET" "/sos/history" "" "200"

# Resolve SOS
if [ -n "$SOS_ID" ]; then
    test_api "Resolve SOS" "POST" "/sos/$SOS_ID/resolve" "" "200"
fi

echo -e "\n${YELLOW}4. Token Management Tests${NC}"

# Update FCM Token
test_api "Update FCM Token" "POST" "/auth/update-fcm" \
    '{\"fcmToken\": \"test-fcm-token-12345\"}' "200"

# Update Emergency Contacts
test_api "Update Emergency Contacts" "POST" "/auth/emergency-contacts" \
    '{
        "contacts": [
            {
                "name": "Jane Doe",
                "phone": "+1234567891",
                "email": "jane@example.com",
                "relationship": "Daughter"
            }
        ]
    }' "200"

echo -e "\n╔════════════════════════════════════════════════════════════════╗"
echo "║                    TEST RESULTS                              ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo -e "║ ${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "║ ${RED}❌ FAILED: $FAILED${NC}"
echo "║"

if [ $FAILED -eq 0 ]; then
    echo "║ ${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
else
    echo "║ ${RED}⚠️  Some tests failed. Check configuration.${NC}"
fi

echo "╚════════════════════════════════════════════════════════════════╝"

exit $FAILED

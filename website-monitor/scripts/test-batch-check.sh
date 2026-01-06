#!/bin/bash

echo "======================================="
echo "批量检测接口测试"
echo "======================================="
echo ""

API_KEY="test_8e97565c42dfd0a874486685cf30605f"
BASE_URL="http://localhost:3002"

echo "测试1: 不带密钥调用"
echo "GET ${BASE_URL}/api/monitor/batch-check"
curl -s -w "\nHTTP Status: %{http_code}\n" "${BASE_URL}/api/monitor/batch-check"
echo ""
echo ""

echo "测试2: 带无效密钥调用"
echo "GET ${BASE_URL}/api/monitor/batch-check?key=invalid_key"
curl -s -w "\nHTTP Status: %{http_code}\n" "${BASE_URL}/api/monitor/batch-check?key=invalid_key"
echo ""
echo ""

echo "测试3: 带有效密钥调用"
echo "GET ${BASE_URL}/api/monitor/batch-check?key=${API_KEY}"
echo ""
echo "响应:"
curl -s "${BASE_URL}/api/monitor/batch-check?key=${API_KEY}" | python3 -m json.tool 2>/dev/null || curl -s "${BASE_URL}/api/monitor/batch-check?key=${API_KEY}"
echo ""
echo ""

echo "======================================="
echo "测试完成"
echo "======================================="

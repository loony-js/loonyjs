#!/bin/bash


node apps/demo/dist/main.js 2>&1 &
APP_PID=$!
sleep 3

echo ""
echo "=== GET /health ==="
curl -s http://localhost:3000/health
echo ""

echo "=== GET /users ==="
curl -s http://localhost:3000/users
echo ""

echo "=== POST /users ==="
curl -s -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Charlie","email":"charlie@example.com","password":"secret123"}'
echo ""

echo "=== GET /users/count ==="
curl -s http://localhost:3000/users/count
echo ""

echo "=== GET /users/1 ==="
curl -s http://localhost:3000/users/1
echo ""

echo "=== PATCH /users/2 ==="
curl -s -X PATCH http://localhost:3000/users/2 \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bobby Updated"}'
echo ""

echo "=== 404 NotFoundException ==="
curl -s http://localhost:3000/users/999
echo ""

echo "=== DELETE /users/1 ==="
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3000/users/1)
echo "HTTP $STATUS"

echo "=== Conflict: duplicate email ==="
curl -s -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alice Clone","email":"alice@example.com","password":"secret123"}'
echo ""

kill $APP_PID 2>/dev/null
wait $APP_PID 2>/dev/null
echo ""
echo "=== ALL DONE ==="
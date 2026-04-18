npx ts-node \
 --project apps/demo/tsconfig.json \
 -r tsconfig-paths/register \
 apps/demo/src/users/users.service.spec.ts 2>&1

npm install -w apps/demo 2>&1 | tail -5

cat apps/demo/package.json | python3 -c "import json,sys; d=json.load(sys.stdin); d['dependencies']['@loonyjs/testing']='0.1.0'; print(json.dumps(d, indent=2))" > /tmp/pkg.json && mv /tmp/pkg.json apps/demo/package.json && npm install 2>&1 | tail -5

npx tsc -p packages/testing/tsconfig.json 2>&1 && echo "testing OK"

cd apps/demo && npx ts-node \
 --project tsconfig.json \
 -e "require('tsconfig-paths/register'); require('./src/users/users.service.spec.ts')" 2>&1 || \
npx ts-node \
 --project apps/demo/tsconfig.json \
 apps/demo/src/users/users.service.spec.ts 2>&1

cd apps/demo && npx ts-node --project tsconfig.json src/users/users.service.spec.ts 2>&1 | grep -E "(✅|❌|passed|failed|────)"

cd /home/sankar/projects/loonyjs && \
npx tsc -p packages/core/tsconfig.json && \
npx tsc -p packages/common/tsconfig.json && \
npx tsc -p packages/testing/tsconfig.json && \
npx tsc -p packages/cli/tsconfig.json && \
npx tsc -p apps/demo/tsconfig.json && \
echo "✅ ALL PACKAGES COMPILED SUCCESSFULLY"

node apps/demo/dist/main.js &
APP_PID=$!
sleep 3
echo "--- Smoke tests ---"
R1=$(curl -s http://localhost:3000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d['status']=='ok' else 'FAIL')")
R2=$(curl -s http://localhost:3000/users | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d['total']==2 else 'FAIL')")
R3=$(curl -s -X POST http://localhost:3000/users -H 'Content-Type: application/json' -d '{"name":"Eve","email":"eve@example.com","password":"pass1234"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('id') else 'FAIL')")
R4=$(curl -s http://localhost:3000/users/999 | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d['statusCode']==404 else 'FAIL')")
R5=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:3000/users/1)
echo "GET /health: $R1"
echo "GET /users:         $R2"
echo "POST /users:        $R3"
echo "404 handling:       $R4"
echo "DELETE 204 status:  $([[ \"$R5\" == \"204\" ]] && echo OK || echo FAIL)"
kill $APP_PID 2>/dev/null; wait $APP_PID 2>/dev/null
echo "--- Tests complete ---"

find /home/sankar/projects/loonyjs -not -path '_/node_modules/_' -not -path '_/dist/_' -not -name '\*.js.map' | sort | head -80

npx tsc -p packages/core/tsconfig.json 2>&1 && \
npx tsc -p packages/common/tsconfig.json 2>&1 && \
npx tsc -p packages/testing/tsconfig.json 2>&1 && \
npx tsc -p packages/cli/tsconfig.json 2>&1 && \
npx tsc -p apps/demo/tsconfig.json 2>&1 && \
echo "✅ ALL PACKAGES COMPILED SUCCESSFULLY"

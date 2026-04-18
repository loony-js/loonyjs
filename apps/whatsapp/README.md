Starting the WhatsApp Server

1. Prerequisites

# PostgreSQL must be running

# Install pg driver (already in package.json, run from repo root)

npm install 2. Create the database and schema

psql -U postgres -c "CREATE DATABASE whatsapp_clone;"
psql -U postgres -d whatsapp_clone -f next/whatsapp_clone.sql 3. Set environment variables

export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASS=postgres
export DB_NAME=whatsapp_clone
export NODE_ENV=development
export PORT=3001 4. Build and start

npm run build -w apps/whatsapp
node apps/whatsapp/dist/main.js
curl Requests
Users

# Create a user

curl -X POST http://localhost:3001/users \
 -H "Content-Type: application/json" \
 -d '{"phone_number":"+1234567890","display_name":"Alice"}'

# Create a second user

curl -X POST http://localhost:3001/users \
 -H "Content-Type: application/json" \
 -d '{"phone_number":"+0987654321","display_name":"Bob"}'

# List all users

curl http://localhost:3001/users

# Get user by id

curl http://localhost:3001/users/1

# Update a user

curl -X PUT http://localhost:3001/users/1 \
 -H "Content-Type: application/json" \
 -d '{"about":"Hey there! I am using WhatsApp."}'

# Delete a user

curl -X DELETE http://localhost:3001/users/2
Direct Messages

# Send a message

curl -X POST http://localhost:3001/messages \
 -H "Content-Type: application/json" \
 -d '{"sender_id":1,"receiver_id":2,"body_text":"Hello Bob!"}'

# Get conversation between two users

curl "http://localhost:3001/messages/conversation?user1=1&user2=2"

# Mark message as read

curl -X PUT http://localhost:3001/messages/1/read
Groups

# Create a group

curl -X POST http://localhost:3001/groups \
 -H "Content-Type: application/json" \
 -d '{"name":"Family","created_by":1}'

# Add a member

curl -X POST http://localhost:3001/groups/1/members \
 -H "Content-Type: application/json" \
 -d '{"user_id":2,"role":"member"}'

# Send a group message

curl -X POST http://localhost:3001/groups/1/messages \
 -H "Content-Type: application/json" \
 -d '{"sender_id":1,"body_text":"Hello everyone!"}'

# Get group messages

curl http://localhost:3001/groups/1/messages

# Get group members

curl http://localhost:3001/groups/1/members

# Remove a member

curl -X DELETE http://localhost:3001/groups/1/members/2
Note: TypeOrmModule.forRoot uses synchronize: true in development mode, so tables are auto-created from entities — you can skip the SQL file step if you prefer letting TypeORM create the schema.

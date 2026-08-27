@echo off
set DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/margen
set NODE_ENV=test
set PORT=3001
cd /d D:\E-Commerce\.worktrees\margen-ecommerce\apps\api
npx tsx src/main.ts

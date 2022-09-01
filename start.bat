@echo off
title Structured Products Testing
cd client
npm install
cd ..
npm install
npm run build
npm start
pause
exit
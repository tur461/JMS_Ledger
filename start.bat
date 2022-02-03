@echo off
taskkill /f /t /im node.exe
start /b start_server.bat
start /b start_web.bat
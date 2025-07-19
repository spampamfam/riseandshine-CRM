@echo off
echo Setting up CRM Backend for Windows...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js is installed: 
node --version

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo npm is installed:
npm --version
echo.

REM Copy environment file
if not exist .env (
    if exist env.example (
        copy env.example .env
        echo Created .env file from env.example
        echo Please edit .env with your Supabase credentials
    ) else (
        echo ERROR: env.example file not found
        pause
        exit /b 1
    )
) else (
    echo .env file already exists
)

REM Install dependencies
echo Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit .env file with your Supabase credentials
echo 2. Run: npm run dev
echo.
pause 
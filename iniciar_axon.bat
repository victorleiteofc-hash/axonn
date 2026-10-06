@echo off
title Axon Skin - Servidor Local
cd /d "%~dp0"
echo ===================================================
echo           INICIANDO AXON SKIN (3D WEBGL)
echo ===================================================
echo.

:: 1. Se o servidor ja estiver rodando na porta 3000, apenas abre o navegador
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Servidor Axon Skin ja esta ativo e rodando na porta 3000!
    echo Abrindo o navegador em http://localhost:3000 ...
    start http://localhost:3000
    echo.
    echo O servidor continua rodando. Pressione qualquer tecla para sair deste assistente.
    pause >nul
    exit /b
)

:: 2. Se nao estiver rodando, inicia o Node e mantem a janela aberta
echo Iniciando motor molecular Node.js...
start http://localhost:3000
node dist/server.cjs
pause

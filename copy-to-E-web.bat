@echo off
chcp 65001 >nul
echo Copying website files to E:\web ...
echo.
robocopy "%~dp0." "E:\web" /E /XF "copy-to-E-web.bat" /NFL /NDL /NJH /NJS
echo.
echo Finished. Please check E:\web
echo.
pause

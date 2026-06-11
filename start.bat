@echo off
REM 校园宿舍报修系统 - Windows 启动脚本
setlocal enabledelayedexpansion

echo =========================================
echo   校园宿舍报修系统 - 启动脚本
echo =========================================
echo.

REM 检查 Java
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未检测到 Java，请先安装 JDK 17 或更高版本
    echo    下载地址: https://adoptium.net/
    pause
    exit /b 1
)

for /f "tokens=3" %%a in ('java -version 2^>^&1 ^| findstr /i "version"') do (
    set JAVA_VER=%%~a
)
echo ✅ Java 已检测

REM 检查 Maven
where mvn >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ 使用系统 Maven
    set MVN_CMD=mvn
) else if exist mvnw.cmd (
    echo ✅ 使用 Maven Wrapper
    set MVN_CMD=mvnw.cmd
) else (
    echo ⚠️  未找到 Maven
    echo.
    echo 请安装 Maven:
    echo   方法1: choco install maven  (需先安装 Chocolatey)
    echo   方法2: 从 https://maven.apache.org/download.cgi 下载并配置环境变量
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 正在编译并启动项目...
echo    首次启动会下载依赖，请耐心等待...
echo.
echo 📊 启动完成后访问:
echo    首页:     http://localhost:8080
echo    H2控制台: http://localhost:8080/h2-console
echo.
echo 💡 H2控制台连接信息:
echo    JDBC URL: jdbc:h2:mem:dorm_repair
echo    用户名:   sa
echo    密码:     (留空)
echo.
echo 停止服务请按 Ctrl+C
echo =========================================
echo.

%MVN_CMD% spring-boot:run

pause
endlocal

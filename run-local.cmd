@echo off
setlocal
cd /d "%~dp0"

echo Building Spring Boot and React...
cmd /c mvnw.cmd clean package -DskipTests
if errorlevel 1 (
	echo Build failed. The application was not started.
	exit /b 1
)

echo Starting Spring Boot on http://localhost:8080 ...
if not defined ADMIN_BOOTSTRAP_TOKEN set "ADMIN_BOOTSTRAP_TOKEN=change-me"
start "" http://localhost:8080/
java -jar target\demo-0.0.1-SNAPSHOT.jar

endlocal
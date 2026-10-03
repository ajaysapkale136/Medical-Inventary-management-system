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
if not defined DB_URL (
	echo DB_URL must be set, for example jdbc:mysql://localhost:3306/medical_inventory
	exit /b 1
)
if not defined DB_USERNAME (
	echo DB_USERNAME must be set.
	exit /b 1
)
if not defined DB_PASSWORD (
	echo DB_PASSWORD must be set.
	exit /b 1
)
start "" http://localhost:8080/
java -jar target\demo-0.0.1-SNAPSHOT.jar

endlocal

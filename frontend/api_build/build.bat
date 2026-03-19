@echo off
CHCP 65001 >nul

set dir=%~dp0
@REM 主要模块接口
set moduleName=apiServices
set apiServicesPath=%dir%..\src\api-services\
set apiUrl=http://8.148.215.20/api/docs.json

if "%1"=="approvalFlow" (
  set moduleName=approvalFlow
  set apiServicesPath=%dir%..\src\api-plugins\approvalFlow\
  set apiUrl=http://192.168.6.30:5005/swagger/ApprovalFlow/swagger.json
) else if "%1"=="dingTalk" (
  set moduleName=dingTalk
  set apiServicesPath=%dir%..\src\api-plugins\dingTalk\
  set apiUrl=http://192.168.6.30:5005/swagger/DingTalk/swagger.json
) else if "%1"=="goView" (
  set moduleName=goView
  set apiServicesPath=%dir%..\src\api-plugins\goView\
  set apiUrl=http://192.168.6.30:5005/swagger/GoView/swagger.json
)

set "codeGenJar=%dir%swagger-codegen-cli.jar"

echo ================================ 参数确认 ================================
echo 脚本目录: %dir%
echo 模块名称: %moduleName%
echo 输出路径: %apiServicesPath%
echo API URL: %apiUrl%
echo Codegen JAR: %codeGenJar%

if not exist "%codeGenJar%" (
    echo.
    echo [错误] 找不到 swagger-codegen-cli.jar：%codeGenJar%
    echo 请下载 swagger-codegen-cli-3.0.41.jar 并重命名为 swagger-codegen-cli.jar 放到本目录（frontend\api_build\）下。
    echo 参考：frontend\api_build\readme.md
    echo.
    echo [提示] 如果你的项目路径包含中文，Java 有时会解析失败，建议将项目移动到纯英文路径后再试。
    exit /b 1
)

if exist "%apiServicesPath%" (
    echo ================================ 删除目录 %moduleName% ================================
    rd /s /q "%apiServicesPath%"
)

echo ================================ 开始生成 %moduleName% ================================

java -jar "%codeGenJar%" generate -i "%apiUrl%" -l typescript-axios -o "%apiServicesPath%"
if errorlevel 1 (
    echo.
    echo [错误] 代码生成失败。请确认：
    echo 1) 已安装 Java 8+，且 java -version 可用
    echo 2) swagger 地址可访问：%apiUrl%
    echo 3) 项目路径尽量使用纯英文路径
    exit /b 1
)

@rem 删除不必要的文件和文件夹
rd /s /q "%apiServicesPath%.swagger-codegen" 2>nul
del /q "%apiServicesPath%.gitignore" 2>nul
del /q "%apiServicesPath%.npmignore" 2>nul
del /q "%apiServicesPath%.swagger-codegen-ignore" 2>nul
del /q "%apiServicesPath%git_push.sh" 2>nul
del /q "%apiServicesPath%package.json" 2>nul
del /q "%apiServicesPath%README.md" 2>nul
del /q "%apiServicesPath%tsconfig.json" 2>nul

echo ================================ 生成结束 ================================
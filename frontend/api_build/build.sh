#!/bin/bash

dir="$(dirname "$0")"

moduleName="apiServices"
apiServicesPath="$dir/../src/api-services/"
apiUrl="http://192.168.1.4:3000/api/docs.json"

# moduleName=apiJyServices
# apiServicesPath="$dir/../src/api-plugins/jyServices/"
# apiUrl="http://192.168.6.30:5005/swagger/%E5%B0%B1%E4%B8%9A%E6%9C%8D%E5%8A%A1%E4%B8%AD%E5%BF%83%E4%B8%9A%E5%8A%A1/swagger.json"

case "$1" in
    approvalFlow)
        moduleName="approvalFlow"
        apiServicesPath="$dir/../src/api-plugins/approvalFlow/"
        apiUrl="http://192.168.1.4:3000/api/docs.json"
        ;;
    dingTalk)
        moduleName="dingTalk"
        apiServicesPath="$dir/../src/api-plugins/dingTalk/"
        apiUrl="http://192.168.1.4:3000/api/docs.json"
        ;;
    goView)
        moduleName="goView"
        apiServicesPath="$dir/../src/api-plugins/goView/"
        apiUrl="http://192.168.1.4:3000/api/docs.json"
        ;;
esac

if [ -d "$apiServicesPath" ]; then
    echo "================================ 删除目录 $apiServicesPath ================================"
    rm -rf "$apiServicesPath"
fi

echo "================================ 开始生成 $moduleName ================================"

java -jar "$dir/swagger-codegen-cli.jar" generate -i "$apiUrl" -l typescript-axios -o "$apiServicesPath" --additional-properties modelPropertyNaming=original

# 删除不必要的文件和文件夹
rm -rf "$apiServicesPath/.swagger-codegen"
rm -f "$apiServicesPath/.gitignore"
rm -f "$apiServicesPath/.npmignore"
rm -f "$apiServicesPath/.swagger-codegen-ignore"
rm -f "$apiServicesPath/git_push.sh"
rm -f "$apiServicesPath/package.json"
rm -f "$apiServicesPath/README.md"
rm -f "$apiServicesPath/tsconfig.json"

echo "================================ 生成结束 ================================"
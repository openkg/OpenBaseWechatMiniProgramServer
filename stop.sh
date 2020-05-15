
#这个脚本用于停止服务
kill $(ps aux | grep "[a]pp_openbase.js" | awk '{print $2}')
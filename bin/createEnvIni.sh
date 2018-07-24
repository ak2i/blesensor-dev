#! /bin/bash

targetEnv=$1
baseDir=$(cd $(dirname $0)/..;pwd)

confDir="${baseDir}/conf"

finalConfFile="${confDir}/env.ini"
originalConfFile="${confDir}/env.${targetEnv}"

if [ -f ${originalConfFile} ] ; then
# copy the config file
cp ${originalConfFile} ${finalConfFile}
echo "done."

else
# master config file does not found.
echo "conf/env.${targetEnv} does not found."
exit 1
fi

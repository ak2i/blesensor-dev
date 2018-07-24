#! /bin/bash

baseDir=$(cd $(dirname $0)/..;pwd)
confDir="${baseDir}/conf"
confFile="${confDir}/env.ini"
libDir="${baseDir}/lib"
cmdDir="${baseDir}/cmd"

source ${confFile}

echo "Start for ${EnvName}"
/usr/bin/env node $libDir/serviceBeaconReceiver.js

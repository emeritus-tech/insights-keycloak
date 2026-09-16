#!/usr/bin/env bash

# Stop immediately on command failures, unset variables, and failures in a
# pipeline (including Maven when its output is piped through tee).
set -euo pipefail

#curl https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.deb --output java.deb
#curl https://download.oracle.com/java/20/archive/jdk-20.0.2_linux-x64_bin.deb --output java.deb
#curl https://download.java.net/java/GA/jdk20/GPL/openjdk-20_linux-x64_bin.tar.gz --output java.tar.gz

#curl -O https://download.java.net/java/GA/jdk20/GPL/openjdk-20_linux-x64_bin.tar.gz

#curl https://download.oracle.com/java/20/archive/jdk-20_linux-x64_bin.deb --output java.deb

curl https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz --output jdk.tar.gz

#apt install -y libasound2 libc6-i386 libc6-x32 libfreetype6 libxi6 libxrender1 libxtst6

echo "--1--"

#dpkg -i java.deb

tar -xzvf jdk.tar.gz

export JAVA_HOME=$(pwd)/$(ls -d jdk-21* | tail -n 1)

export PATH=$JAVA_HOME/bin:$PATH

echo "--2-- $(which javac)"
echo "--3-- $(readlink -f $( which javac ))"

# Skip proto lock check for development builds (network/proxy issues).
# The themes module rebuilds the Admin Console vendor assets.
./mvnw -pl quarkus/deployment,quarkus/dist,themes -am \
  -DskipTests \
  -Dprotolock.skip=true \
  clean install 2>&1 | tee "log-$(date +%H-%M-%y-%m-%d).txt"

echo "Running build command for MSQL database"

java -jar quarkus/server/target/lib/quarkus-run.jar build --db=mysql --health-enabled=true --metrics-enabled=true

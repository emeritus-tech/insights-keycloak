#!/usr/bin/env bash

echo "B"

export JAVA_HOME=/usr/local/openjdk-20

./mvnw -pl quarkus/deployment,quarkus/dist,themes, -am -DskipTests clean install | tee log-$(date +%H-%M-%y-%m-%d).txt

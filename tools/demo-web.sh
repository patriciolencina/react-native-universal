#!/bin/bash

DIRNAME="$(dirname "$0")"
PHONE_VER="v3"
BUILD_DIR="$DIRNAME/../builds/web/"
REMOTE_DIR="~/www/ota/brekeke/phone/$PHONE_VER/web"

. $DIRNAME/remote.sh

echo $DIRNAME
echo $PHONE_VER
echo $BUILD_DIR
echo $REMOTE_DIR

rsync -aP --delete $BUILD_DIR $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR

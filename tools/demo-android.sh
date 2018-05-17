#!/bin/bash

DIRNAME="$(dirname "$0")"

. $DIRNAME/remote.sh

rsync -aP --delete --exclude .git $DIRNAME/../android/app/build/outputs/apk/ $REMOTE_USER@$REMOTE_HOST:/home/$REMOTE_USER/www/ota/brekeke/softphone/android

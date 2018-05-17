#!/bin/bash

DIRNAME="$(dirname "$0")"
7z a -tzip brekeke-phone-source$(date +%Y%m%d-%H%M).zip $DIRNAME/../* -xr!node_modules -xr!build -ir!.git

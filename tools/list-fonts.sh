#!/bin/bash

for file in "$1"*.{ttf,otf}; do 
  postscriptname=$(fc-scan --format "%{postscriptname}\n" $file);
  printf "\033[36m PostScript Name:\033[0m %s \e[90m(%s)\033[0m\n" "$postscriptname" "$file";
done

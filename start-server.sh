#!/bin/bash
cd /home/z/my-project
while true; do
  bun run dev >> dev.log 2>&1
  sleep 2
done

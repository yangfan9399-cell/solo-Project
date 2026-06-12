#!/bin/bash
cd /Users/yangfan/Desktop/trae-solo-generated-projects/q-219
echo "Finding native modules..."
find node_modules -name "*.node" -type f
echo "Signing all native modules..."
find node_modules -name "*.node" -type f -exec codesign --force --sign - {} \; 2>/dev/null
echo "Done signing"

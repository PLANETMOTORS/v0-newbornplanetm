#!/bin/bash
# Clear Next.js cache to force full rebuild
rm -rf .next
rm -rf node_modules/.cache
echo "Cache cleared successfully"

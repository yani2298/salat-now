#!/bin/bash

# Check if the dist directory exists
if [ ! -d "./dist" ]; then
  echo "App not built yet. Running build script first..."
  ./build_app.sh
fi

# Run the Electron app
npm run start 
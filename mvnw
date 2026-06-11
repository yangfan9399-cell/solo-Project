#!/bin/sh
# ----------------------------------------------------------------------------
# Maven Wrapper script for Unix-like systems
# ----------------------------------------------------------------------------

set -e

# Attempt to find Maven from PATH, Brew, or standard locations
if command -v mvn >/dev/null 2>&1; then
  exec mvn "$@"
elif [ -x "/opt/homebrew/bin/mvn" ]; then
  exec /opt/homebrew/bin/mvn "$@"
elif [ -x "/usr/local/bin/mvn" ]; then
  exec /usr/local/bin/mvn "$@"
elif [ -x "$HOME/.sdkman/candidates/maven/current/bin/mvn" ]; then
  exec "$HOME/.sdkman/candidates/maven/current/bin/mvn" "$@"
else
  echo "Error: Maven (mvn) not found. Please install Maven first:"
  echo "  macOS: brew install maven"
  echo "  Or download from: https://maven.apache.org/download.cgi"
  exit 1
fi

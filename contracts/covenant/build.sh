#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cargo build -p covenant --target wasm32-unknown-unknown --release
mkdir -p ../res
cp target/wasm32-unknown-unknown/release/covenant.wasm ../res/covenant.wasm
echo "Built ../res/covenant.wasm ($(wc -c < ../res/covenant.wasm) bytes)"

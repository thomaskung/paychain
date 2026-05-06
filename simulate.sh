#!/bin/bash

# Paychain Multi-Node & Oracle Simulation Orchestrator

# Kill any existing processes on these ports
echo "Cleaning up ports..."
lsof -ti:3001,3002,3003 | xargs kill -9 2>/dev/null

echo "Starting Paychain L1 Node A (Port 3001)..."
cd node && PORT=3001 PEERS=http://localhost:3002 npm start > ../node_a.log 2>&1 &
NODE_A_PID=$!

echo "Starting Paychain L1 Node B (Port 3002)..."
PORT=3002 PEERS=http://localhost:3001 npm start > ../node_b.log 2>&1 &
NODE_B_PID=$!

echo "Starting Compliance Oracle (Port 3003)..."
cd ../oracle && PORT=3003 npm start > ../oracle.log 2>&1 &
ORACLE_PID=$!

echo "Waiting for services to initialize..."
sleep 5

echo "Starting Wallet Simulation..."
cd ../wallet && npx ts-node src/simulation.ts

echo "Simulation complete. Logs available in *.log files."
echo "Stopping services..."
kill $NODE_A_PID $NODE_B_PID $ORACLE_PID

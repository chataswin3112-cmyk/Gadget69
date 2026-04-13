@echo off
cd /d "c:\Users\Admin\Downloads\zenith-catalog-glow-main (1)\zenith-catalog-glow-main"
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort 1>>".tmp\frontend-run.log" 2>>".tmp\frontend-run.err.log"

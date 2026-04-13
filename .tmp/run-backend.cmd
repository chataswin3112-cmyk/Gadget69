@echo off
cd /d "c:\Users\Admin\Downloads\zenith-catalog-glow-main (1)\zenith-catalog-glow-main\backend"
java -jar target\catalog-backend-0.0.1-SNAPSHOT.jar 1>>"..\.tmp\backend-run.log" 2>>"..\.tmp\backend-run.err.log"

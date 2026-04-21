@echo off
cd /d "%~dp0..\backend"
java -cp "target\classes;.tmp_exploded_runtime\BOOT-INF\lib\*" com.gadget69.catalog.CatalogApplication

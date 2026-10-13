@echo off
rem Run from a short, empty Chromium workspace after build prerequisites pass.
rem Keep depot_tools on PATH. The source revision is deliberately pinned.
if exist src\.git (
  echo Existing checkout detected. Refusing to overwrite it.
  exit /b 1
)
set DEPOT_TOOLS_WIN_TOOLCHAIN=0
call gclient config https://chromium.googlesource.com/chromium/src.git
if errorlevel 1 exit /b 1
call gclient sync --no-history --revision src@ae03f7fb2cf1215853896d6a4c15fdceee2badb7
if errorlevel 1 exit /b 1
echo Checkout complete. Verify and apply our patch manifest before building.

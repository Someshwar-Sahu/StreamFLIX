$root = $PSScriptRoot

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\backend'; & '$root\.venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --host 0.0.0.0"

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\backend'; & '$root\.venv\Scripts\Activate.ps1'; celery -A app.workers.celery_app worker --loglevel=info --pool=solo"

# Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\mobile'; npx react-native start"

Start-Sleep -Seconds 3
# Start-Process pwsh -ArgumentList "-NoExit", "-Command", "& 'E:\Android\Extra_Files\platform-tools\adb.exe' reverse tcp:8081 tcp:8081; Write-Host 'adb reverse done — this window can be closed'"

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\web'; pnpm dev"

# Start-Sleep -Seconds 5
# Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\desktop'; pnpm start"

Write-Host "Started: uvicorn, celery worker, metro, adb reverse, web dev server, desktop app."
Write-Host "Remember: start Docker Desktop yourself first if it isn't already running."
Write-Host "Remember: phone must be connected via USB before running this script."
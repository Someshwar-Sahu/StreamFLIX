$root = $PSScriptRoot

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\backend'; & '$root\.venv\Scripts\Activate.ps1'; uvicorn app.main:app --reload --host 0.0.0.0"

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\backend'; & '$root\.venv\Scripts\Activate.ps1'; celery -A app.workers.celery_app worker --loglevel=info --pool=solo"

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\mobile'; npx react-native start"

Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\web'; pnpm dev"

Start-Sleep -Seconds 5
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$root\apps\desktop'; pnpm start"

Write-Host "Started: uvicorn, celery worker, metro, web dev server, desktop app — each in its own window."
Write-Host "Remember: start Docker Desktop yourself first if it isn't already running."
# Wipes the demo tenant and re-seeds: admin@demo.com / admin
Set-Location $PSScriptRoot
pnpm db:reseed

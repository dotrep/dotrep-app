Place flag files here. App should load:
- staging: config/flags/staging.json
- prod:     config/flags/prod.json
Apply rollout by hashing user/session and enabling when hash%100 < rollout.
Status: ready-for-agent

## What to build

Implement photo capture for Photo-type Questions in the Field App. An Inspector can take a photo using the device camera; the image is stored locally on device and linked to the Walkthrough answer. Upload to the server happens in the sync-up queue (#41).

## Acceptance criteria

- [ ] Tapping a Photo Question opens the device camera via Expo Camera or ImagePicker
- [ ] Captured photo is saved to device storage (not just in-memory)
- [ ] A thumbnail of the captured photo is shown on the Question after capture
- [ ] The photo can be retaken (replacing the previous capture)
- [ ] `walkthrough_answers` in SQLite stores the local file path for photo answers
- [ ] Photos marked as required prevent Walkthrough submission if not captured
- [ ] Photos persist across app restarts

## Blocked by

- #34 Walkthrough start + SQLite scaffold

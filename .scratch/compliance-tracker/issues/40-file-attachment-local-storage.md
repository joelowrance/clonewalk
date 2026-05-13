Status: ready-for-agent

## What to build

Implement file attachment for File-type Questions in the Field App. An Inspector can pick a file from device storage; the file is stored locally and linked to the Walkthrough answer. Upload happens in the sync-up queue (#41).

## Acceptance criteria

- [ ] Tapping a File Question opens the device file picker via Expo DocumentPicker
- [ ] Selected file is copied to app-controlled local storage
- [ ] The file name and type are shown on the Question after selection
- [ ] The file can be replaced (selecting a new file replaces the previous)
- [ ] `walkthrough_answers` in SQLite stores the local file path for file answers
- [ ] Files marked as required prevent Walkthrough submission if not attached
- [ ] Files persist across app restarts

## Blocked by

- #34 Walkthrough start + SQLite scaffold

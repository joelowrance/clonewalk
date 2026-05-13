# React Native with Expo for the Field App

The Field App must work fully offline on both iOS and Android. We chose React Native with Expo over a PWA because PWA offline support is unreliable on iOS (Safari's service worker and storage limits are restrictive), and writing two separate native apps would double the maintenance cost. Expo gives us a single codebase with true native offline capability, access to device storage for the local SQLite database, and a managed build/OTA update pipeline.

## Considered Options

- **PWA** — rejected: iOS Safari imposes aggressive storage eviction and inconsistent service worker support, which is unacceptable for a compliance tool used in the field
- **Native iOS + Native Android** — rejected: doubles development and maintenance cost for no meaningful benefit given the team's existing React expertise

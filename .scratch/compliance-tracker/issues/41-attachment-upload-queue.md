Status: ready-for-agent

## What to build

Implement the attachment upload queue per ADR-0006. Photos and files captured during a Walkthrough are queued for upload to the S3-compatible blob store when connectivity returns. Structured Walkthrough data and attachments sync separately.

## Acceptance criteria

- [ ] `attachment_upload_queue` table in SQLite stores local_path, remote_key, status (pending / uploading / uploaded / failed), and walkthrough_answer_id
- [ ] When a photo or file is captured, an entry is added to the queue immediately
- [ ] On reconnect, the app processes the queue: uploads each attachment to the S3-compatible store
- [ ] Successfully uploaded entries are marked `uploaded`; failed entries are marked `failed` and retried on next sync
- [ ] Upload progress is visible in a queue status UI (count of pending/uploading/failed)
- [ ] The Walkthrough can be submitted (structured data synced) while attachments are still uploading — they complete in the background

## Blocked by

- #39 Photo capture + local storage
- #40 File attachment + local storage

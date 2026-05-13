# Attachments Sync via a Separate Background Upload Queue

Photos and files captured during a Walkthrough are large binary payloads that cannot be bundled with the structured Walkthrough data in a single sync operation. We use a two-phase sync: structured Walkthrough data (answers, scores, notes) syncs first as a small JSON payload, then attachments upload in the background via a persistent queue. The server marks a Walkthrough as "pending attachments" until all referenced files are received. Finalization is blocked on the Admin side until all attachments arrive.

This approach avoids timeouts on large payloads, allows the Inspector to leave the field immediately after structured data syncs, and lets attachment uploads resume automatically if interrupted mid-upload.

## Consequences

- The Admin cannot finalize a Walkthrough until all attachment uploads complete
- The sync UI must communicate pending attachment state clearly to both the Inspector and the Admin
- Attachment storage (S3 or equivalent blob store) must be provisioned separately from the database

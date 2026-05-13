# SQLite Local Store for Offline Field App

The Field App stores Walkthrough data in a local SQLite database on the device and syncs to the server when connectivity is restored. This is not a simple cache — it is the primary write store during offline use. We chose SQLite over an in-memory store or AsyncStorage because Walkthroughs can be long (many questions, notes, photos) and must survive app crashes or device restarts mid-inspection. SQLite gives us a durable, queryable local store without requiring a connection.

Conflict resolution strategy (for cases where the same Walkthrough is modified on multiple devices) is not yet decided and must be resolved before the sync layer is built.

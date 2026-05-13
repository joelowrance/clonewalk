# In-Progress Inspections are Locked from Edits

Once any Inspector has started a Walkthrough within an Inspection, the Inspection record is locked — the Admin cannot change the Inspector list, date, or other fields until the Inspection is finalized. This mirrors the Survey locking model (ADR-0004) and eliminates the need for offline conflict resolution logic between Admin edits and Inspector syncs. The Admin can see which Inspections are in-progress and plan accordingly.

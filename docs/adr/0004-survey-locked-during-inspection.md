# Survey is Locked While an Inspection is In Progress

A Survey cannot be edited while any Inspection against it is in a non-finalized state. The Admin must wait until all active Inspections are finalized before modifying the Survey. We chose locking over versioning because versioning requires every Walkthrough to carry a Survey snapshot, complicates scoring comparisons across Inspections, and is difficult to explain to Tenant Admins. Locking is simple, auditable, and consistent with how paper-based regulatory inspections work — you don't change the form while someone is filling it out.

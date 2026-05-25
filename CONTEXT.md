# Compliance Tracker

A multitenant platform for managing compliance surveys across regulated industries. A Tenant builds Surveys for their Locations; Inspectors complete Surveys to earn Certifications.

## Language

### Tenancy

**Tenant**:
A regulatory or accrediting body that uses the platform to manage compliance across the entities it oversees. AABB, a state health department, or a food safety authority is a Tenant — not the businesses being regulated.
_Avoid_: Account, organization, client, company

**Location**:
An entity regulated by a Tenant — a specific blood bank, restaurant, farm, or clinic that must complete Walkthroughs to maintain Certification. Locations are records managed by the Tenant; they are not users of the system.
_Avoid_: Site, facility, branch, property, customer

### People

**Tenant Admin**:
A user within a Tenant who manages users, locations, permissions, and survey configuration.
_Avoid_: Admin, administrator, manager

**Inspector**:
A user employed by the Tenant who travels to a Location and completes a Walkthrough on-site using the Field App.
_Avoid_: Auditor, surveyor, certifier, reviewer

**Role**:
A named, reusable bundle of permissions defined by a Tenant Admin and assigned to users. Users inherit all permissions of their Role, with individual overrides possible per user. Permissions are tenant-wide — not scoped to specific Locations.
_Avoid_: Group, user type, access level

### Surveys

**Survey**:
A versioned set of Questions for an Industry, built by a Tenant Admin. Multiple Survey versions can exist per Industry per Tenant. The most recently created Survey is marked `is_current` and used for new Inspections. Older versions remain active for Locations grandfathered in at the time they scheduled their Inspection. A Survey is not copied per Location — the same Survey version is shared by all Locations using that version.
_Avoid_: Form, checklist, assessment, audit, template

**Inspection**:
A scheduled visit to a Location on a given date, resulting in one or more Walkthroughs. Groups together all Inspectors attending the same visit. Certification is not granted until all Walkthroughs within the Inspection are complete.
_Avoid_: Visit, event, session, appointment

**Walkthrough**:
A single Inspector's completion of a Survey during an Inspection. One Walkthrough per Inspector per Inspection.
_Avoid_: Submission, response, instance, attempt, inspection record

**Question**:
A single compliance check within a Survey. Has an Answer Type, may require additional detail, and contributes to the Walkthrough score. Supports nesting and branching logic.
_Avoid_: Item, field, check, prompt

**Answer Type**:
The format of the response a Question accepts. Known types: True/False, Scored (numeric), Multiple Choice, Photo, File. Photos and Files can be marked required — a Walkthrough cannot be submitted without them.
_Avoid_: Field type, question type, input type

**Point Value**:
The maximum score a Question can contribute to a Walkthrough, set by the Tenant Admin per Question. A True/False question awards full Point Value or zero. A Question flagged as Critical fails the entire Walkthrough if answered unfavorably, regardless of total score.
_Avoid_: Weight, score, grade

**Passing Score**:
The minimum Walkthrough score a Tenant configures for a Survey. A Walkthrough meets Certification requirements only if its score equals or exceeds the Passing Score.
_Avoid_: Threshold, minimum score, passing grade

**Nesting**:
A structural relationship where a Question contains child Questions that are always visible and always required. Purely organizational — no conditionality.
_Avoid_: Sub-questions, child questions, grouped questions

**Branching Logic**:
Conditional rules on a Question that show or hide other Questions based on the current answer. Only list-type Answer Types (True/False, Multiple Choice) can trigger branches. Branches can be multi-level — a revealed Question may itself have Branching Logic. Branching only affects visibility — it never changes Point Values or Critical flags.
_Avoid_: Skip logic, conditional questions, dynamic questions

**Certification**:
The accreditation status granted to a Location after a Tenant Admin finalizes a passed Inspection. Includes an expiry date set by the Admin at finalization. Lost immediately upon a failed Inspection and not restored until the associated Incident is resolved.
_Avoid_: Approval, sign-off, passing

**Finalization**:
The Tenant Admin's review and formal closure of a completed Inspection. The Admin sets the Certification expiry date (on pass) or opens an Incident (on fail) during Finalization. Inspections are not considered complete until Finalized.
_Avoid_: Review, approval, sign-off, closing

**Incident**:
A tracked record of non-compliance opened automatically when a Location fails an Inspection. Closed manually by a Tenant Admin with resolution notes. The Location remains non-certified for the full duration of the open Incident.
_Avoid_: Violation, finding, deficiency, event

### Industries

**Industry**:
A regulatory domain that determines what kinds of Surveys are relevant. Examples: Blood Bank, Ambulatory Health Center, Food Service, Farm.
_Avoid_: Sector, category, vertical

## Relationships

- A **Tenant** has many **Locations**
- A **Tenant** maintains one or more **Survey** versions per **Industry**; the current version (`is_current`) is used for new **Inspections**
- A **Location** is grandfathered into the **Survey** version active at the time its **Inspection** was scheduled
- A **Survey** contains an ordered list of **Questions**
- A **Question** may contain nested sub-**Questions**
- A **Question** may have **Branching Logic** that reveals or hides other **Questions**
- A **Certification** may require sign-off from multiple people [TBD]
- The current **Survey** version is used for any new **Inspection** in a given **Industry** within a **Tenant**
- An **Inspection** groups one or more **Inspectors** visiting a **Location** on a given date; the required Inspector count is set by the Tenant Admin at scheduling time
- Each **Inspector** produces one **Walkthrough** per **Inspection**
- An **Inspection** requires **Finalization** by a Tenant Admin before **Certification** is granted or an **Incident** is opened
- **Certification** expiry date is set by the Admin during **Finalization**
- A failed **Inspection** automatically opens an **Incident**; a Tenant Admin closes it manually with resolution notes
- **Location** records are fully isolated per **Tenant** — no cross-tenant linkage exists

## Flagged ambiguities

- ~~"Inspector" resolved~~
- "Walkthrough" — user used this term; confirm it's the right canonical term for a Location's completion event
- Multiple Choice: each option carries its own point value set by the Admin (graduated, not binary)
- Scored: Inspector enters a value within an Admin-defined range (e.g., 0–10); the system maps it proportionally to the Point Value

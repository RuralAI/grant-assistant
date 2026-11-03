# Grant Assistant v2 — provisioning readiness review (2026-11-03)
Status: NOT READY for production or live disposable-base execution without explicit operator approval.

## Verified implementation
- Pure four-core-table plan and schema inspector.
- Approval-gated executor with durable journal, fail-closed uncertain creates and schema verification.
- Airtable metadata transport (official endpoint, no POST retry).
- File journal (atomic rename, persistent local directory).
- Hardened entrypoint with required exclusive coordinator and local atomic-directory lock.
- Synthetic CI suite covers metadata, journal restart, authorization, ambiguous writes, schema drift and same-ID concurrent calls.

## Release blockers
1. **Distributed execution:** local filesystem lock is not safe across separate machines. Choose a single designated installer host with a shared persistent journal/lock directory, or implement a distributed conditional-create lease with fencing. The current generic executor remains callable without locking; production callers must use the exclusive entrypoint only.
2. **Destination collision:** locks are keyed by installationId, not workspace/baseName. Two independently approved IDs could create same-name bases. Add workspace/name uniqueness preflight and serialized destination coordination, then still reconcile ambiguous creates.
3. **Journal durability:** atomic rename does not guarantee directory fsync; journal save errors after an uncertain POST can leave ambiguous state. Define persistence and recovery protocol, and do not auto-retry.
4. **Schema reality:** metadata creation field options, default primary fields, and checkbox/unknown semantics require live verification. No disposable base has been created. The current inspector checks types and select choices, but not all field options, primary identity, permissions or additional unexpected fields.
5. **Approval binding:** approval currently matches workspace/name/version, but not a cryptographic plan digest or verified operator identity. Bind approval to the exact immutable plan and authenticated principal before production.
6. **Sensitive data:** installer logs/journal permissions and migration data handling require security review; no BTM migration authorized.
7. **Cutover:** migration mapping, full reconciliation, historical operator tables, and delta capture remain unimplemented.

## Next safe step
- Complete hardening tests for destination-level locking and exact-plan authorization.
- Run metadata payload contract validation against Airtable documentation or a separately approved disposable base.
- Request explicit workspace and test-base creation approval. Never infer that approval from development authorization.

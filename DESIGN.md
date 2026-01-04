
# Phase 1: Data Model & Environment

## Collections

*   **Product**
    *   Stores digital text content.
    *   **Why**: Central catalog. We need to store the encrypted text (`contentEncrypted`) here to avoid external storage dependencies (as per "No GridFS/S3" constraint).
    *   **Indexes**: `slug` (unique) for clean URLs.

*   **Order**
    *   Tracks purchase lifecycle.
    *   **Why**: Essential for ecommerce. Links a user (via session/payment) to a `Product`.
    *   **Flow**: `PENDING` -> `PAID` -> (Access Granted).
    *   **Payment**: Abstracted `paymentGateway` field to support future providers (DOKU/Xendit).

*   **AccessToken**
    *   Grants secure access to content.
    *   **Why**: Decouples payment from delivery. Allows us to rate-limit and expire access independently of the order record.
    *   **Why not in Order?**: Cleaner separation. An order might generate multiple tokens (if we supported gifting) or we might want to revoke a token without modifying the Order history. Also allows tracking `usageCount` cleanly.

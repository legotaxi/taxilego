# Architecture rules

- Pass OAuth app intent through a same-origin callback query, and perform privileged role writes only in authenticated server functions using the verified caller ID; this prevents lost intent and client-side role escalation. After deleting a managed-Apple account, offer the hosted Apple grant-revocation flow so deletion meets App Store review requirements.
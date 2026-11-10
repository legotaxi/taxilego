# Architecture rules

- Pass OAuth app intent through a validated same-origin callback query, and perform privileged role writes only in authenticated server functions using the verified caller ID; this prevents lost intent and client-side role escalation.
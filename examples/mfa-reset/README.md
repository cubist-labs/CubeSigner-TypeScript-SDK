# CubeSigner TypeScript SDK: MFA Reset Example

This example demonstrates the MFA reset lifecycle end to end: an org
owner creates a user, that user enrolls a TOTP factor, and then the user's MFA
is reset via CubeSigner's two-step reset flow.

MFA reset exists for users who are locked out of MFA. It has two steps:

1. Owner initiates — `org.resetUserMfaInit(userId)`. An org owner triggers the
   reset; CubeSigner emails a short-lived reset code to the target user.
2. User completes — `CubeSignerClient.resetUserMfaComplete(env, orgId, oidcToken, resetCode)`.
   The user submits their OIDC token plus the emailed code, clearing all of
   their MFA factors so they can log in and re-enroll.

Because step 2 is authenticated by an OIDC token (not a CubeSigner session),
a user who is locked out by broken MFA can still complete the reset: they can
obtain an OIDC token from their identity provider even though they can't finish
a normal session login.

## Prerequisites

- A CubeSigner management session on disk belonging to an org owner
  (e.g. via `cs login`).
- An OIDC token for an identity for the target user. Obtain it however you like:
  - your own IdP (Google, Apple, etc.),
  - CubeSigner email+password via `CubeSignerClient.idpAuthenticate`, or
  - email-OTP via `CubeSignerClient.initEmailOtpAuth`.

The token must carry an `email` claim (the reset code is sent there). The same
token is reused to enroll MFA and to complete the reset, so it must stay valid
for the duration of the run (a few minutes).

By default CubeSigner sends the reset code from its own email sender.
To send it from your own address or customize the subject and body,
configure the reset with `cs org set-email --purpose mfa-reset ...`.

## Running the Example

```bash
npm start
```

The script will:

1. Load the owner session from disk.
2. Prompt you to paste an OIDC token for the target user.
3. Create a third-party (alien) user for that identity.
4. Log in as the user and enroll a TOTP factor.
5. Initiate the reset as the owner — a reset code is emailed to the user.
6. Prompt you to paste the reset code, then complete the reset.
7. Verify the user can now log in with no MFA required.
8. Delete the demo user.

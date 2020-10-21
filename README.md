# Secrets
- localhost:3000: mainpage can login/ register
- /login: enter Email, password, if success: redirect to /secrets
- /secrets: can see all anoonymous secrets which in the database.<br />
when enter /secrets: wouch first check whether you have latest cookies(successfully login information previously)
- /register after success would transfer to the /secrets page, can choose to submit a secret.
- /submit: type in the setences and submit.

### Achieved in 6 security stages:
1. Email and password
2. Encryption using environment variables
3. Hashing password
4. Salting and hashing
5. Cookies and sessions
6. Oauth2.0 (Google account)


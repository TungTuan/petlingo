# PetLingo — Legal & child-safety release checklist

Updated: 2026-09-04. This is an engineering checklist and policy draft, not
legal advice. A qualified reviewer in each launch market must approve the
final text and consent flow.

## Implemented in the repository

- Privacy Policy and Terms are available without login at
  `/?legal=privacy` and `/?legal=terms`, and from Login, Home, and Settings.
- The policies describe the data the current code handles: parent email and
  social identifiers, child nickname/birth year/avatar, learning progress,
  virtual inventory, friends/gifts, server logs, speech recognition, and TTS.
- New email and social registrations require a parent/guardian checkbox. The
  backend records acceptance time plus Terms/Privacy versions. Existing
  accounts with no acceptance—or an older version—see the parent consent gate
  before a child profile loads.
- Child-profile creation is blocked server-side until current legal text has
  been accepted. The UI alone is not trusted.
- Parents can permanently delete their account in Settings; database relations
  cascade-delete child profiles and associated active data.
- Release builds require a real publishing entity and non-placeholder legal
  contact email in `.env.release`.

## Required before public release

1. Replace `VITE_LEGAL_ENTITY` and `VITE_LEGAL_CONTACT_EMAIL` with the actual
   publisher details. Confirm the email is monitored.
2. Have counsel localize and approve the policies for Vietnam, Japan, Korea,
   and every launch market. The app currently provides Vietnamese and English
   legal text; Japanese/Korean interface users receive English text.
3. Choose and implement a legally sufficient **verifiable parental consent**
   method where required. A checkbox plus audit timestamp records acceptance,
   but is not automatically sufficient for COPPA or every local privacy law.
4. Publish the web build at a stable HTTPS URL. Enter direct public policy URLs
   in App Store Connect and Play Console and test them while signed out.
5. Complete Apple App Privacy and Google Play Data safety declarations from the
   actual production build and every enabled SDK—not from this document alone.
6. If entering Apple's Kids Category, add parental gates before every external
   link and future real-money purchase. Confirm every SDK is permitted for
   child-directed apps.
7. Declare target age bands accurately. Do not select adult audiences only to
   avoid Families requirements.
8. Add the production host/database provider, backup and log retention periods,
   data location, and subprocessors to the final policy.
9. Before enabling payments, replace demo purchases with StoreKit/Google Play
   Billing, parental gates, restore-purchase behavior, refund/subscription
   terms, and regional pricing disclosures.
10. Re-review speech recognition on real iOS/Android builds. Platform speech
    services may transmit audio depending on device/account settings; store
    disclosures and policy must match observed production behavior.

## Primary policy references checked

- Apple App Review Guidelines, especially 1.3 and 5.1:
  https://developer.apple.com/app-store/review/guidelines/
- Apple age-appropriate experiences and parental gates:
  https://developer.apple.com/kids/
- Google Play Families Policy Requirements:
  https://support.google.com/googleplay/android-developer/answer/9893335
- Google Play target audience and content setup:
  https://support.google.com/googleplay/android-developer/answer/9867159
- FTC COPPA FAQ (notice, consent, parent rights, retention, and privacy link):
  https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

# Giaoculator S

Giaoculator S is a Chrome extension for the Tsinglan Schoolis student portal.
It adds local GPA calculation, score predictions, login-page customization,
and Microsoft Teams and Outlook integration.

The extension uses Manifest V3 and plain JavaScript. Chrome loads the repository
directly, without a build step.

## Features

- **GPA calculation:** Calculate recent semesters, compare weighted and
  unweighted GPA, and customize course weights.
- **Score predictions:** Edit task scores, add hypothetical tasks, and inspect
  their effect on a subject score and GPA. Nested categories retain their
  proportions.
- **Additional score details:** Display available class averages and maximum
  scores, and attempt to infer hidden or in-grading scores from category data.
- **Course exclusions:** Exclude dropped courses from the subject list and GPA
  for a selected Schoolis account.
- **Page customization:** Choose login backgrounds and light/dark themes, hide
  scores below a threshold, and reveal scores with a scratch-card effect.
- **Microsoft integration:** View Teams assignments inside Schoolis and sync
  classes, Teams assignments, and Schoolis assignments to Outlook calendar events.

The repository also includes an Office preview download helper and a separate
Save My Exams helper. The Save My Exams switch repeatedly clears that site's
local and session storage while enabled.

## Requirements

- Google Chrome with Developer mode enabled for unpacked extensions.
- A signed-in Tsinglan Schoolis student account for grade and assignment data.
- A Microsoft school account in the configured Tsinglan tenant for Teams and
  Outlook features.

Although the manifest matches `*.schoolis.cn`, core API URLs target
`tsinglanstudent.schoolis.cn`. Other Schoolis tenants require code and
configuration changes.

## Install from source

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Select the repository root, which contains `manifest.json`.
6. Open the Schoolis portal and sign in.

The first installation opens a welcome page. Use its settings button or the
extension toolbar popup to open the settings page.

## Settings

| Setting | Purpose |
| --- | --- |
| Calculation range | Disable automatic calculation or calculate up to six recent semesters |
| Login appearance | Choose Bing backgrounds, local images, or online images/videos |
| Theme | Select a light theme, dark theme, or a theme based on time |
| Score hiding | Hide scores below the configured threshold |
| GPA weights | Edit course-name rules and special course weights |
| Course adjustments | Exclude dropped courses for a selected Schoolis account |
| Scratch-card scores | Enable or disable the score reveal effect |

After saving general settings, sign in to Schoolis again to apply the changes.

## Score calculations and predictions

The extension first requests dynamic score details. If those details are
unavailable, the extension reconstructs scores from individual assignments and
exams. It then merges available server semester scores into the local results.

GPA rules include an AP-style bonus and course weights. Eligible Chinese
language and humanities courses combine into a `Chinese Culture` entry.
The GPA weight editor changes how matching courses contribute to the result.

Use the prediction editor in a subject's score details to try different task
scores. **Apply Changes** updates the local GPA calculation.
**Reset to Default** restores the subject's original cached data.
Prediction edits do not submit grade changes to Schoolis.
A full recalculation clears saved prediction data.

Hidden-score inference requires enough category and task data. Multiple hidden
tasks or missing data can prevent a result.

## Microsoft Teams and Outlook

1. Sign in to Schoolis so the extension records the current account.
2. Open the extension settings.
3. Select the Microsoft account binding button.
4. Complete the Microsoft authorization flow with the school account.
5. Return to Schoolis and open the Teams panel from the task page.

The binding associates the Microsoft account with a Schoolis account.
Microsoft features activate when the current Schoolis account matches that
binding.

The Teams panel displays assignments and submission states. Its synchronization
controls create Outlook calendar events for classes and assignment reminders.
The schedule sync checks existing Outlook events before creating class events.

Synchronization checks run when the extension initializes or checks for stale
data. The extension does not register an independent background alarm scheduler.

## Development

The repository has no package installation or compilation step.
After editing, reload the extension on `chrome://extensions`.
For content-script changes, reload the affected website tab as well.

| File | Responsibility |
| --- | --- |
| `manifest.json` | Extension entry points, matches, permissions, and version |
| `background.js` | Score calculations, caches, request rules, authorization, and synchronization |
| `content.js` | Schoolis page UI, GPA display, prediction editor, and Teams panel |
| `content_preload.js` | Login-page appearance at document start |
| `content_instantEdit.js` | Score scratch-card effects |
| `content_scoreTypeHook.js` | Page-world hook for the score visibility configuration response |
| `content_sme.js` | Save My Exams helper |
| `options.*`, `popup.*`, `welcome.*` | Settings, toolbar popup, and onboarding |
| `teamsPanel.html` | Teams panel HTML template inserted into the Schoolis task page |
| `lib/`, `res/` | Bundled libraries and extension assets |

Run basic static checks from the repository root:

```bash
python3 -m json.tool manifest.json > /dev/null
for file in *.js; do
    node --check "$file" || exit 1
done
```

The repository has no automated test suite or CI configuration. Syntax checks
do not validate browser behavior. After a change, verify the affected flow in
the loaded extension:

1. Sign in and check calculation progress, semester switching, and GPA display.
2. Open a subject and check score details and the prediction editor.
3. Save changed settings and check the result after signing in again.
4. For Microsoft changes, check account binding, Teams navigation, and calendar
   synchronization with the configured accounts.

Shared coding-agent instructions are in [AGENTS.md](AGENTS.md).
[CLAUDE.md](CLAUDE.md) imports that file.

## Data and access

The extension stores preferences, score caches, prediction edits, Microsoft
profile data, and tokens in `chrome.storage.local`.
It encrypts the refresh token before storage.
General preferences remain local to the browser profile.

The extension requests `webRequest` and `declarativeNetRequest` permissions to
observe portal requests and substitute local score responses. Storage
permissions persist settings and caches. The `identity` permission starts
Microsoft authorization.

Microsoft authorization requests profile, education, and calendar scopes.
Calendar synchronization writes events to the bound Microsoft account.
Bing backgrounds, online media, and Google Fonts load from external services.

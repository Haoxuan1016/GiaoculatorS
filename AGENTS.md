# Repository guidance

This file contains shared instructions for coding agents in this repository.
`CLAUDE.md` imports this file. Keep development guidance here and installation
instructions in `README.md`.

## Project overview

Giaoculator S is a Chrome Manifest V3 extension for the Schoolis student portal.
Core API requests target the Tsinglan tenant, `tsinglanstudent.schoolis.cn`,
although the manifest matches other Schoolis subdomains.

The extension calculates GPA and attempts to infer hidden or in-grading scores.
It provides local score predictions, customizes the login page, and integrates
Microsoft Teams assignments with Outlook calendar events.
`content_sme.js` provides a separate helper for `www.savemyexams.com`.

The repository uses plain JavaScript, HTML, and CSS. Chrome loads the files
directly. The repository has no build system, `package.json`, test runner, or CI
configuration.

## Development workflow

1. Open `chrome://extensions` in Chrome.
2. Enable Developer mode.
3. Select Load unpacked and choose the repository root.
4. After an edit, reload the extension.
5. After a content-script edit, reload the affected website tab.

Use these commands for basic static checks:

```bash
python3 -m json.tool manifest.json > /dev/null
for file in *.js; do
    node --check "$file" || exit 1
done
```

These checks validate JSON and JavaScript syntax. They do not exercise Chrome
APIs, authenticated Schoolis requests, DOM changes, or Microsoft authorization.
Test changed behavior in the loaded extension.

## Architecture

The extension uses a service worker, isolated content scripts, a page-world
hook, and extension pages. Extension contexts exchange messages and persist
state in `chrome.storage.local`.

### Service worker: `background.js`

Core calculation requests and Microsoft Graph integration live here.
`content.js` also fetches score details and the Teams panel template.

- The top-level `chrome.webRequest.onCompleted` listener watches Schoolis XHRs.
  `StudyAbroad/GetStudentPromotionIdByStudentId` triggers `InitGCalc()`.
  Dynamic-score detail requests trigger page updates.
- `InitGCalc()` starts settings and cache initialization, score calculation, and
  Microsoft feature initialization.
- The top-level `chrome.webRequest.onBeforeRequest` listener watches
  `LearningTask/GetDetail`. It fetches task data and sends hidden-score controls
  and class average/maximum overlays to the page.
- `C_BuildDynamicScoreRule()` creates a synthetic semester score response through
  `chrome.declarativeNetRequest`. `C_CalcGPAForSemester()` can also replace the
  GPA response.
- `M_initDeclaritiveRules()` reserves rule ID `1000` for requests containing
  `&gcalc=noRedirect`. Preserve that bypass when changing request URLs or rules.
- `M_send_comp_msg()` sends messages to the active tab in the current window.
  Preserve this routing behavior unless the task changes it.

### Content scripts

- `content_preload.js` runs at `document_start`. It customizes the login page,
  including local backgrounds and theme selection.
- `content_instantEdit.js` runs at `document_start`. Despite its name, its main
  feature is the score scratch-card effect and related animations.
- `content_scoreTypeHook.js` runs at `document_start` in the `MAIN` world.
  It intercepts page `fetch` and XHR calls to
  `/v2/exam/Exam/ExamAndLearningTaskShowScoreTypeSettings` and returns
  `isOnlyShowPublishedScore: false`.
- `content.js` runs at the default manifest timing. It builds page UI, displays
  GPA and score details, implements the prediction editor, and renders Teams
  assignments. Its main message listener dispatches on `message.type`.
- `content_sme.js` runs only on `www.savemyexams.com`. Its floating switch clears
  that page's local and session storage while enabled.

### Extension UI pages

- `popup.html/js/css` provides the toolbar status/enable button and settings
  link. It also contains legacy campus gateway controls for `4.3.2.1`.
  The current primary button sets `enable_state` to `true`; it does not toggle
  the value.
- `options.html/js/css` saves general preferences, edits GPA weights and course
  exclusions, and starts Microsoft account binding.
- `welcome.html/js/css` provides first-install onboarding and default settings.
  `M_GetSettings()` in `background.js` also supplies defaults.
- `teamsPanel.html` is a web-accessible HTML template. `switchToTeamsPanel()`
  fetches the template and inserts it into the Schoolis task container.
  The code saves the original nodes in a `DocumentFragment` and restores them
  when the user leaves the panel. The panel does not use an iframe.

## Calculation and prediction

The semester calculation path is:

```text
InitGCalc
  -> C_CalcAll
  -> C_GetSemesters
  -> C_CalcSms
     -> C_fillInClassId_V3
     -> C_init_V2Calc
     -> C_fetchOriginalRequest
  -> C_BuildDynamicScoreRule
     -> C_CalcGPAForSemester
```

- `C_init_V2Calc()` first reads `DynamicScore/GetDynamicScoreDetail`. If the
  response cannot supply the detail data, it falls back to `getSubjectGrades()`.
- `getSubjectGrades()` reconstructs categories from task and exam details.
  `ScoreData` groups tasks and normalizes task scores to percentages.
  `C_rollupCompositeCategoryScores()` combines child categories by proportion
  and removes tasks duplicated on parent categories.
- `C_sectionCountsTowardSubject()` determines whether a category contributes to
  the subject score. A composite category can count without direct tasks.
- `C_fetchOriginalRequest()` merges the server's semester scores after local
  calculation. A matching server course overwrites its calculated cache entry.
- `ScoreToGPA()` maps percentages to GPA. High-weight courses receive a `0.5`
  GPA bonus when their mapped GPA is positive. Other course weights affect the
  semester average.
- A special weight of `1.5` means the GPA bonus with a course weight of `1`.
  Other special values set the course weight. Preserve this distinction.
- Eligible Chinese language and humanities scores merge into `Chinese Culture`
  with `2/3` and `1/3` contributions. Check this path when changing GPA rules.
- `courseAdjustRules` excludes dropped courses for a matching Schoolis account.
  `C_courseKeyMatchesName()` preserves word boundaries, so `Computer Science I`
  does not also match `Computer Science II`.

The prediction editor lives in `content.js`, primarily in the `gb*` and `gc*`
helpers. It preserves nested categories and can supplement missing V2 task
lists with V1 data through the `fetchManualAssignmentList` message.

The manual fetch uses a ten-minute `V2PredictCache_v4` cache and calls
`getSubjectGrades(..., false)`. Keep `installRedirectRule` false for this read
path. Enabling the redirect would replace the live detail response with the
prediction data.

Prediction edits update local storage and synthetic responses. They do not
submit grade changes to Schoolis. When changing category calculations, check
both the background calculation and the prediction editor.

Hidden-score inference uses category scores and known task scores. The
interactive path uses `hiddenScoreSessions`; `computeHiddenScoreSilent()` serves
the V1 fallback. Insufficient data or other hidden tasks can prevent inference.

## Microsoft integration

- `M_BindMSAccount()` uses `chrome.identity.launchWebAuthFlow()` with OAuth 2.0
  PKCE. `exchangeForAccess()` refreshes the access token.
- `M_StartMSFeatures()` checks that the bound Schoolis account matches the
  current student before enabling Microsoft features.
- `T_fetchTeamsUserClassesAndAssignments()` fetches classes, assignments, and
  submission states. The implementation includes pagination, timeouts, retries,
  concurrency limits, and retention of cached data when a request fails.
- `T_SyncToTeamsCalender()` reads Outlook events before creating class events.
  It identifies existing events by category, embedded `gcMark`, and event
  fingerprints. Preserve these checks when changing synchronization.
- Teams and Schoolis task synchronization creates Outlook reminder events.
  `T_checkCalenderSync()`, `T_checkTeamsTaskSync()`, and `T_checkXBTaskSync()`
  compare stored timestamps with configured periods when invoked.
- `content.js` requests an outdated-data check every five minutes.
  The repository does not register a `chrome.alarms` scheduler.

## Function-prefix conventions

The codebase uses function prefixes rather than JavaScript modules.

| Prefix | Responsibility | Main location |
| --- | --- | --- |
| `M_*` | Settings, storage, messages, initialization, network rules | `background.js` |
| `C_*` | Semester and subject calculation, GPA, hidden scores | `background.js` |
| `T_*` | Teams, Microsoft Graph, and calendar synchronization | `background.js` |
| `MS*` | Microsoft state and UI | Background and content scripts |
| `Logic_*` | Algorithm helpers | `background.js` |
| `MB_*`, `POP_*`, `fun_*` | Page UI and DOM helpers | Content scripts |
| `gb*`, `gc*` | Prediction categories, scores, and page state | `content.js` |

Follow the surrounding naming and code style when adding functions.

## Message-type conventions

Background-to-page messages use `M_send_comp_msg(type, data, redotimes)` or
`M_send_str_msg(type, value, redotimes)`. The latter wraps the value in
`data.cont`. Page-to-background messages use `chrome.runtime.sendMessage()`.

- `bp-*` carries lifecycle and page-control messages. The main content listener
  accepts `bp`-prefixed messages even when `enable_state` is false.
- `tip_*` displays Notyf notifications.
- `rc_*` updates score and task pages.
- `show_process` and `show_smsCalc_progress` update calculation progress.
- `MS*` and `MSPanel_*` update Microsoft binding and synchronization UI.
- `gb-*` carries gradebook responses.
- `append2Scores` and `appendHiddenScore` update task score displays.

The background has a separate asynchronous listener for
`fetchManualAssignmentList`. The general listener returns without responding to
that message so that it does not close the response channel early.
`applyCourseAdjustments` also sends an asynchronous response.

## Storage conventions

| Key | Contents |
| --- | --- |
| `user_preference` | Calculation range, login appearance, score hiding, scratch-card preference, legacy gateway preference |
| `enable_state` | Message-gating state; `bp`-prefixed page messages bypass the gate |
| `${semesterId}\|${subjectId}` | Legacy subject cache |
| `${semesterId}\|${subjectId}\|${classId}` | Class-scoped subject cache |
| `${semesterId}\|SubjectPerformanceList` | Synthetic semester score response |
| `${semesterId}\|GPAList` | Subject inputs for GPA calculation |
| `gpaList${semesterId}` | Calculated per-course GPA entries |
| `gpa${semesterId}` | Semester GPA, source, server GPA, and removed-subject labels |
| `${semesterId}\|${subjectId}\|CustomAssignmentList` | Saved prediction edits |
| `${semesterId}\|${subjectId}\|V2PredictCache_v4` | Supplemental prediction tasks and cache timestamp |
| `subjectWeightRules`, `specialWeightRules` | Course-name matching and GPA weights |
| `courseAdjustRules` | `{user, type: "dropped", courseKey}` entries |
| `lastLoginUser` | Most recently recorded Schoolis account and previous account |
| `MSUserProfile`, `MSaccessToken`, `MSrefresh_token` | Bound Microsoft profile, access token, encrypted refresh token |
| `MSTasks`, `MS_BeingSynced`, `MSFeaturesSettings` | Teams tasks, synchronization markers, synchronization preferences |
| `MSFeatureEnabled`, `MS_PanelNeedInit`, `MS_ReauthRequired` | Microsoft feature and authorization state |
| `MS_LastSync_Calender`, `MS_LastSync_TeamsTask`, `MS_LastSync_XBTask` | Synchronization timestamps and results |
| `savedPostData` | Legacy campus gateway credentials, if present |
| `lastUpdate` | Last full calculation time in epoch milliseconds |

`buildLegacySubjectKey()` and `buildClassScopedSubjectKey()` construct subject
keys. Keep legacy reads in mind when changing class-scoped data.
`C_BuildDynamicScoreRule()` prefers class-scoped entries when available.

`M_clearCalcedData()` removes keys containing `|` or a case-insensitive `gpa`
match, including prediction history. Check its predicate before adding keys.
`M_checkOutdatedScore()` starts a full recalculation when `lastUpdate` is older
than one day.

## DOM selector strategy

Schoolis uses Angular and class names with changing hash suffixes. Use the
existing selector helpers instead of depending on a complete hashed class:

- `selectByPrefix()` and `selectAllByPrefix()` use class-fragment matching.
- `queryByClassNames()` and `queryAllByClassNames()` normalize hashed tokens and
  preserve exact matching for other class tokens.
- `findHashedClass()` locates the current class name.
- `normalizeSelector()`, `querySelectorStable()`, and
  `querySelectorAllStable()` normalize hashed selectors.

Keep the SPA lifecycle in mind. Schoolis can rebuild a container after tab or
semester navigation. Reuse the existing observers and binding helpers when
changing these views.

## Other development conventions

- Use Chinese or bilingual text in conversation with the user. Use English for
  GitHub messages and commit messages unless the user requests another language.
- Use conventional branch names without a `codex/` prefix.
- When using `6.1sol` as a coding agent, set reasoning effort to at least `xhigh`.
- Before adding complexity for a speculative race or security edge case,
  explain the failure mode, likelihood, and complexity cost. Get user agreement.
- Use `tlang(chineseText, englishText)` for new UI strings.
- Register service-worker event listeners at the top level of `background.js`.
- Keep `CLIENT_ID` in `background.js` consistent with `oauth2.client_id` in
  `manifest.json`. Keep the OAuth scope lists consistent.
  `background.js` defines `TENANT`; the manifest has no tenant field.
- For a version release, update `manifest.json` and the `version` fallback at
  the top of `content.js`. Revise both languages of the update notes in the
  `chrome.runtime.onInstalled` listener. The update heading reads the manifest
  version at runtime.
- Keep runtime code in the current plain-JavaScript structure unless the task
  requires a build or module change.
- Leave bundled vendor files in `lib/` unchanged.
- After a change, run checks for the affected files and verify the changed
  browser behavior. Use authenticated accounts for Schoolis and Microsoft checks.

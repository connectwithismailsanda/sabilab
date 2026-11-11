# SabiLab Workspace: UI/UX Specification

v1.0 draft · 10 November 2026 · Frontend reference. The backend, data model and safeguards stay in [Build Spec v0.2](https://claude.ai/artifact/2sgpoTh4roWpYz1RPfnjhs). A working reference of everything below is the [prototype](https://claude.ai/artifact/8adZ3iLiRaAXNGnThbzEVb).

## 1. Purpose and sources

- **Layout reference:** the video frame the team shared, titled SabiLab Workspace. It has a top bar with scenario, role and timer, a left navigation, a workplace scene panel with labelled objects, and a squad chat panel.
- **What we kept:** the three-part layout, the scenario and role context, the timer, the bell, help and avatar, and labelled objects in the scene.
- **What we changed:** the microphone and emoji buttons are dropped because they do nothing yet. A paperclip now attaches a note. Labels are real interface text, because the reference frame had garbled text baked into the picture.
- **Honest limit:** the reference is a picture. The prototype implements the layout and interactions, but the scene art is still a placeholder illustration until real media is produced.

## 2. Design principles

- **See the place first.** The scene is the main thing on screen.
- **Act in the place.** Look at objects, collect notes, talk to the team, then write your own task.
- **Time is always visible.** The timer stays in the top bar during a simulation.
- **Plain language.** No jargon, and no claim we have not tested.
- **Phone first.** Every feature works by touch and on a narrow screen.

## 3. Screen inventory

| Screen | Purpose | Shell |
| --- | --- | --- |
| Landing | First impression, one clear action, three workplaces | No |
| Sign up and log in | Username and password, consent | No |
| My page | Foundation Check card, workplace cards, activity history, solo practice, data controls | Yes |
| Foundation Check | Five questions, then a suggested workplace and skill | Yes |
| Team setup | Choose AI or real teammates, up to 2 | Yes |
| Brief | Private role facts and the individual task | Yes |
| Workspace | Scene with objects, squad chat, notes, timer | Yes |
| Task | Write the individual recommendation, with notes beside it | Yes |
| Scoring | Short progress while results are prepared | Yes |
| Results | Levels with quotes, where to improve, recommendation, badge | Yes |
| Evidence Card | Shareable summary for employers | Yes |
| Solo practice and solo simulation | Three short simulations and their results | Yes |

## 4. App shell

Shown after login on every screen except Landing and Sign up.

**Top bar**

| Element | Behaviour |
| --- | --- |
| Brand | Mark and name. On phones, the name shortens to SabiLab. |
| Context | Scenario and role during a simulation. Otherwise the current area, such as My page. Hidden on phones. |
| Timer | Visible only in the Workspace. Turns amber near the end. |
| Bell | Opens a list of notifications. A red badge counts unread ones. |
| Help | Opens a short guide. Closes with its button or Escape, and focus returns to the Help button. |
| Avatar | Shows the username’s first letter. Opens My page, Activity history, Delete my data (two taps) and Log out. |

**Navigation** (a left column on desktop, a bottom bar on phones)

| Item | Goes to |
| --- | --- |
| Home | My page |
| Workspace | The running simulation. If none is running, My page with a short message. |
| Check | Foundation Check |
| Practice | Solo practice |
| History | My page, scrolled to Your activity |
| Settings | The account menu |

## 5. Workspace screen

**Desktop layout:** the scene panel on the left takes the remaining width. The chat panel is 360 pixels wide on the right. **Below 900 pixels** the panels stack and the page scrolls.

**Scene panel:** the workplace name, a state tag (Huddle in progress, then Twist active), the scene, the twist banner, an inspect card, a short hint, and a Go to my task button.

**Chat panel:** a title, a close button, chips for the team, tabs for Chat and Notes, the message list, a composer, and a draft-saved line.

| Interaction | Behaviour | Feedback |
| --- | --- | --- |
| Select an object | Shows the inspect card with its text and saves it to Notes. | The dot turns grey, the note count rises, the card says Saved to your notes. |
| Attach a note | The paperclip lists notes. Choosing one inserts its title and text into the message box. | The box is focused so the student can edit. |
| Send a message | The message appears on the right. | A teammate shows a typing indicator, then replies. |
| Twist | The owner’s message is highlighted in amber. | The scene gets an amber outline, the state tag changes, the bell gains one. |
| Collapse chat | The close button hides the chat. An Open chat button appears in the scene header. | Messages that arrive meanwhile raise a notification. |
| Timer ends | The student moves to the Task screen. | The notes stay available there. |
| Go to my task | Moves to the Task screen early. | None needed. |

**Task screen:** the prompt, a card with the student’s notes, a text area, and a Submit button. An empty submission shows a short error and does not proceed.

## 6. Scene media

Version 1 shows an illustrated scene. Each scenario can swap in a looping video with a still poster. The objects are separate buttons placed over the media, so they stay sharp, accessible and editable.

**Media rules**

- Shape: wide, about 2 to 1. If you make 16 to 9, keep the objects inside the central area, because the frame is cropped to fit.
- Camera: locked off, so the objects stay where the buttons are. Loop for 8 to 10 seconds, seamlessly.
- No words, numbers or logos baked into the media. Labels are real text.
- Muted, autoplay, loop, with a poster image shown first and for anyone who prefers reduced motion.
- Keep files small. Test on mobile data before deciding on length or quality.

**Object positions** (percent from the left and top of the frame)

| Scenario | Object | Left | Top | Label sits |
| --- | --- | --- | --- | --- |
| 1 Adaeze’s Fabrics | Ledger | 60 | 58 | Below |
|  | Order sheet | 60 | 22 | Below |
|  | Phone | 72 | 58 | Above |
|  | Fabric shelf | 25 | 34 | Below |
| 2 Funke’s Kitchen | Order board | 23 | 24 | Below |
|  | Gas cylinder | 53 | 67 | Above |
|  | Lunch packs | 79 | 50 | Above |
|  | Phone | 93 | 58 | Left |
| 3 BrightPath Digital | Budget sheet | 50 | 49 | Above |
|  | Calendar | 90 | 27 | Left |
|  | Brief board | 20 | 28 | Below |
|  | Phone | 75 | 64 | Below |

Generated video will not match these exactly. Produce the media first, then move the object positions to fit. They are data, not code.

**Scene art brief (for Canva or any generator)**

Style prompt to start every request: *Warm, softly lit illustrated interior in a stylised 3D look, rounded shapes, matte materials, natural window light, gentle depth of field, rich but calm colours. Locked camera, wide shot, seamless 8 second loop, subtle movement only. No text, letters, numbers or logos. No close-ups of faces or hands.*

| Scenario | Add to the style prompt |
| --- | --- |
| 1 Fabric shop | A small Lagos fabric shop. Shelves of colourful rolled wax-print fabrics on the left, with the blue rolls looking sparse. A cork notice board with pinned papers above a wooden counter in the centre. On the counter, a green ledger book, a desk phone and a calculator. A shopkeeper moves gently behind the counter. |
| 2 Kitchen | A busy small commercial kitchen in Lagos. A wall board with scribbles at upper left, a round wall clock at upper centre, a stove with steaming pots and a red gas cylinder in the centre, and a wooden table at right with neat stacks of white lunch boxes and a phone on its edge. Cooks move gently in the background. |
| 3 Agency studio | A bright open-plan creative studio in Lagos. A wall of colourful sticky notes at left, a desk with a large monitor showing colourful bars of different lengths in the centre, a paper wall calendar with one date circled in red at right, a phone on the desk edge, and a plant at far left. People move gently in the background. |

A shot-by-shot version of these briefs, with an intro sequence for each scenario, can be added if you want an opening clip as well as the loop.

## 7. Visual design tokens (proposed)

| Token | Value | Use |
| --- | --- | --- |
| Header | #14231C | Top bar and landing hero |
| Accent green | #0F6B4F | Buttons, active states |
| Mint | #E3F1EA | Tags, selected nav, inspect card |
| Amber | #E0A21B | Twist, timer warning |
| Surface and background | White and warm cream, with a dark mode | Panels and page |
| Type | System sans-serif. Body 16, labels 11 to 13, headings 20 to 28. | All text |
| Shape | Corner radius 12 to 16, spacing in steps of 8 | Panels, buttons |
| Icons | Simple outline icons, 2 pixel stroke | Navigation, bell, help, paperclip |

## 8. Responsive behaviour

| Width | Behaviour |
| --- | --- |
| Above 900 | Two columns in the Workspace. Left navigation. |
| 760 to 900 | Panels stack and the page scrolls. Left navigation. |
| Below 760 | Bottom navigation. Context text hidden. Brand shortened. |

Touch targets for objects are 44 pixels or larger. Object labels never rely on colour alone.

## 9. Accessibility

- Every object is a button reachable by Tab, activated by Enter or Space, with a clear focus ring and an accessible name.
- The scene picture itself is decorative. All of its information is available through the object buttons and the Notes tab.
- New chat messages are announced politely. Errors use an alert role.
- The help panel traps focus while open and returns it on close. Escape closes menus and the panel.
- Contrast meets accessible levels for text. Test dark mode too.
- Pulsing animation stops when the person prefers reduced motion.

## 10. States

| State | What the student sees |
| --- | --- |
| No history | A short message explaining what will appear |
| No notes | A message saying objects they inspect are saved here |
| Scoring | A three-step progress list |
| Wrong login | One generic message that does not say which part was wrong |
| Storage unavailable | A message that the account cannot be saved here |
| Connection lost | Drafts stay saved, and the session resumes when back online |
| AI reply fails | A plain message that the teammate is unavailable, with a retry (to build) |

## 11. Frontend architecture

**Components (framework-agnostic)**

- AppShell: TopBar, SideNav, Main
- Landing, Auth
- Home: FoundationCard, WorkplaceCards, History
- Workspace: ScenePanel (Stage, Object buttons, InspectCard), ChatPanel (Tabs, MessageList, Composer, AttachMenu)
- TaskScreen, ResultsScreen, EvidenceCard
- SoloList, SoloSimulation, SoloResults
- Shared: Notifications, HelpDialog, Toast

**Data this UI adds to the Build Spec data model**

| Item | Fields | Notes |
| --- | --- | --- |
| notes | session, object id, text, time | Created when an object is inspected. Not scored. |
| events | object\_inspected with object id and time | Already in the data model |
| notifications | message, read flag | Client-side only in version 1 |

Session states and server functions are in Build Spec v0.2, sections 9.

## 12. Acceptance checklist

- [ ] A student can go from Landing to a scored Evidence Card using only the interface, on a phone and on a laptop.
- [ ] The timer shows only in the Workspace, and the Workspace item returns to a running session.
- [ ] Every object works by touch and keyboard, saves a note, and changes its dot.
- [ ] Notes can be attached to a message and appear on the Task screen.
- [ ] A typing indicator shows before every AI message.
- [ ] The twist shows in the chat, the scene, the state tag and the bell.
- [ ] Collapsing the chat hides it and reopening works. Messages that arrive meanwhile raise a notification.
- [ ] Help and menus close with Escape. Focus returns correctly.
- [ ] Nothing in the scene media contains baked-in text.
- [ ] Layout holds at 390, 820 and 1280 pixels wide.

## 13. Open questions

- Who produces the scene media, and by when?
- Is the left navigation item set right, or should some items be merged?
- Do we add a dark-mode review before launch?
- Do testers notice and use the objects without being told?

Design Prompt: Tagthr – Prioritized Responsive UI
Project Identity
Product: Tagthr – Real‑time synchronized media platform
Tagline: Watch together. Sync instantly.
Key differentiators: No registration, 30‑participant limit, host auto‑promotion, private PIN rooms, live chat.
Design mood: Dark, cinematic, high‑tech – optimized for video viewing. Accent colors: neon purple (#8B5CF6) and cyan (#06B6D4) on dark backgrounds (#0A0A0A to #1A1A1A).

Prioritized Pages (Build in this order)
1. 🎥 Watch Party Session Page (PRIORITY 1 – Core experience)
Purpose: Where the synchronized viewing and chat actually happen.

Required UI elements (derived from technical spec):
Video player area (top/left, ~70% width on desktop)

Embeds YouTube/Vimeo or custom video URL

Custom HTML5 controls (play, pause, seek) – only visible to the host

Participant sidebar (right, ~30% width)

Shows up to 30 avatars/initials + online status (green dot)

Crown icon next to host

Current participant count: X / 30

Chat panel (below participant list or tabbed)

Message list (username = Anonymous#1234 style)

Report button (flag icon) on each message

Rate‑limit warning: “Slow mode: 10 msg / 30s”

Input field + send button

Session header (top bar)

Room slug (e.g., room‑abc123) with copy button

PIN lock icon (private rooms) – click to enter/view PIN

Heartbeat status indicator (green/yellow/red dot) showing connection health

“Leave session” button

Host‑only controls (visible only to current host)

“Change video URL” input + update button

“Kick/ban” dropdown next to each participant

“End session” button (red)

Non‑host view:

Playback is read‑only – they see video synced, no local controls

Message: “Host is controlling playback”

Responsive behavior:
Device	Layout
Desktop (≥1024px)	Video left (70%), participant+chat right (30%)
Tablet (768–1023px)	Video full width top, participant+chat below as two columns
Mobile (≤767px)	Video full width, participant list collapsed into drawer (slide‑up), chat full width
Interactive notes (for prototyping):
Hover on participant → show “last seen” tooltip (from heartbeat)

Click “report” → confirm modal, then toast “Reported to host”

Host clicks “kick” → participant removed from list, WebSocket disconnected (simulate)

Heartbeat dot flashes on each 30s ping

Fixes incorporated from technical review:
Host promotion indicator: If host leaves, a system message appears: “New host promoted: Anonymous#1234”

Session full prevention: Show disabled join UI when 30/30, with message “Room is full”

Token persistence: No login, but user sees their assigned anonymous name (based on token hash)

2. 🚪 Create / Join Landing Page (PRIORITY 2 – Entry point)
Purpose: Frictionless session creation and joining.

UI elements:
Hero section

Headline: “Watch together. Sync instantly.”

Subheadline: “No accounts. No downloads. Just a link.”

Two primary CTAs (side‑by‑side, full width on mobile):

+ New Party (large purple gradient button)

Join Room (cyan outline button)

Join modal (triggered by secondary button)

Input: “Room slug” (e.g., room-abc123)

Input: “4‑digit PIN” (optional, reveals only if room is private)

Button: Join →

How it works (3 simple steps, horizontal on desktop, vertical on mobile)

Create or join a room
Add a video URL (YouTube, Vimeo, etc.)
Invite friends – everyone stays synced
Footer with links to Legal page (DMCA, Privacy, Terms)

Responsive notes:
Hero text centered on mobile, left‑aligned on desktop with a floating abstract graphic (waveform + video frame outlines).

CTAs stack vertically on mobile.

Fixes:
No “Login” or “Sign Up” buttons anywhere – fully anonymous.

Rate‑limit feedback: If IP creates >3 active sessions, show warning.

3. 📄 Legal & Compliance Page (PRIORITY 3 – Required for launch)
Purpose: DMCA takedown, privacy policy, terms of service.

UI elements:
Tabs or accordion sections:

DMCA Takedown Notice – form fields: Full name, infringing URL, description, signature (checkbox “I swear under penalty of perjury”), submit button.

Privacy Policy – plain text explaining: IP logging, participant tokens, 24‑hour cookies, data retention for legal requests.

Terms of Service – prohibited content (copyrighted movies, malware), age restriction (13+ or 18+ depending on jurisdiction), liability waiver for user‑submitted URLs.

Footer back to homepage.

Fixes:
Explicit statement: “Video URLs are proxied and logged for compliance.”

Contact email for legal requests.

Design System (Apply across all pages)
Colors (dark theme)
Background: #0A0A0A (primary), #1A1A1A (cards/sidebars)

Primary accent: #8B5CF6 (purple)

Secondary accent: #06B6D4 (cyan)

Success/active: #10B981 (green heartbeat)

Warning: #F59E0B (amber)

Danger/kick: #EF4444 (red)

Text: #F3F4F6 (headings), #9CA3AF (body)

Typography
Headings: Inter, Bold (sizes: 48px hero, 32px section, 20px card)

Body: Inter, Regular (16px)

Chat messages: Inter, 14px

Buttons: Inter, Medium (14px–16px)

Spacing & Grid
Max container width: 1280px, padding: 2rem desktop, 1rem mobile

Grid gaps: 24px desktop, 16px mobile

Auto‑layout used for all components

Components (create as Figma components)
Button (5 variants: primary, secondary, danger, ghost, icon‑only)

Participant row (avatar, name, host crown, kick button)

Chat message bubble (with report flag)

Heartbeat indicator (dot with pulse animation)

Video player mockup (with overlay controls for host)

Deliverables for Figma
Three frames for each of the 3 priority pages (Desktop, Tablet, Mobile) – 9 frames total.

Component library with all reusable UI elements.

Style guide page with colors, text styles, effects.

Prototyping connections (minimal):

Landing page “New Party” → Session page (new room)

Landing page “Join Room” → Session page (existing room via modal)

Session page “Leave” → Landing page


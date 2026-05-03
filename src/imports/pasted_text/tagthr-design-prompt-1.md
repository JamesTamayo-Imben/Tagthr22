Design Prompt (with Create Party Functionality & Mission Page)
Product Identity
Name: Tagthr (pronounced tag-ger)
Meaning: Tag = inviting/tagging friends to watch together + thr = together
Tagline: Tag along. Watch together.
Mission: Remove barriers to shared viewing – no accounts, no friction, just real‑time sync.
Vision: A global living room where anyone can instantly share a moment, a movie, or a memory.

Prioritized Pages (Updated Order)
Priority	Page	Purpose
1	Watch Party Session Page	Core synchronized viewing + chat
2	Create / Join Landing Page	Frictionless entry & session creation
3	About / Mission Page	Explain the “why” behind Tagthr (NEW)
4	Legal & Compliance Page	DMCA, privacy, terms
Priority 1 – Watch Party Session Page
(Same as previously defined – see earlier prompt for full details)

Key elements retained:

Video player (host controls visible only to host)

Participant sidebar (up to 30, host crown, heartbeat status)

Live chat with report button & rate limiting

Session header (slug, PIN, copy link)

Host tools (kick/ban, change URL, end session)

New functional notes for “Create Party” integration:

When a user clicks + New Party on the landing page, a session is created before redirecting to this page.

The user arrives already authenticated as host (via participant token stored in cookie).

The session slug appears in the URL and header.

Priority 2 – Create / Join Landing Page (Updated)
Functional Requirements for “Create Party”
When user clicks + New Party button:

Frontend sends POST /api/session/create (no body needed – backend generates slug)

Backend (Laravel) creates:

Unique 6‑8 character slug (e.g., k9m2pq)

Optional: generates a random 4‑digit PIN only if user checks “Make private”

Stores host_token = participant token from cookie (or creates new participant)

Sets session expiration (24 hours)

After successful creation, redirect browser to /party/{slug}

The session page loads with the user as host

UI elements on landing page (updated):

Hero section (same as before)

Two CTAs:

+ New Party (primary) – direct creation

Join Room (secondary) – opens modal for slug + optional PIN

Checkbox for “Make private (4-digit PIN)” – appears after clicking New Party? Better to show a small inline toggle. Keep simple: on click of New Party, instantly create a public room. Provide a separate “Create Private Party” link? For MVP, assume public by default. But to satisfy PIN requirement, add a dropdown or second button “New Private Party”. I recommend: two buttons side by side:

+ Public Party (instant)

🔒 Private Party (opens modal to set PIN, then creates)

How it works section (3 steps)

Footer with links to About (new) and Legal

Responsive & Design: same as before.
Priority 3 – About / Mission Page (NEW)
Purpose: Explain the concept, the name, the vision, and why Tagthr exists.

Page Structure
Hero Section (smaller, internal page)
Headline: “What is Tagthr?”

Subheadline: “Real‑time viewing. Zero friction. Total togetherness.”

The Name & Meaning
Tagthr (pronounced tag-ger)

Breakdown:

Tag – Like tagging a friend in a post. Invite, nudge, include.

thr – Short for together. Because watching alone is silent; watching together is magic.

Visual: Animated play button transforming into a group of dots.

Mission Statement
“To make shared media as easy as sharing a link. No accounts, no downloads, no excuses. Just you, your friends, and perfect sync.”

Vision
“A global living room where distance disappears – frame by frame.”

Core Goals (3–4 bullet points with icons)
Icon	Goal
🚪	Zero‑barrier entry – No registration, ever.
⚡	Perfect sync – Real‑time playback across 30 participants.
🔒	Safe & responsible – Private rooms, moderation, and DMCA compliance.
🧩	Any media, one link – Works with YouTube, Vimeo, and more.
The Problem We Solve
Short paragraph: “Synchronizing a movie over a video call is clunky. Services require logins. Tagthr removes the friction.”

Meet the Host (Optional – if you want a human element)
Explain automatic host promotion: “If the host leaves, the next active person takes over. The show goes on.”

Call to Action
Buttons: Start a Public Party and Learn How It Works (links to landing page or a tutorial)

Design Notes
This page is lighter in tone – use the same dark theme but with more card backgrounds.

Add a small waveform animation or group silhouette to evoke togetherness.

Ensure responsive: text stacks on mobile, icons above headlines.

URL & Navigation
Accessible via footer link “About” or “Our Mission”.

Also add to main navigation (replacing “How It Works” or as a new tab).

Priority 4 – Legal & Compliance Page
(Unchanged from previous prompt – DMCA, privacy, terms)

Updated Navigation Bar (across all pages)
Logo: Tagthr (left)

Menu: Home (landing) | Create Party (direct – same as +New Party) | About (new mission page) | Legal

Right side: Join Room (small input + button) – quick join.

Functional Flow Summary (to prototype in Figma)
Landing page → Click + Public Party → redirect to session page (new slug)

Landing page → Click 🔒 Private Party → modal asking for 4-digit PIN → create session with PIN → redirect

Landing page → Join Room → modal for slug + PIN (if private) → redirect to session page

Session page – Host controls visible. Host can copy invite link (includes slug, PIN if private)

Session page – If host leaves (simulate in prototype), show system message and new host crown moves.

About page – accessible from nav or footer.

Updated Design System (same as before)
Dark theme, neon purple/cyan

Typography: Inter

Components: buttons, participant rows, chat bubbles, heartbeat indicator, modal overlays.

Figma Deliverables
Frames for each priority page (Desktop, Tablet, Mobile) – 4 pages × 3 = 12 frames.

Component library (buttons, modals, participant list, chat message)

Style guide

Prototyping connections:

Landing → Session (create flow)

Landing → Modal (join)

Session → About (via nav)

About → Landing (via CTA)


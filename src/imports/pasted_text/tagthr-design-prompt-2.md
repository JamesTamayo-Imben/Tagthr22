Design Prompt (with Movie Search & Professional Iconography)
Product Identity
Name: Tagthr (pronounced tag-ger)

Meaning: Tag (invite friends) + thr (together)

Tagline: Search, Sync, Share. Together.

Mission: Remove barriers to shared viewing – no accounts, no friction, just real‑time sync powered by a vast media library.

Design System (Updated)
Colors: (unchanged) Dark theme with neon purple (#8B5CF6) and cyan (#06B6D4) accents.

Typography: (unchanged) Inter throughout.

Iconography (CRITICAL UPDATE – No Emojis Allowed):

Use only professional vector icon sets: Feather Icons (free, MIT), Heroicons, Lucide, or Font Awesome 6.

All icons must be consistent in stroke width (2px recommended), filled on hover, and properly sized (24x24px for interactive, 20x20px for inline).

Maintain a flat, modern style with no colored backgrounds unless part of a badge.

Function	Icon Name(s)	Set Examples
Search	search, magnifying-glass	Feather, Heroicons
New Party/Add	plus, plus-circle, video	Feather, Lucide
Join Room	log-in, door-open, users	Heroicons, Font Awesome
Private Room	lock, key	All
Copy Link	copy, link	Feather
Chat / Comment	message-circle, comment	Feather, Heroicons
Send Message	send	Feather
Report	flag	Feather, Heroicons
Kick/Ban	user-x, shield-alert	Lucide, Heroicons
Play/Pause	play, pause	All
Volume	volume-2, volume-x	Feather
Expand Screen	maximize, minimize	Feather
Crown/Host	crown	Font Awesome
Heartbeat Status	wifi, activity	Feather, Lucide
Thumbs Up	thumbs-up	All
Close Modal	x	All
🎬 NEW! Integrated Media Search (Powered by Free GitHub API)
API Source
GitHub Repository: Free-Movie-Series-DB-API

No API Key Required – Completely free and anonymous

Provides movie titles, posters, descriptions, genres, ratings, and cast

Search functionality for both movies and TV series

API Endpoint (for developers)
text
https://imdb.iamidiotareyoutoo.com/search?title={query}
Returns JSON with:

title – Movie/Series name

year – Release year

type – "movie" or "series"

imdb_id – Unique identifier

poster – Direct image URL

How the Search Feature Works in Tagthr
On the Create / Join Landing Page (Priority 2):

Search Bar prominently placed below the hero section

User types a movie or series name

Live Results appear as cards (poster + title + year + type icon)

Two action buttons on each result:

Preview – Opens modal with full details (synopsis, cast, rating)

Select & Create Party – Automatically fetches the media, pre-fills the video URL, and creates a new room

On the Watch Party Session Page (Priority 1):

Host-only "Change Media" button that opens the same search modal

Allows host to switch to a different movie/series mid-party (broadcasted to all participants)

Rich metadata displayed: poster, synopsis, IMDb rating.

Key Design Requirements:

Search input should have debouncing (micro-interaction) for smooth API calls

Loading states with skeleton placeholders on result cards

Error state for no results or API failure (with a fallback to manual URL entry)

Responsiveness: On mobile, results stack vertically; on desktop, grid layout (3-4 columns).

Updated Prioritized Pages (Integrating Search)
Priority 1 – Watch Party Session Page
(Unchanged from previous design, plus:)

Host-Only Section: "Change Media" button (icon: music or film) that triggers the Search Modal.

Media Info Bar: Below video player, show current movie/series title, poster thumbnail, and IMDb rating (if available).

Search Modal (NEW): Full-screen overlay on mobile, centered modal on desktop featuring:

Search input with clear button

Results grid

Preview & Select buttons

Priority 2 – Create / Join Landing Page (Updated with Search)
Page Structure:

Hero section (same tagline)

Action Buttons: + New Party and Join Room

Search Section (NEW – replaces earlier "How it Works" placement):

Headline: "Or start with a movie or series"

Search bar with placeholder: "Search for a movie or TV series..."

Below: Trending/Popular Picks (static mockup of 6 cards with posters from API)

How it Works (3 steps)

Footer

Why This Works: The search feature becomes a powerful entry point – users can discover content before even creating a room.

Priority 3 – About / Mission Page (with Icon-Rich Layout)
Page Structure:

Hero Section:

Headline: "What is Tagthr?"

Subheadline: "Real-time viewing. Zero friction. Total togetherness."

The Name & Meaning:

Tagthr (pronounced tag-ger)

Tag (icon: user-plus) – Invite friends with a link

thr (icon: users) – Together in perfect sync

Visual: Animated play button transforming into three connected dots.

Mission Statement:

"To make shared media as easy as sharing a link. No accounts, no downloads, no excuses. Just you, your friends, and perfect sync."

Vision (icon: globe or eye):

"A global living room where distance disappears – frame by frame."

Core Goals (Icon + Text cards):

Goal	Icon	Description
Zero-Barrier Entry	log-in (Heroicons)	No registration, ever.
Perfect Sync	repeat (Feather)	Real-time playback across 30 participants.
Safe & Responsible	shield (Lucide)	Private rooms, moderation, and DMCA compliance.
Smart Search	search (Feather)	Find movies & series using our free media API.
The Problem We Solve:

Short paragraph with alert-circle icon.

Meet the Host:

crown icon + explanation of auto-promotion.

Call to Action:

search button: "Find a Movie to Watch"

video button: "Start a Public Party"

📱 Responsive Behavior – Complete Specifications
Breakpoints & Layouts
Breakpoint	Layout Changes
Desktop (≥1280px)	Fixed max-width 1280px, centered content. Margins: auto. Grid gaps: 24px.
Laptop (1024–1279px)	Padding: 2rem. Grid gaps: 20px. Sidebar on session page remains visible.
Tablet (768–1023px)	Padding: 1.5rem. Session page: video full width, chat below (horizontal). Search results: 2 columns.
Mobile (481–767px)	Padding: 1rem. All sections stacked vertically. Search results: 1 column full width. Modal becomes full-screen overlay. Sidebars become slide-up drawers (chat) or bottom sheets (participants).
Small Mobile (≤480px)	Same as mobile but with smaller font (14px body, 32px hero). Touch targets minimum 44px.
Critical Responsive Elements
Search Bar:

Desktop: 600px width, centered

Mobile: 100% width, full-bleed

Search Results Grid:

Desktop: 4 columns

Tablet: 3 columns

Mobile: 2 columns (tight) → on small mobile: 1 column

Poster Images:

Use object-fit: cover with consistent aspect ratio (2:3 recommended)

Lazy loading with low-quality placeholder (LQIP) effect

Navigation:

Desktop: horizontal menu

Mobile: hamburger menu (icon: menu) with slide-out drawer

Modals:

Desktop: centered, max-width 800px

Mobile: full-screen with close button (x) at top-left

🎨 Component Library (Updated)
New Components for Search
SearchBar (component):

Input field with search icon (left)

Clear button (x icon) appears when text length > 0

Loading spinner inside input when API call in progress

Variants: Desktop, Mobile

SearchResultCard (component):

Image (poster) placeholder (skeleton loading)

Title, year, type badge (movie vs series)

Icons: film for movie, tv for series

Buttons: Preview (eye icon), Select (plus or play icon)

MediaDetailModal (component):

Poster (left side on desktop, top on mobile)

Title, year, IMDb rating (star icon), genres

Synopsis

Cast (horizontal scrollable list on mobile)

Button: "Create Party with this Media" (primary)

TrendingRow (component):

Static placeholder cards (8-12 items) for "Popular searches" section

Horizontal scroll on mobile, grid on desktop

🔧 Functional Flow – Updated with Search
Search-Based Party Creation:

User lands on home page

Types "Inception" in search bar

Results show "Inception (2010)" with poster

User clicks "Select"

Modal opens with full details

User clicks "Create Party with this Media"

Backend creates session with pre-filled video URL (mapped from IMDB ID to a YouTube trailer or embedded source)

User redirected to session page as host, media metadata displayed

Fallback for Missing Video URL:

If API doesn't provide direct video link, prompt host: "Enter the video URL manually (YouTube, Vimeo, etc.)"

📋 Final Deliverables Checklist for Figma
12 responsive frames (4 pages × 3 breakpoints)

Style guide with colors, typography, icon library

Component library including:

All buttons (primary, secondary, icon-only, danger)

SearchBar (desktop & mobile variants)

SearchResultCard

MediaDetailModal

TrendingRow

Prototyping connections:

Search → Select → Modal → Create Party → Session Page

Landing CTAs → Session Page

Responsive testing notes for each breakpoint

📚 Developer Notes (to include as comments in Figma)
API Rate Limits: Approximately 100 requests per minute (no official limit documented, but be gentle).

Poster Image CDN: Use https://image.tmdb.org/t/p/w500{poster_path} for high-quality images.

Icon Implementation: Recommend using Font Awesome 6 Free CDN or Feather Icons via NPM.

Accessibility: Ensure all icons have aria-hidden="true" and accompanying text for screen readers.
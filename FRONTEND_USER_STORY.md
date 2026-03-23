# Corpers Connect — Frontend (User App) User Story Document

**Version:** 1.0.0
**Date:** 2026-03-22
**Status:** Planning Phase

---

## 1. Overview

The Corpers Connect user app is the primary client application used by Nigerian corps members. It is a **Progressive Web App (PWA)** built with **Next.js 14+ (App Router)**, styled with **Tailwind CSS**, and powered by the Corpers Connect backend API. It must feel native on mobile devices while also working on desktop browsers.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | Zustand |
| Server State | TanStack Query (React Query) |
| Real-time | Socket.IO client |
| Forms | React Hook Form + Zod |
| Media | Cloudinary SDK |
| Calls | Agora Web SDK |
| Push Notifications | Firebase JS SDK |
| Payments | Paystack.js |
| PWA | next-pwa |
| Animations | Framer Motion |
| Icons | Lucide React |

---

## 3. User Screens & Flows

### 3.1 Onboarding & Authentication

#### State Code Lookup Screen
- Single bold input field for state code (e.g. `KG/25C/1358`).
- Format hint shown below the input.
- "Verify My Code" button.
- On success: transitions to the registration confirmation screen.
- On failure: clear, friendly error message ("We couldn't find this state code. Please check and try again.").

#### Registration Confirmation Screen
- Shows fetched NYSC details in read-only fields: Full Name, Email, Phone, Serving State, Batch.
- "Is this you?" confirmation prompt.
- "This is me — Continue" button.
- "That's not me" link (re-enters state code).
- Password + Confirm Password fields.
- Terms of service checkbox.
- On submit: OTP sent to the shown email.

#### OTP Verification Screen
- 6-digit OTP input (individual digit boxes, autofocus).
- Countdown timer (10 minutes).
- "Resend OTP" link (active after 60 seconds).
- On success: account created, redirect to onboarding.

#### Login Screen
- Email or State Code input.
- Password input.
- "Forgot Password?" link.
- Login button.
- 2FA challenge screen (if 2FA enabled): same 6-digit OTP input.

#### Forgot Password Flow
- Enter email → receive OTP → enter OTP → set new password.

#### First-Time Onboarding (post-registration)
- Step 1: Upload profile picture.
- Step 2: Write a short bio.
- Step 3: Suggested corpers from the same serving state (follow suggestions).
- Step 4: Prompt to activate Corper Tag.
- "Get Started" → navigates to Home Feed.

---

### 3.2 Main Navigation

Bottom navigation bar (mobile) / Left sidebar (desktop):
1. **Home** (feed)
2. **Discover** (search + suggestions)
3. **Create** (+) — post, story, reel
4. **Messages** (chats)
5. **Profile**

Top bar:
- App logo (left)
- Notifications bell icon (right) — badge count
- Stories tray (horizontal scroll at the top of the feed)

---

### 3.3 Home Feed

- Infinite scroll (cursor-based pagination).
- Stories tray at the top (horizontal scroll of active stories).
- Post cards with: profile picture, name, corper tag badge, level indicator, timestamp, content, media, reaction bar, comment count, share button.
- Reaction options: tap-to-like, hold-to-pick emoji (like, love, fire, clap).
- Inline comment preview (top 2 comments shown).
- "View all X comments" → expands comment section.
- Share button → opens share sheet (share to DM, share to story, copy link).
- Bookmark icon on post.
- Visibility indicator (globe = public, state flag = state-only, etc.).
- Pull-to-refresh.
- New posts available banner ("X new posts — tap to refresh").

---

### 3.4 Create Post Screen

- Rich text editor with mention (@username) support.
- Media picker: camera, gallery, multiple images.
- Video upload with thumbnail picker.
- Visibility selector (dropdown): Public, My State, Friends, Only Me.
- Post as Opportunity toggle (converts to structured opportunity post).
- Character count.
- Post / Cancel buttons.

---

### 3.5 Stories

- Stories tray on home feed.
- Tapping a story shows it full-screen with a progress bar.
- Swipe left/right to navigate between stories.
- Tap to pause / hold.
- Reply to story → opens DM input at the bottom.
- View count shown (own stories only).
- Story creator screen: camera view / gallery pick, add text, add stickers, draw.
- Story highlights on profile page.

---

### 3.6 Reels

- Dedicated Reels tab / section.
- Full-screen vertical scroll (TikTok-style).
- Like, comment, share controls on the right edge.
- Record / upload reel from Create screen.
- Trending reels surface in Discover.

---

### 3.7 Profile Screen

#### Own Profile
- Profile picture with optional Corper Tag overlay.
- Full name + `@username` + level badge (Otondo / Kopa / Corper).
- Verified badge (if verified).
- Serving state, batch, bio.
- Stats: Posts count, Followers, Following.
- Tab bar: Posts | Reels | Highlights | Bookmarks.
- Edit Profile button.
- Settings gear icon.

#### Other User's Profile
- Same layout minus Edit/Settings.
- Follow / Unfollow button.
- Message button (opens DM).
- Corper Tag badge.
- Mutual followers count.

---

### 3.8 Edit Profile Screen

- Change profile picture.
- Edit bio.
- Toggle Corper Tag on/off.
- View serving state / batch (read-only — from NYSC data).

---

### 3.9 Discover / Search Screen

- Search bar at the top.
- Search by: name, state code, serving state.
- Results: users, posts, opportunities, marketplace listings.
- "Corpers in [Your State]" section.
- "You May Know" suggestions.
- Trending posts section.
- Trending reels section.
- Top Mami Market picks.

---

### 3.10 Messaging (Corpers Chat)

#### Conversations List Screen
- Pinned conversations at top.
- Recent conversations list with last message preview.
- Unread message count badge.
- Archive folder access button.
- Online indicator (green dot).
- Long-press → Archive, Pin, Mute, Delete.

#### DM Chat Screen
- Message bubbles (own: right/green, other: left/white).
- Message types: text, image, voice note, video, file.
- Voice note player with waveform.
- Delivery status icons (sent / delivered / read ticks).
- Reply to message (swipe right on a message).
- Tap to react with emoji.
- Long-press message: Copy, Reply, Forward, Delete, Edit.
- "Typing…" indicator.
- Media previewer on tap.
- Top bar: avatar, name, online/last seen status, call icons (voice + video).

#### Group Chat Screen
- Same as DM but shows sender name above each message bubble.
- Group info: name, picture, member list, admin controls.
- Invite via link.
- Pin messages.

#### Voice Note Recording
- Hold mic button to record.
- Swipe left to cancel.
- Release to send.
- Waveform animation during recording.

#### New Chat / Group
- Search bar to find users.
- Multi-select for group creation.
- Group name + picture input.

---

### 3.11 Voice & Video Calls

- Call screen with: avatar/video feed, mute, speaker, flip camera, end call buttons.
- Incoming call screen: caller name, accept / reject.
- Call log in the chat screen header or separate call log tab.
- Group call UI (grid or speaker view).

---

### 3.12 Notifications Screen

- Chronological list of notifications.
- Notification types shown with icons: follow, like, comment, mention, DM, missed call, market inquiry, system.
- Tap → navigates to the relevant content.
- Mark all as read button.
- Notification settings link.

---

### 3.13 Mami Market

#### Market Home Screen
- Category filter chips (All, Housing, Uniforms, Electronics, Food, Services, Opportunities).
- Search bar.
- Filter / Sort: by state, price range, verified seller only, newest first.
- Grid of listing cards: image, title, price, seller name, state, time posted.
- "Sell Something" FAB button.

#### Listing Detail Screen
- Image gallery (swipeable).
- Title, price, category, location.
- Seller profile card (name, avatar, verified badge, response rate).
- Description.
- "Send Inquiry" button → opens DM with listing context.
- Report button.
- Similar listings section.

#### Create Listing Screen
- Title, description, category, listing type (sell / rent / service / free).
- Price input (or "Free" toggle).
- Images upload (up to 10).
- Location picker (serving state + LGA).
- Preview before publish.

#### My Listings Screen
- Active, Sold, Inactive tabs.
- Edit, Mark as Sold, Delete actions.
- Boost listing (Premium).

#### Verified Seller Application Screen (Premium)
- Upload government ID.
- Submit for admin review.
- Status: Pending / Approved / Rejected.

---

### 3.14 Opportunities

- Opportunities feed separate from main feed.
- Post opportunity (structured form: title, org, description, deadline, link, location).
- Save opportunity.
- My saved opportunities.
- Admin-featured opportunities shown at top.

---

### 3.15 Subscription Screen

- Current plan shown.
- Premium plan benefits listed clearly.
- "Go Premium" CTA.
- Paystack payment modal.
- Success / failure state.

---

### 3.16 Settings Screen

- **Account**: email, phone, state code (read-only), change password.
- **Privacy**: account privacy (public/private), block list, who can message me.
- **Notifications**: granular per-event toggles.
- **Security**: 2FA enable/disable, active sessions.
- **Appearance**: dark mode toggle.
- **Subscription**: plan + manage.
- **Help & Support**: FAQ, contact support.
- **Logout**.
- **Delete Account**.

---

### 3.17 Memories

- On the anniversary of joining, the app shows a "Memory" notification.
- Tapping the notification opens a memory viewer: "X years/months ago you posted this..."
- User can re-share the memory as a new post or story.

---

### 3.18 Corper Tag

- Toggle in profile settings.
- When active, the profile picture shows a coloured banner with the serving state name at the bottom (e.g. "Kogi Corper").
- Generated as an overlay on the Cloudinary image URL.
- Available tag styles: state name + NYSC green.

---

### 3.19 Level & Badge System

- Level visible on profile and post cards.
- Level progression notification when user levels up.
- Badge displayed as a small icon next to the name.
- "Your Progress" card in profile showing current level and what it takes to reach the next.

---

## 4. Design Principles

- **Mobile-first**: Primary usage will be on mobile. Design for small screens first.
- **NYSC Brand Colours**: Green (`#008751`), White, and accents of the NYSC khaki/olive.
- **Fast & Lightweight**: Optimistic UI updates; skeleton loaders.
- **Offline Support**: PWA with service worker; cached feed for offline reading.
- **Accessibility**: ARIA labels, contrast ratios meeting WCAG AA.
- **Nigerian Context**: Lagos / Abuja / state names, Naira symbol (₦), Nigerian phone formats.

---

## 5. Key Frontend User Stories (Acceptance Criteria Format)

### US-001: Register with State Code
> As a corps member, I want to register using my NYSC state code so that my identity is verified by NYSC before I join the platform.

**Acceptance Criteria:**
- Given I enter a valid state code, when I tap "Verify", my NYSC details appear in read-only fields.
- Given my details are correct, when I set my password and submit, I receive an OTP on my NYSC email.
- Given I enter the correct OTP, my account is created and I am taken to onboarding.
- Given I enter an invalid state code, I see a friendly error message.

### US-002: Login with Email or State Code
> As a registered corper, I want to log in using my email or state code and password.

### US-003: Enable 2FA
> As a security-conscious corper, I want to enable 2FA so that my account is more secure.

### US-004: Post to the Feed
> As a corper, I want to share a post with text or images so that my fellow corpers can see it.

### US-005: Send a Direct Message
> As a corper, I want to send a real-time message to another corper so that we can communicate privately.

### US-006: Make a Voice Call
> As a corper, I want to call another corper with voice so that we can talk directly from the app.

### US-007: Create a Mami Market Listing
> As a corper with something to sell, I want to post a listing on Mami Market so other corpers can buy from me.

### US-008: Find Corpers in My State
> As a newly deployed corper, I want to discover other corpers in my serving state so I can connect with people nearby.

### US-009: Subscribe to Premium
> As a corper who wants extra features, I want to subscribe to the Premium plan so I can access the verified seller program and other perks.

### US-010: Activate Corper Tag
> As a proud corper, I want to add a Kogi Corper tag to my profile picture so others can see where I'm serving.

---

## 6. Development Phases (Frontend)

| Phase | Screens / Features |
|---|---|
| Phase 1 | Auth screens, onboarding, profile setup |
| Phase 2 | Home feed, create post, stories, profile view |
| Phase 3 | Messaging (DMs, groups, voice notes) |
| Phase 4 | Mami Market |
| Phase 5 | Voice & Video Calls |
| Phase 6 | Reels, Opportunities, Memories |
| Phase 7 | Subscriptions, Corper Tag, Level display |
| Phase 8 | Notifications, Settings, PWA |
| Phase 9 | Admin integration, Discover, Search |
| Phase 10 | Performance, accessibility, app store submission |

---

*This document is a living reference. Update as the design evolves.*

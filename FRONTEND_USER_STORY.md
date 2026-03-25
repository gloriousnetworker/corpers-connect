# Corpers Connect — Frontend (User App) User Story Document

**Version:** 4.0.0
**Date:** 2026-03-25
**Status:** Phase 4 Complete — Messaging Live

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

---

## 7. QA Testing Guide — What to Look For

This section documents the manual testing checklist for each completed phase. Use this when verifying builds on both mobile (iOS/Android) and desktop (Chrome, Safari).

---

### Phase 1 — Foundation, Auth & Dashboard Shell

#### 7.1 App Boot & PWA

| # | What to do | What to look for |
|---|---|---|
| 1 | Open the app URL in mobile Chrome | Green splash screen with logo appears for ~1.6s, then fades into the dashboard |
| 2 | Wait 3–5 seconds after first visit (Android Chrome) | "Add to Home Screen" install prompt slides up from the bottom |
| 3 | Tap the install prompt dismiss button | Prompt disappears; will not reappear for 7 days |
| 4 | Open in iOS Safari | No native install prompt (iOS limitation); the prompt shows step-by-step "tap Share → Add to Home Screen" instructions |
| 5 | Install the PWA and open it | App opens in standalone mode (no browser chrome), green background behind notch |
| 6 | Resize browser to desktop width | Layout switches to 3-column view: sidebar left, feed center, right panel |

#### 7.2 Registration Flow

| # | What to do | What to look for |
|---|---|---|
| 1 | Navigate to `/register`, enter a valid NYSC state code (e.g. `LA/23A/1234`) | NYSC data (name, email, state, batch) is pre-filled on the next screen |
| 2 | Enter an invalid state code (e.g. `INVALID`) | Inline validation error appears below the field |
| 3 | Set a password — type less than 8 characters | 4-bar strength indicator stays red, "Weak" label shows |
| 4 | Type a strong password (mix of upper, lower, number, symbol) | Strength bar fills green, "Strong" label |
| 5 | Confirm password mismatch | "Passwords do not match" error on submit |
| 6 | Submit valid registration | OTP screen loads; 6 boxes autofocus on first box |
| 7 | Type a digit in the OTP box | Focus auto-advances to next box |
| 8 | Press Backspace on a box | Focus moves back to previous box |
| 9 | Paste a 6-digit code | All 6 boxes fill instantly |
| 10 | Submit wrong OTP | Error message shown, boxes reset |
| 11 | Submit correct OTP | NYSC data confirmation screen loads |
| 12 | Confirm NYSC details | Redirected to onboarding |
| 13 | Complete onboarding (bio + corper tag) or tap "Skip" | Redirected to dashboard `/` |

#### 7.3 Login Flow

| # | What to do | What to look for |
|---|---|---|
| 1 | Visit `/login`, enter valid email + password | Redirected to dashboard feed |
| 2 | Enter valid state code instead of email | Login succeeds the same way |
| 3 | Enter wrong password | "Invalid credentials" error toast |
| 4 | Tap "Forgot Password?" | Redirected to `/forgot-password` |
| 5 | Enter email on forgot password page | OTP screen shown with masked email |
| 6 | Enter correct OTP + new password | Password reset success, redirected to login |
| 7 | Login with account that has 2FA enabled | Redirected to `/2fa` page for TOTP entry |
| 8 | Enter correct 6-digit TOTP | Redirected to dashboard |
| 9 | Navigate to `/login` while already logged in | Redirected away to dashboard |
| 10 | Navigate to `/` while NOT logged in | Redirected to `/login` |

#### 7.4 Dashboard Layout & Navigation

| # | What to do | What to look for |
|---|---|---|
| 1 | Open the app logged in — mobile | TopBar at top (logo + bell), BottomNav at bottom (5 tabs) |
| 2 | Tap each BottomNav tab | Section content changes without any URL change or page reload |
| 3 | Tap the bell icon in TopBar | Switches to Notifications section |
| 4 | Tap BottomNav "+" (create) button | Create post modal opens |
| 5 | Open app on desktop (≥ 1024px) | Left sidebar visible, TopBar and BottomNav hidden |
| 6 | Click sidebar nav items on desktop | Section content changes, URL stays `/` |
| 7 | Scroll down in feed on mobile | Content scrolls; TopBar stays fixed at top; BottomNav stays fixed at bottom |
| 8 | Try to scroll on iOS — swipe up/down vigorously | No rubber-band bounce; content stops at edges |
| 9 | Focus any input field on iOS | Page does NOT zoom in (16px font-size fix is in place) |

---

### Phase 2 — Feed & Posts

#### 7.5 Feed Loading

| # | What to do | What to look for |
|---|---|---|
| 1 | Open the app and navigate to Home | 3 skeleton shimmer cards appear while posts load |
| 2 | Wait for feed to load | Skeleton cards replace with real post cards |
| 3 | Scroll to the bottom of the feed | More posts load automatically (infinite scroll) |
| 4 | Reach the very end of all posts | "You're all caught up 🎉" message appears |
| 5 | Open app with no internet / bad connection | "Failed to load feed" error state with Retry button |
| 6 | Tap Retry | Feed attempts to reload |
| 7 | Log in with a new account with no follows | "Your feed is quiet" empty state with prompt to follow or post |
| 8 | Switch to Discover and back to Home | Feed does NOT reload if data is still fresh (within 2 minutes) |

#### 7.6 Create Post

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap the create-post card at top of feed | Create Post modal opens, centered on screen |
| 2 | Tap "Photo" shortcut on create card | Same — modal opens |
| 3 | Tap "+" in BottomNav (mobile) | Same — modal opens |
| 4 | Open modal — check backdrop | Entire screen behind modal is blurred/darkened, including TopBar — no white gap |
| 5 | Tap outside the modal | Modal closes |
| 6 | Try to tap "Post" with empty textarea and no media | Post button is disabled (greyed out) |
| 7 | Type text in the textarea | Post button becomes enabled |
| 8 | Type 1600+ characters | Character countdown appears (e.g. "400") |
| 9 | Type 2001 characters | Counter turns red, Post button disabled |
| 10 | Change visibility dropdown | Selected option updates (Public / My State / Friends / Only Me) |
| 11 | Tap Photo button | File picker opens |
| 12 | Select 1 image | Preview thumbnail appears above footer; Post button still visible |
| 13 | Select 3 more images (4 total) | All 4 previews shown; Photo button disappears (limit reached) |
| 14 | Tap X on a preview image | That image is removed from the grid |
| 15 | Tap Post with text | Modal closes, new post appears at top of feed |
| 16 | Tap Post with only images (no text) | Post succeeds |
| 17 | Edit an existing post (own post → 3-dot menu → Edit) | Modal opens with existing content pre-filled |
| 18 | Change text and tap Save | Post updates inline; "edited" label appears on card |

#### 7.7 Reactions

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap the Like button on a post | Icon fills/highlights, count increments immediately (optimistic) |
| 2 | Tap the same Like button again | Reaction removed, count decrements |
| 3 | Long-press the Like button (≥ 400ms) | Emoji picker slides up (👍 ❤️ 🔥 👏) |
| 4 | Pick a different emoji (e.g. Fire 🔥) | Post shows fire emoji as active reaction |
| 5 | Tap the Fire emoji again on the reaction bar | Reaction is removed |
| 6 | Tap outside the picker without picking | Picker closes, no reaction change |
| 7 | Check reaction count on a post with 999 reactions | Shows "999" |
| 8 | Check a post with 1500 reactions | Shows "1.5K" |

#### 7.8 Comments

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap the Comment button on a post | Comments bottom sheet slides up from the bottom |
| 2 | Sheet title shows correct count | "3 Comments" (not "NaNM Comments") |
| 3 | View existing comments | Each comment shows author avatar, name, content, time |
| 4 | Scroll comment list | Sheet scrolls independently; backdrop stays in place |
| 5 | Type a comment and tap Send | Comment appears at the end of the list |
| 6 | Tap Reply on a comment | Reply indicator shows ("Replying to [Name]") above input |
| 7 | Submit a reply | Reply is nested under the parent comment |
| 8 | Tap "View X replies" on a comment with replies | Replies expand inline below the parent |
| 9 | Tap "Hide replies" | Replies collapse |
| 10 | Long-tap own comment | Delete button appears |
| 11 | Delete own comment | Comment removed from list |
| 12 | Tap X or backdrop | Comment sheet closes |
| 13 | Comment count on post card updates | After posting a comment, the "X comments" summary on the card reflects the new count |

#### 7.9 Bookmarks

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap the bookmark icon on a post (bottom right of reaction bar) | Icon fills (solid), turns gold |
| 2 | Tap filled bookmark | Icon empties (outline), returns to secondary color |
| 3 | Open post 3-dot menu → Bookmark | Same toggle behavior as reaction bar |
| 4 | Open post 3-dot menu on already-bookmarked post | Shows "Remove bookmark" option |

#### 7.10 Share

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap Share on a post (mobile) | Native OS share sheet opens |
| 2 | Tap Share on a post (desktop) | "Link copied!" toast appears |

#### 7.11 Post Menu (3-dot)

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap 3-dot on someone else's post | Menu shows: Bookmark, Report |
| 2 | Tap 3-dot on your own post | Menu shows: Bookmark, Edit Post, Delete Post |
| 3 | Tap Delete Post | Confirmation dialog appears |
| 4 | Confirm delete | Post is removed from feed immediately |
| 5 | Tap Report on another user's post | Report modal opens (centered, backdrop covers full screen) |
| 6 | Select a reason and tap Submit Report | Success toast, modal closes |
| 7 | Tap outside Report modal | Modal closes |

#### 7.12 Media & Images

| # | What to do | What to look for |
|---|---|---|
| 1 | View a post with 1 image | Full-width 16:9 image |
| 2 | View a post with 2 images | Side-by-side square grid |
| 3 | View a post with 3 images | Three equal-width columns |
| 4 | View a post with 4 images | 2×2 square grid |
| 5 | View a post with 5+ images | 2×2 grid with "+N" overlay on 4th |
| 6 | Tap any image | Lightbox opens (full-screen, black background) |
| 7 | Tap X or backdrop in lightbox | Lightbox closes |

#### 7.13 Visual & Layout Checks

| # | What to do | What to look for |
|---|---|---|
| 1 | Open any modal (create post, report) on mobile | Modal is CENTERED on screen — not at top, not at bottom |
| 2 | Open any modal on desktop | Modal centered with dark backdrop covering entire viewport |
| 3 | Add 4 images in Create Post on mobile | Post button (footer) remains visible — images scroll in the body area |
| 4 | View a post from an edited post | Small "edited" label shows next to timestamp |
| 5 | View a state-only post | MapPin icon + "State" label in the post header |
| 6 | View a post from a corper with a tag | Tag label shows next to name in gold color |

---

### Phase 3 — Stories

#### 7.14 Stories Tray

| # | What to do | What to look for |
|---|---|---|
| 1 | Open the feed | A horizontal stories tray appears above the create-post card, inside a rounded card |
| 2 | No stories from followed users or self | Three skeleton rings (pulsing grey circles) + "Add story" ring (current user, + badge) |
| 3 | Other users have stories | Their avatars appear after the "Add story" ring with their first names below |
| 4 | User has unviewed stories | Story ring shows a bright green gradient border |
| 5 | User's stories are all viewed | Ring shows a grey border |
| 6 | Scroll the tray horizontally | More story rings reveal as you scroll; no visual clipping |

#### 7.15 Story Viewer

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap a story ring with unviewed stories | Full-screen viewer opens (black background, no browser chrome) |
| 2 | Multiple stories in a group | Segmented progress bars appear at top (one bar per story) |
| 3 | Watch an image story | Progress bar fills over ~5 seconds, then auto-advances to next story |
| 4 | Press and hold on an image story | Progress bar pauses; releases when finger lifts |
| 5 | Tap the left third of the screen | Goes to previous story (or previous group if at start) |
| 6 | Tap the right third of the screen | Goes to next story; closes viewer after the last story in the last group |
| 7 | Watch a video story | Progress bar advances in real time with the video; auto-advances on `ended` |
| 8 | Press Escape key (desktop) | Viewer closes |
| 9 | Press ← / → arrow keys (desktop) | Navigates between stories |
| 10 | View someone else's story | `POST /stories/:id/view` is called (marks as viewed) |
| 11 | Re-open viewed stories | Ring shows grey border; progress bar jumps to correct position for each story |
| 12 | Tap X button | Viewer closes |

#### 7.16 Own Story View Count

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap your own story ring ("Your story") | Viewer opens; shows eye icon + view count in header |
| 2 | View count > 0 | Eye icon + number visible alongside author name |
| 3 | "Add to story" button at bottom | Tapping it closes the viewer and opens the Story Creator |

#### 7.17 Story Creator

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap "Add story" ring | Full-screen creator modal opens |
| 2 | Tap the media picker area | Device photo/video library opens |
| 3 | Select a photo | Photo preview shown in 9:16 aspect ratio area |
| 4 | Select a video | Video player shown with controls in preview area |
| 5 | Select a file > 50 MB | Error toast: "File must be under 50 MB" |
| 6 | Tap "Change" | Re-opens file picker to replace the selected media |
| 7 | Type a caption | Caption input shows text; max 200 characters |
| 8 | Tap "Post Story" with no file selected | Error toast: "Please select a photo or video first" |
| 9 | Tap "Post Story" with a file | Upload spinner appears, then success toast "Story posted!"; modal closes |
| 10 | Story appears in tray | New "Your story" ring appears with green border |
| 11 | Tap Cancel | Modal closes, no story posted |
| 12 | Tap backdrop | Modal closes |

#### 7.18 Story Deletion

| # | What to do | What to look for |
|---|---|---|
| 1 | Open your own story | Trash icon appears in top-right (next to X close button) |
| 2 | Tap Trash icon | Button changes to red "Confirm delete" button + Cancel button |
| 3 | Tap "Confirm delete" | Story is deleted; if it was the last story, viewer closes |
| 4 | Tap Cancel | Reverts back to Trash icon |

#### 7.19 Media Quality

| # | What to do | What to look for |
|---|---|---|
| 1 | Upload a high-resolution photo as a story | Photo displayed at full quality (`quality={95}`, Cloudinary `q_auto:best,f_auto`) |
| 2 | Upload a video | Video plays in full quality; no compression artifacts visible |
| 3 | Open a story on desktop | Image displayed sharp and correctly sized within max-width 480px container |

---

### Phase 4 — Messaging

#### 7.20 Messages Layout

| # | What to do | What to look for |
|---|---|---|
| 1 | Tap the Messages tab (mobile) | Full-screen messages section; no TopBar overlap; BottomNav hidden behind chat UI |
| 2 | Open on desktop (≥ 1024px) | Left column (w-80) shows conversation list; right panel shows chat or empty state |
| 3 | Open Messages with no conversations | Empty state: icon + "No conversations yet" + prompt text |
| 4 | Tap the pencil/compose icon | New Conversation modal opens |
| 5 | Search for a user in New Conversation modal | Results list updates in real time |
| 6 | Select a user and tap "Message" | Modal closes; chat view opens for the new conversation |

#### 7.21 Conversation List

| # | What to do | What to look for |
|---|---|---|
| 1 | Have multiple conversations | Listed most recent first; each shows avatar, name, last message preview, timestamp |
| 2 | Conversation with unread messages | Bold name + green badge with count |
| 3 | Count exceeds 99 | Badge shows "99+" |
| 4 | Other user is online | Small green dot on their avatar |
| 5 | Last message was an image | Preview shows "📷 Photo" |
| 6 | Last message was deleted | Preview shows "Message deleted" |
| 7 | Own last message | Preview prefixed with "You: ..." |
| 8 | Type in the search bar | List filters to matching names in real time |
| 9 | Search term matches nothing | "No results found" empty state |
| 10 | Click/tap a conversation | Chat view opens for that conversation; item gets active highlight (green tint) |

#### 7.22 Chat View

| # | What to do | What to look for |
|---|---|---|
| 1 | Open a conversation | Header shows partner avatar, name, online status; messages load from bottom (most recent visible) |
| 2 | Scroll up | Older messages load automatically (infinite scroll pagination) |
| 3 | Reach the top | "Beginning of conversation" label appears |
| 4 | Type a message and send | Message appears immediately (optimistic, slightly dimmed), then confirmed once server responds |
| 5 | Other user sends a message while chat is open | New bubble appears at the bottom in real time via Socket.IO |
| 6 | Other user starts typing | "Typing…" indicator appears below messages |
| 7 | Other user stops typing | Indicator disappears after a short delay |

#### 7.23 Message Bubbles

| # | What to do | What to look for |
|---|---|---|
| 1 | Own message | Right-aligned, green bubble |
| 2 | Other user's message | Left-aligned, surface-colored bubble with avatar |
| 3 | Group conversation | Sender first name shown above each message bubble (others only) |
| 4 | Long-press / right-click own message | Context menu: Reply, Edit (text only), Delete |
| 5 | Long-press / right-click other's message | Context menu: Reply only |
| 6 | Tap Reply in menu | "Replying to: [original text]" strip appears above input |
| 7 | Send reply | Reply preview shown inside the new bubble |
| 8 | Tap Edit | Input pre-filled; sends `PATCH /messages/:id`; bubble shows "(edited)" label |
| 9 | Tap Delete | Message content replaced with "This message was deleted" |
| 10 | Deleted message from list preview | Shows "Message deleted" in conversation list |

#### 7.24 Real-Time & Connection

| # | What to do | What to look for |
|---|---|---|
| 1 | Open two browser tabs as different users | Message sent in tab 1 appears instantly in tab 2 |
| 2 | Lose internet briefly and reconnect | Socket reconnects automatically; no UI stuck in error state |
| 3 | Log out | Socket disconnects cleanly; no lingering event listeners |
| 4 | Log back in | Socket reconnects with fresh token |

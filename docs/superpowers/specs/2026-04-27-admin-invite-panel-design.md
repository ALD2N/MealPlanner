# Admin Invite Panel Design

**Date:** 2026-04-27  
**Feature:** Admin panel for managing invitation links  
**Scope:** Create UI for generating, viewing, and revoking invite links  

## Overview

Currently, invitation links can only be generated via API calls. This feature adds an admin-only web interface for managing invitation links, making it easy for administrators to share links with new users.

## Requirements

- Admin-only access (requires `isAdmin: true`)
- Generate new invitation links with one click
- View list of all generated links with metadata
- Copy invite URLs to clipboard for easy sharing
- Revoke/delete links that are no longer needed
- Visual indicators for link status (expired, used, expiring soon)
- Consistent UI/UX matching existing app design

## Architecture

### Routing

**New Route:**
- `GET /admin` - Renders AdminPage component
- Protected: Requires authentication + admin role
- Redirects to home if user is not admin

### Components

**Header Integration:**
- Add "⚙️ Admin" link in header (visible only for admin users)
- Placed in header next to theme toggle button
- Navigates to `/admin`

**AdminPage Component:**
- Location: `/client/src/pages/AdminPage.tsx`
- Full-page admin interface
- Shows invite link management section

### API Integration

**Existing Endpoints (no changes needed):**
1. `POST /admin/invite-links/generate` - Create new invite link
2. `GET /admin/invite-links` - List all invite links
3. `DELETE /admin/invite-links/:token` - Revoke a link

**Hook:** Create `useAdminInvites` hook to manage API calls

## UI Layout

### Header
- Logo on left (same as other pages)
- "⚙️ Admin" link in header (admin only)
- Theme toggle and back button on right

### Main Content

**Title Section:**
- 🔑 Icon + "Gestion des invitations"
- Subtitle: "Générer et gérer les liens d'invitation"

**Generate Section:**
```
┌─────────────────────────────────────┐
│ Générer un nouveau lien              │
│ [Générer]                            │
└─────────────────────────────────────┘
```
- Single button to generate new link
- Shows loading state ("Génération...")
- Success toast on completion

**Links List Section:**
```
┌────────────────────────────────────────────────────────────┐
│ Liens d'invitation (X liens)                               │
├────────┬──────────────────┬──────────┬──────┬──────────────┤
│ Token  │ URL              │ Expires  │ Uses │ Actions      │
├────────┼──────────────────┼──────────┼──────┼──────────────┤
│ abc123 │ http://...?tok.. │ ⏱️ 5j    │ 0    │ [📋] [🗑️]   │
│ def456 │ http://...?tok.. │ ✅ 1d    │ 1    │ [📋] [🗑️]   │
│ ghi789 │ http://...?tok.. │ ⚠️ 0d    │ 2    │ [📋] [🗑️]   │
└────────┴──────────────────┴──────────┴──────┴──────────────┘
```

**Visual Indicators:**
- ⏱️ Red text: Expiring soon (< 24h)
- ✅ Green text: Not yet used
- ⚠️ Gray text: Expired
- Number in "Uses": How many accounts registered with this link

**Actions per link:**
- 📋 Copy button: Copies full URL to clipboard, shows "Copié!" toast
- 🗑️ Revoke button: Opens confirmation dialog, deletes link on confirm

### Empty State
If no links exist:
```
Aucun lien d'invitation généré pour le moment.
Générez votre premier lien ci-dessus.
```

## Styling

**Theme Integration:**
- Use theme tokens throughout (bg-theme-*, text-theme-*)
- Match existing button styles from RecipeModal, HistoryPage
- Consistent spacing and typography
- Responsive layout (mobile, tablet, desktop)

**Color Scheme:**
- Primary action: theme-accent (generate button)
- Destructive: Red/warning for revoke
- Status indicators: Green (active), Red (expiring), Gray (expired)

**Components to reuse:**
- Buttons: Same style as "Voir la recette", "Changer" buttons
- Layout: Same max-width container as other pages
- Header: Same header as HistoryPage

## Data Flow

1. AdminPage mounts → Fetches list of invite links
2. User clicks "Générer" → POST to generate endpoint → Updates list
3. User clicks "Copier" → Copies URL to clipboard → Toast confirmation
4. User clicks "Révoquer" → Confirmation dialog → DELETE endpoint → Removes from list

## Error Handling

- API errors show error toast with message
- Loading states on buttons during API calls
- Confirmation dialog before revoking links
- Toast notifications for user feedback (success, error, copy)

## Testing

- Unit tests for useAdminInvites hook
- Component tests for AdminPage
- Mock API responses for link list, generate, delete
- Test copy-to-clipboard functionality
- Test admin-only access control

## Access Control

**Route Protection:**
- AdminPage checks `user.isAdmin`
- Redirects to home if not admin
- Header link only visible if admin

**Backend:**
- All endpoints require `authMiddleware` + `adminMiddleware`
- Already enforced in existing routes

## Future Enhancements

- Bulk delete links
- Filter/search links
- Export list as CSV
- Link expiration time customization
- Link usage statistics/analytics


# User Management Implementation

## Overview

This document describes the user management features implemented in OpenShelf, including role-based access control (RBAC) and administrative functions.

## User Roles

OpenShelf now supports three distinct user roles:

### 1. **Admin** (Full Access)
- Can manage users (add, delete, modify, reset passwords)
- Can add, edit, and delete items
- Can import/export collections
- Can access all features and settings

### 2. **User** (Standard Access)
- Can add, edit, and delete items
- Can manage their own reading status
- Can upload images
- **Cannot** manage other users
- **Cannot** import collections (export only)

### 3. **Reader** (Read-Only Access)
- Can browse all items in the library
- Can manage their own reading status (want to read, reading, read)
- Can add items to personal wishlist
- **Cannot** add, edit, or delete items
- **Cannot** upload images
- **Cannot** manage users

## Default Roles

- **Existing users**: All users in the database at the time of migration are set to **admin** role
- **New registrations**: New users default to **user** role

## Features

### Admin Features

#### User Management Dashboard
Access via: `/user-management` (visible only to admins)

Features include:
- View all users with statistics (total items, wishlist count, books read)
- Change user roles (admin, user, reader)
- Reset user passwords
- Delete users (with protection against deleting yourself or the last admin)
- View user activity and item counts

#### Password Reset
Admins can reset any user's password:
1. Click "Reset Password" button next to a user
2. Enter new password (minimum 6 characters)
3. Password is immediately updated

#### Role Management
Admins can change user roles with safeguards:
- Cannot demote yourself
- Cannot demote or delete the last admin
- Role changes take effect immediately

### RBAC Implementation

#### Backend Routes Protection

**Admin-only routes:**
- `POST /api/admin/users/:id/reset-password` - Reset user password
- `PUT /api/admin/users/:id/role` - Change user role
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/items/import` - Import items from CSV/JSON

**Admin or User routes:**
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/upload` - Upload images

**All authenticated users:**
- `GET /api/items` - View all items
- `GET /api/items/:id` - View item details
- Reading status management
- Wishlist management
- Export collections

#### Frontend UI Protection

The UI adapts based on user role:

**Readers see:**
- "Read-only access" badge
- No "Add Item" buttons
- No edit/delete buttons on items
- Can still track reading status and manage wishlist

**Users and Admins see:**
- Full "Add Item" functionality
- Edit and delete buttons on all items
- Image upload capabilities
- "Duplicate" button to copy items

**Only Admins see:**
- "User Management" in navigation
- Import button on item list
- User management dashboard

## Technical Implementation

### Backend Files Modified

1. **`backend/src/models/User.js`**
   - Added `resetUserPassword()` method for admin password resets

2. **`backend/src/routes/admin.js`**
   - Added `POST /users/:id/reset-password` endpoint
   - Imported bcrypt for password hashing

3. **`backend/src/routes/auth.js`**
   - Changed default role for new registrations to 'user'

4. **`backend/src/middleware/rbac.js`**
   - Added `requireAdminOrUser()` middleware
   - Added `checkModifyPermission()` helper

5. **`backend/src/routes/items.js`**
   - Updated POST, PUT, DELETE routes to use `requireAdminOrUser`
   - Import route remains admin-only

6. **`backend/src/routes/upload.js`**
   - Updated to require admin or user role

7. **`backend/src/scripts/initDatabase.js`**
   - Added migration to set all existing users to admin role
   - Runs automatically on server startup

### Frontend Files Modified

1. **`frontend/src/store/authStore.js`**
   - Added `canModifyItems()` helper function
   - Added `isReader()` helper function

2. **`frontend/src/pages/UserManagement.jsx`**
   - Added password reset modal
   - Updated role dropdown with all three roles (admin, user, reader)
   - Added role descriptions
   - Added password reset button for each user

3. **`frontend/src/pages/ItemList.jsx`**
   - Hide "Add Item" button for readers
   - Show "Read-only access" badge for readers
   - Import button only visible to admins

4. **`frontend/src/pages/ItemDetail.jsx`**
   - Hide edit/delete buttons for readers
   - Show "Read-only" message for readers

5. **`frontend/src/pages/Dashboard.jsx`**
   - Hide "Add Item" quick action for readers

## Migration Path

When you start the server after these changes:

1. The database initialization script runs automatically
2. All existing users are set to **admin** role (one-time migration)
3. The database is updated with the new role structure
4. All functionality is immediately available

## Security Notes

- Password reset requires admin role
- Minimum password length: 6 characters
- Passwords are hashed with bcrypt (10 rounds)
- Cannot delete yourself or the last admin
- Cannot demote yourself
- All API endpoints are protected with authentication middleware
- Role checks happen on both frontend (UI) and backend (API)

## API Endpoints

### User Management (Admin only)

```
GET    /api/admin/users                  - List all users with stats
GET    /api/admin/users/:id              - Get specific user
PUT    /api/admin/users/:id/role         - Update user role
POST   /api/admin/users/:id/reset-password - Reset user password
DELETE /api/admin/users/:id              - Delete user
```

### Example: Reset Password

```bash
POST /api/admin/users/2/reset-password
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "newPassword": "newpassword123"
}
```

### Example: Change Role

```bash
PUT /api/admin/users/2/role
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "role": "user"
}
```

## Testing the Features

1. **Start the server** - Existing users will be migrated to admin
2. **Login as admin** - Navigate to "User Management"
3. **Create a test user** - Register a new account (will be 'user' role)
4. **Test role changes** - Change the test user to 'reader'
5. **Test password reset** - Reset the test user's password
6. **Login as reader** - Verify read-only access
7. **Login as user** - Verify can add/edit items but not manage users

## Future Enhancements

Potential features to add:
- User registration approval workflow
- Email notifications for password resets
- Audit log for admin actions
- Bulk user operations
- User profile customization
- API keys for programmatic access

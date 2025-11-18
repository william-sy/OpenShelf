# User Management Quick Reference

## Role Comparison

| Feature | Admin | User | Reader |
|---------|-------|------|--------|
| View all items | ✅ | ✅ | ✅ |
| Add items | ✅ | ✅ | ❌ |
| Edit items | ✅ | ✅ | ❌ |
| Delete items | ✅ | ✅ | ❌ |
| Import items | ✅ | ❌ | ❌ |
| Export items | ✅ | ✅ | ✅ |
| Upload images | ✅ | ✅ | ❌ |
| Manage reading status | ✅ | ✅ | ✅ |
| Wishlist | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Reset passwords | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ |

## Default Roles

- **Existing users at migration**: `admin`
- **New registrations**: `user`

## Admin Tasks

### Reset a User's Password
1. Go to **User Management** (navigation menu)
2. Find the user in the list
3. Click **Reset Password** button
4. Enter new password (min 6 characters)
5. Click **Reset Password** to confirm

### Change a User's Role
1. Go to **User Management**
2. Find the user in the list
3. Use the dropdown next to their role
4. Select new role: `admin`, `user`, or `reader`
5. Role changes immediately

### Delete a User
1. Go to **User Management**
2. Find the user in the list
3. Click **Delete** button
4. Confirm deletion

**Note:** You cannot delete yourself or the last admin.

## For Users

### What You Can Do
- Add new items to the library
- Edit any item's details
- Delete items
- Upload cover images
- Track your reading progress
- Create and manage wishlist
- Export the collection

### What You Cannot Do
- Manage other users
- Reset other users' passwords
- Import collections (CSV/JSON)
- Access User Management dashboard

## For Readers

### What You Can Do
- Browse the entire library
- View item details
- Track your reading status
- Add items to your personal wishlist
- Export the collection
- View statistics

### What You Cannot Do
- Add new items
- Edit existing items
- Delete items
- Upload images
- Import collections
- Manage users

### Read-Only Indicators
When logged in as a reader, you'll see:
- 🔒 "Read-only access" badge in the library
- No "Add Item" buttons
- No edit/delete buttons on items
- "Read-only" message instead of edit/delete controls

## Quick Tips

1. **First Time Setup**: All existing users become admins after the first run
2. **Create Users**: Register new accounts - they'll start as regular users
3. **Promote to Admin**: Use User Management to change role from user → admin
4. **Demote to Reader**: Change role from user → reader for read-only access
5. **Password Reset**: Admins can reset any user's password instantly
6. **Safety**: System prevents deleting the last admin

## API Quick Reference

### Admin Endpoints
```bash
# List all users
GET /api/admin/users

# Reset password
POST /api/admin/users/:id/reset-password
Body: { "newPassword": "string" }

# Change role
PUT /api/admin/users/:id/role
Body: { "role": "admin|user|reader" }

# Delete user
DELETE /api/admin/users/:id
```

All admin endpoints require:
- Authentication token in header
- Admin role

## Troubleshooting

### "Access denied" when trying to add items
- Check your role in User Management
- You need `admin` or `user` role
- Contact an admin to change your role

### Can't see User Management menu
- This is normal for non-admin users
- Only admins can access user management
- Contact an admin if you need this access

### Password reset not working
- Password must be at least 6 characters
- Only admins can reset passwords
- Cannot reset your own password this way (use Change Password in settings)

### Can't delete a user
- Cannot delete yourself
- Cannot delete the last admin
- Promote another user to admin first if needed

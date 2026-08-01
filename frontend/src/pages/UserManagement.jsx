import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiUsers, FiShield, FiBook, FiHeart, FiBookOpen, FiTrash2, FiAlertCircle, FiKey, FiUserPlus, FiStar, FiCheckSquare, FiSquare } from 'react-icons/fi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [createUserModal, setCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });
  const [createError, setCreateError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkRole, setBulkRole] = useState('user');
  const [bulkActing, setBulkActing] = useState(false);
  const { isAdmin, user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  // Everyone except the signed-in admin can be targeted by bulk actions -
  // matches the existing single-row restriction (can't change/delete self).
  const selectableUsers = users.filter((u) => u.id !== currentUser?.id);

  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin()) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, []);

  // Close modals on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (resetPasswordModal) {
        setResetPasswordModal(null);
        setNewPassword('');
        setResetError('');
      }
      if (createUserModal) {
        setCreateUserModal(false);
        setCreateError('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [resetPasswordModal, createUserModal]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Used after mutations (role change/delete/create/reset) - refreshes data
  // without toggling the full-page `loading` state, so the whole page
  // (stat cards + table) doesn't blank out for a single-row change.
  const refreshUsers = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
      // Drop any selected ids that no longer exist (e.g. deleted elsewhere)
      const stillPresent = new Set(response.data.map((u) => u.id));
      setSelectedIds((prev) => prev.filter((id) => stillPresent.has(id)));
    } catch (err) {
      console.error('Error refreshing users:', err);
      toast.error('Failed to refresh user list');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRoleChange = async (userId, newRole, username) => {
    const confirmed = window.confirm(
      `Change ${username}'s role to "${newRole}"? This takes effect immediately.`
    );
    if (!confirmed) {
      return;
    }

    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
      await refreshUsers();
      toast.success(`User role updated to ${newRole} successfully`);
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/api/admin/users/${userId}`);
      await refreshUsers();
      setDeleteConfirm(null);
      toast.success('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.error || 'Failed to delete user');
      setDeleteConfirm(null);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long');
      return;
    }

    try {
      await api.post(`/api/admin/users/${userId}/reset-password`, { newPassword });

      toast.success('Password reset successfully');
      setResetPasswordModal(null);
      setNewPassword('');
      setResetError('');
    } catch (err) {
      console.error('Error resetting password:', err);
      setResetError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleCreateUser = async () => {
    // Validate fields
    if (!newUser.username || !newUser.email || !newUser.password) {
      setCreateError('Username, email, and password are required');
      return;
    }

    if (newUser.password.length < 6) {
      setCreateError('Password must be at least 6 characters long');
      return;
    }

    try {
      await api.post('/api/admin/users', {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        displayName: newUser.displayName || newUser.username,
        role: newUser.role
      });

      toast.success('User created successfully');

      // Reset form and close modal
      setCreateUserModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        displayName: '',
        role: 'user'
      });
      setCreateError('');

      await refreshUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      setCreateError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const toggleSelected = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === selectableUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectableUsers.map((u) => u.id));
    }
  };

  const handleBulkRoleChange = async () => {
    const confirmed = window.confirm(
      `Change ${selectedIds.length} user${selectedIds.length === 1 ? '' : 's'} to "${bulkRole}"? This takes effect immediately.`
    );
    if (!confirmed) return;

    setBulkActing(true);
    const results = await Promise.allSettled(
      selectedIds.map((id) => api.put(`/api/admin/users/${id}/role`, { role: bulkRole }))
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkActing(false);
    setSelectedIds([]);
    await refreshUsers();

    if (failed > 0) {
      toast.error(`${failed} of ${results.length} role changes failed`);
    } else {
      toast.success(`Updated role for ${results.length} user${results.length === 1 ? '' : 's'}`);
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm(
      `Permanently delete ${selectedIds.length} user${selectedIds.length === 1 ? '' : 's'}? This cannot be undone.`
    );
    if (!confirmed) return;

    setBulkActing(true);
    const results = await Promise.allSettled(
      selectedIds.map((id) => api.delete(`/api/admin/users/${id}`))
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkActing(false);
    setSelectedIds([]);
    await refreshUsers();

    if (failed > 0) {
      toast.error(`${failed} of ${results.length} deletions failed`);
    } else {
      toast.success(`Deleted ${results.length} user${results.length === 1 ? '' : 's'}`);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'user':
        return 'bg-primary-100 text-primary-800 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800';
      case 'reader':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    }
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return 'Full access (can manage users)';
      case 'user':
        return 'Can add/edit/delete items';
      case 'reader':
        return 'Read-only access';
      default:
        return '';
    }
  };

  if (!isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-3">
        <FiAlertCircle className="text-xl flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <FiUsers className="text-3xl text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>
            {refreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600" title="Refreshing..." />
            )}
          </div>
          <button
            onClick={() => {
              setCreateUserModal(true);
              setCreateError('');
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiUserPlus />
            Create New User
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Manage user roles and permissions</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FiUsers className="text-xl text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FiShield className="text-xl text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Administrators</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiBook className="text-xl text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {users.reduce((sum, u) => sum + (u.stats?.total_items || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FiStar className="text-xl text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {users.reduce((sum, u) => sum + (u.stats?.favorite_items || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
              <FiHeart className="text-xl text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wishlist</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {users.reduce((sum, u) => sum + (u.stats?.wishlist_items || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="card mb-4 flex flex-wrap items-center gap-3 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              className="input py-1 text-sm w-auto"
              aria-label="Bulk role"
            >
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="reader">Reader</option>
            </select>
            <button
              onClick={handleBulkRoleChange}
              disabled={bulkActing}
              className="btn btn-secondary !py-1 text-sm disabled:opacity-50"
            >
              Change Role
            </button>
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={bulkActing}
            className="btn btn-danger !py-1 text-sm disabled:opacity-50"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="text-sm text-gray-600 dark:text-gray-400 hover:underline ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left w-10">
                  {selectableUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      aria-label={selectedIds.length === selectableUsers.length ? 'Deselect all' : 'Select all'}
                      className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {selectedIds.length === selectableUsers.length ? <FiCheckSquare /> : <FiSquare />}
                    </button>
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Statistics
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    {user.id !== currentUser?.id && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelected(user.id)}
                        aria-label={`Select ${user.display_name || user.username}`}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {user.display_name || user.username}
                        {user.id === currentUser?.id && (
                          <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">@{user.username}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.id === currentUser?.id ? (
                      // Can't change own role
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    ) : (
                      // Can change other users' roles
                      <div>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value, user.display_name || user.username)}
                          aria-label={`Role for ${user.display_name || user.username}`}
                          className="input py-1 text-sm w-auto"
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                          <option value="reader">Reader</option>
                        </select>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {getRoleDescription(user.role)}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <FiBook className="text-primary-500 dark:text-primary-400" />
                        <span>{user.stats?.total_items || 0} items</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <FiHeart className="text-red-500 dark:text-red-400" />
                        <span>{user.stats?.wishlist_items || 0} wishlist</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <FiBookOpen className="text-green-500 dark:text-green-400" />
                        <span>{user.stats?.books_read || 0} read</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => {
                              setResetPasswordModal(user.id);
                              setNewPassword('');
                              setResetError('');
                            }}
                            className="inline-flex items-center gap-2 px-3 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors text-sm"
                          >
                            <FiKey />
                            Reset Password
                          </button>
                          {deleteConfirm === user.id ? (
                            <>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Permanently delete {user.display_name || user.username}?
                              </span>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="btn btn-danger !px-3 !py-1 text-sm"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn btn-secondary !px-3 !py-1 text-sm"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="inline-flex items-center gap-2 px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors text-sm"
                            >
                              <FiTrash2 />
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FiUsers className="text-5xl mx-auto mb-4 opacity-50" />
          <p>No users found</p>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetPasswordModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setResetPasswordModal(null);
              setNewPassword('');
              setResetError('');
            }
          }}
        >
          <div className="card max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <FiKey className="text-2xl text-primary-600 dark:text-primary-400" />
              <h2 id="reset-password-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Reset User Password
              </h2>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter a new password for{' '}
                <strong className="text-gray-900 dark:text-gray-100">{users.find(u => u.id === resetPasswordModal)?.username}</strong>
              </p>

              <label htmlFor="reset-password-input" className="label">
                New Password
              </label>
              <input
                id="reset-password-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                placeholder="Enter new password (min 6 characters)"
                autoFocus
              />

              {resetError && (
                <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <FiAlertCircle />
                  {resetError}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setResetPasswordModal(null);
                  setNewPassword('');
                  setResetError('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(resetPasswordModal)}
                className="btn btn-primary"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createUserModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setCreateUserModal(false);
              setCreateError('');
            }
          }}
        >
          <div className="card max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <FiUserPlus className="text-2xl text-primary-600 dark:text-primary-400" />
              <h2 id="create-user-title" className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Create New User
              </h2>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label htmlFor="new-user-username" className="label">
                  Username *
                </label>
                <input
                  id="new-user-username"
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input"
                  placeholder="Enter username"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="new-user-email" className="label">
                  Email *
                </label>
                <input
                  id="new-user-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input"
                  placeholder="Enter email"
                />
              </div>

              <div>
                <label htmlFor="new-user-display-name" className="label">
                  Display Name
                </label>
                <input
                  id="new-user-display-name"
                  type="text"
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="input"
                  placeholder="Enter display name (optional)"
                />
              </div>

              <div>
                <label htmlFor="new-user-password" className="label">
                  Password *
                </label>
                <input
                  id="new-user-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input"
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              <div>
                <label htmlFor="new-user-role" className="label">
                  Role *
                </label>
                <select
                  id="new-user-role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="input"
                >
                  <option value="admin">Admin - Full access (can manage users)</option>
                  <option value="user">User - Can add/edit/delete items</option>
                  <option value="reader">Reader - Read-only access</option>
                </select>
              </div>

              {createError && (
                <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <FiAlertCircle />
                  {createError}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setCreateUserModal(false);
                  setNewUser({
                    username: '',
                    email: '',
                    password: '',
                    displayName: '',
                    role: 'user'
                  });
                  setCreateError('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="btn btn-primary"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

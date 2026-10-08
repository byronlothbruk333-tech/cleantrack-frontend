import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Avatar,
  Chip,
  Divider,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person,
  Email,
  Phone,
  LocationOn,
  Public as PublicIcon,
  Notifications,
  ReportProblem,
  DeleteForever,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import {
  reportService,
  type ReportStats,
} from '../../Services/reportService';

// ============================================
// ZONES LIST
// ============================================
const ZONES = [
  'Zone 1',
  'Zone 2',
  'Zone 3',
  'Zone 4',
  'Zone 5',
  'Zone 6',
  'Zone 7',
  'Zone 8',
  'Zone 9',
];

// ============================================
// COMPONENT
// ============================================
export const CitizenProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    zone: user?.zone || '',
    bio: user?.bio || '',
  });

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(
    user?.emailNotifications ?? true
  );
  const [smsNotifications, setSmsNotifications] = useState(
    user?.smsNotifications ?? false
  );

  // Report stats (real from backend)
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialog + Snackbar
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');

  // ============================================
  // LOAD REAL STATS
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const data = await reportService.getMyStats();
        if (isMounted) {
          setStats(data.stats);
        }
      } catch (err) {
        console.warn('Failed to load stats:', err);
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const showSnackbar = (
    message: string,
    severity: typeof snackbarSeverity
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleEditClick = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      zone: user?.zone || '',
      bio: user?.bio || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      showSnackbar('Name cannot be empty', 'error');
      return;
    }

    updateUser({
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      zone: formData.zone,
      bio: formData.bio,
    });

    setIsEditing(false);
    showSnackbar('Profile updated successfully', 'success');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNotificationChange = (
    type: 'email' | 'sms',
    value: boolean
  ) => {
    if (type === 'email') {
      setEmailNotifications(value);
      updateUser({ emailNotifications: value });
      showSnackbar(
        `Email notifications ${value ? 'enabled' : 'disabled'}`,
        'info'
      );
    } else {
      setSmsNotifications(value);
      updateUser({ smsNotifications: value });
      showSnackbar(
        `SMS notifications ${value ? 'enabled' : 'disabled'}`,
        'info'
      );
    }
  };

  const handleDeleteAccount = () => {
    updateUser({
      deleted: true,
      deletedAt: new Date().toISOString(),
    });

    setOpenDeleteDialog(false);
    showSnackbar(
      'Your account has been scheduled for deletion. You can reactivate within 30 days.',
      'warning'
    );

    setTimeout(() => {
      logout();
      navigate('/login');
    }, 2500);
  };

  // ============================================
  // NOT LOGGED IN
  // ============================================
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          You must be logged in to view your profile.
        </Alert>
      </Container>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ============ HEADER CARD ============ */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              flexWrap: 'wrap',
            }}
          >
            {/* ✅ FIXED: Use `|| undefined` so MUI's Avatar doesn't complain about null */}
            <Avatar
              src={user.avatar || undefined}
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
                fontSize: 40,
                fontWeight: 600,
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {user.name}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Chip
                  icon={<Person />}
                  label={user.role.toUpperCase()}
                  color="primary"
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>

            {!isEditing && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* ============ LEFT COLUMN ============ */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ my: 2 }} />

              {isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+675 xxx xxxx"
                  />
                  <TextField
                    fullWidth
                    label="Address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange('address', e.target.value)
                    }
                    placeholder="Street, suburb"
                  />

                  <FormControl fullWidth>
                    <InputLabel>Zone</InputLabel>
                    <Select
                      value={formData.zone}
                      onChange={(e) =>
                        handleInputChange('zone', e.target.value as string)
                      }
                      label="Zone"
                    >
                      <MenuItem value="">Not assigned</MenuItem>
                      {ZONES.map((zone) => (
                        <MenuItem key={zone} value={zone}>
                          {zone}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    multiline
                    rows={3}
                    placeholder="A short description about you (optional)"
                  />

                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <InfoRow icon={<Person />} label="Full Name" value={user.name} />
                  <InfoRow icon={<Email />} label="Email" value={user.email} />
                  <InfoRow
                    icon={<Phone />}
                    label="Phone"
                    value={user.phone || 'Not provided'}
                  />
                  <InfoRow
                    icon={<LocationOn />}
                    label="Address"
                    value={user.address || 'Not provided'}
                  />
                  <InfoRow
                    icon={<PublicIcon />}
                    label="Zone"
                    value={user.zone || 'Not assigned'}
                  />
                  {user.bio && (
                    <InfoRow icon={<Person />} label="Bio" value={user.bio} />
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Notifications color="primary" />
                <Typography variant="h6">Notification Preferences</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={emailNotifications}
                    onChange={(e) =>
                      handleNotificationChange('email', e.target.checked)
                    }
                  />
                }
                label="Email notifications (report status updates)"
              />
              <br />
              <FormControlLabel
                control={
                  <Switch
                    checked={smsNotifications}
                    onChange={(e) =>
                      handleNotificationChange('sms', e.target.checked)
                    }
                  />
                }
                label="SMS notifications (urgent updates only)"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* ============ RIGHT COLUMN ============ */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Real Report Stats */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ReportProblem color="primary" />
                <Typography variant="h6">My Reports</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {statsLoading ? (
                <Box
                  sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                >
                  <CircularProgress />
                </Box>
              ) : stats ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Paper
                      sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}
                    >
                      <Typography variant="h4" color="primary.main">
                        {stats.total}
                      </Typography>
                      <Typography variant="caption">Total Reports</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.pending}
                      </Typography>
                      <Typography variant="caption">Pending</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {stats.inProgress}
                      </Typography>
                      <Typography variant="caption">In Progress</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {stats.resolved}
                      </Typography>
                      <Typography variant="caption">Resolved</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  Unable to load report statistics.
                </Alert>
              )}

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/citizen/reports')}
              >
                View All Reports
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card sx={{ mt: 3, border: '1px solid', borderColor: 'error.light' }}>
            <CardContent>
              <Typography variant="h6" color="error" gutterBottom>
                Danger Zone
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Once you delete your account, you have 30 days to reactivate
                it by signing in again. After that, all data will be
                permanently removed.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={() => setOpenDeleteDialog(true)}
                sx={{ mt: 1 }}
              >
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account?
            <br />
            <br />
            Your reports will be hidden and your personal information will be
            scheduled for permanent deletion in <strong>30 days</strong>.
            <br />
            <br />
            You can reactivate your account by signing in with Google again
            within that period.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// ============================================
// SMALL HELPER COMPONENT
// ============================================
interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
    <Box sx={{ color: 'text.secondary', mt: 0.5 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  </Box>
);

export default CitizenProfile;
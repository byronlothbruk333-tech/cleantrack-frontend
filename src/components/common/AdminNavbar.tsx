import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Container,
  useTheme,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ExitToApp,
  Map,
  LocalShipping,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminNavbarProps {
  title?: string;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ title = 'CleanTrack' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileAnchorEl, setMobileAnchorEl] = useState<null | HTMLElement>(null);

  // Notification settings dialog
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);

  // Notification preferences (persisted in localStorage)
  const [emailAlerts, setEmailAlerts] = useState(
    localStorage.getItem('admin_email_alerts') !== 'false'
  );
  const [emergencyAlerts, setEmergencyAlerts] = useState(
    localStorage.getItem('admin_emergency_alerts') !== 'false'
  );
  const [weeklyReports, setWeeklyReports] = useState(
    localStorage.getItem('admin_weekly_reports') === 'true'
  );

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // ============================================
  // HANDLERS
  // ============================================
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleOpenNotifSettings = () => {
    setNotifSettingsOpen(true);
    handleMenuClose();
  };

  const handleCloseNotifSettings = () => {
    setNotifSettingsOpen(false);
  };

  const handleSaveNotifSettings = () => {
    localStorage.setItem('admin_email_alerts', String(emailAlerts));
    localStorage.setItem('admin_emergency_alerts', String(emergencyAlerts));
    localStorage.setItem('admin_weekly_reports', String(weeklyReports));

    setSnackbarMessage('Notification preferences saved');
    setSnackbarOpen(true);
    setNotifSettingsOpen(false);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'management':
        return 'Management';
      default:
        return 'Admin';
    }
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: theme.palette.primary.main }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleMobileMenuOpen}
              sx={{ color: 'white' }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              🌍 {title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }} />

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ display: { xs: 'none', sm: 'block' } }}
              >
                {user?.name}
                <span
                  style={{
                    opacity: 0.7,
                    fontSize: '0.8rem',
                    marginLeft: '4px',
                  }}
                >
                  ({getRoleLabel(user?.role || '')})
                </span>
              </Typography>
              <IconButton onClick={handleMenuOpen} color="inherit">
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: theme.palette.secondary.main,
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </Avatar>
              </IconButton>
            </Box>

            {/* Admin Profile Dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { minWidth: 260 } } }}
            >
              {/* Admin Info Header */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="primary">
                    🛡️ {getRoleLabel(user?.role || '')}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              <MenuItem onClick={handleOpenNotifSettings} sx={{ py: 1.5 }}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText>Notification Settings</ListItemText>
              </MenuItem>

              <Divider />

              <MenuItem
                onClick={handleLogout}
                sx={{ color: 'error.main', py: 1.5 }}
              >
                <ListItemIcon>
                  <ExitToApp fontSize="small" sx={{ color: 'error.main' }} />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>

            {/* Hamburger Menu */}
            <Menu
              anchorEl={mobileAnchorEl}
              open={Boolean(mobileAnchorEl)}
              onClose={handleMobileMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem
                onClick={() => {
                  navigate('/admin');
                  handleMobileMenuClose();
                }}
              >
                <DashboardIcon sx={{ mr: 1 }} /> Dashboard
              </MenuItem>

              <MenuItem
                onClick={() => {
                  navigate('/admin/trucks');
                  handleMobileMenuClose();
                }}
              >
                <LocalShipping sx={{ mr: 1 }} /> Truck Registry
              </MenuItem>

              <MenuItem
                onClick={() => {
                  navigate('/admin/map');
                  handleMobileMenuClose();
                }}
              >
                <Map sx={{ mr: 1 }} /> Live Map
              </MenuItem>

              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ExitToApp sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>

      {/* Notification Settings Dialog */}
      <Dialog
        open={notifSettingsOpen}
        onClose={handleCloseNotifSettings}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings color="primary" />
            <Typography variant="h6">Notification Settings</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control how you receive system alerts and updates.
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
            }
            label="Email alerts (complaints, reports)"
          />
          <br />
          <FormControlLabel
            control={
              <Switch
                checked={emergencyAlerts}
                onChange={(e) => setEmergencyAlerts(e.target.checked)}
              />
            }
            label="Emergency dispatch alerts (urgent)"
          />
          <br />
          <FormControlLabel
            control={
              <Switch
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
              />
            }
            label="Weekly performance reports"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNotifSettings}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNotifSettings}>
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};
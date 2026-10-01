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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person,
  Dashboard as DashboardIcon,
  ExitToApp,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CitizenNavbarProps {
  title?: string;
}

export const CitizenNavbar: React.FC<CitizenNavbarProps> = ({
  title = 'CleanTrack',
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileAnchorEl, setMobileAnchorEl] = useState<null | HTMLElement>(null);

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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'driver':
        return 'Driver';
      case 'citizen':
        return 'Citizen';
      default:
        return 'User';
    }
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: theme.palette.primary.main }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Left Section - Logo and Hamburger Menu */}
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

          {/* Center Section */}
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
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
            </Box>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => {
                  navigate('/citizen/profile');
                  handleMenuClose();
                }}
              >
                <Person sx={{ mr: 1 }} /> Profile
              </MenuItem>
            </Menu>

            {/* Hamburger Menu - Navigation Menu */}
            <Menu
              anchorEl={mobileAnchorEl}
              open={Boolean(mobileAnchorEl)}
              onClose={handleMobileMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{
                paper: {
                  sx: {
                    width: 280,
                    maxWidth: '100%',
                  },
                },
              }}
            >
              {/* Report Issue Link */}
              <MenuItem
                onClick={() => {
                  navigate('/citizen');
                  handleMobileMenuClose();
                }}
                sx={{ py: 1.5 }}
              >
                <DashboardIcon
                  sx={{ mr: 2, color: theme.palette.primary.main }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Report Issue
                  </Typography>
                </Box>
              </MenuItem>

              {/* Report Tracking Link */}
              <MenuItem
                onClick={() => {
                  navigate('/citizen/reports');
                  handleMobileMenuClose();
                }}
                sx={{ py: 1.5 }}
              >
                <AssignmentIcon sx={{ mr: 2, color: theme.palette.info.main }} />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Report Tracking
                  </Typography>
                </Box>
              </MenuItem>

              {/* Collection Schedule Link */}
              <MenuItem
                onClick={() => {
                  navigate('/citizen/ScheduleLookup');
                  handleMobileMenuClose();
                }}
                sx={{ py: 1.5 }}
              >
                <ScheduleIcon
                  sx={{ mr: 2, color: theme.palette.success.main }}
                />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Collection Schedule
                  </Typography>
                </Box>
              </MenuItem>

              <Divider sx={{ my: 1 }} />

              {/* Logout */}
              <MenuItem
                onClick={handleLogout}
                sx={{
                  color: 'error.main',
                  py: 1.5,
                }}
              >
                <ExitToApp sx={{ mr: 2 }} />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Logout
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
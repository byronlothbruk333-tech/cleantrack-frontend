import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Public as PublicIcon,
  LocalShipping,
  Route as RouteIcon,
  CheckCircle,
  Timer,
  Pending as PendingIcon,
  Speed,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../Context/AuthContext';
import { routeService, type Route } from '../../Services/routeService';
import { truckService, type Truck } from '../../Services/truckService';

// ============================================
// COMPONENT
// ============================================
export const DriverProfile: React.FC = () => {
  const { user } = useAuth();

  // Real data from backend
  const [route, setRoute] = useState<Route | null>(null);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ============================================
  // LOAD REAL DATA
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [routeResult, truckResult] = await Promise.allSettled([
          routeService.getTodaysRoute(),
          truckService.getAllTrucks(),
        ]);

        if (!isMounted) return;

        // Handle route
        if (routeResult.status === 'fulfilled') {
          setRoute(routeResult.value.route);
        } else {
          console.info('No route scheduled for today');
        }

        // Handle truck — find the one assigned to this driver
        if (truckResult.status === 'fulfilled' && user?.id) {
          const myTruck = truckResult.value.trucks.find(
            (t) => t.driverId === user.id
          );
          setTruck(myTruck || null);
        }
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        if (isMounted) {
          setError(
            error.response?.data?.message ||
              error.response?.data?.error ||
              'Failed to load profile data.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

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
  // COMPUTED ROUTE STATS
  // ============================================
  const totalStops = route?.stops?.length || 0;
  const completedStops =
    route?.stops?.filter((s) => s.status === 'completed').length || 0;
  const skippedStops =
    route?.stops?.filter((s) => s.status === 'skipped').length || 0;
  const pendingStops =
    route?.stops?.filter((s) => s.status === 'pending').length || 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Info Banner */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Your profile information is managed by the
          Administrator. To update your details, please contact your
          supervisor.
        </Typography>
      </Alert>

      {/* Header Card */}
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
            <Avatar
              src={user.avatar || undefined}
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'info.main',
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
                  icon={<LocalShipping />}
                  label={user.role.toUpperCase()}
                  color="info"
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ============ LEFT COLUMN ============ */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Personal Information (Read-Only) */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="info" />
                <Typography variant="h6">Personal Information</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

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
              </Box>
            </CardContent>
          </Card>

          {/* Assigned Truck (REAL DATA) */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalShipping color="info" />
                <Typography variant="h6">Assigned Truck</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : truck ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <InfoRow
                    icon={<LocalShipping />}
                    label="Truck ID"
                    value={truck.truckId}
                  />
                  <InfoRow
                    icon={<Person />}
                    label="Registration Number"
                    value={truck.registrationNumber}
                  />
                  <InfoRow
                    icon={<Schedule />}
                    label="Capacity"
                    value={`${truck.capacity} units`}
                  />
                  <InfoRow
                    icon={<PublicIcon />}
                    label="Assigned Zone"
                    value={truck.zone}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: 'text.secondary', mt: 0.5 }}>
                      <CheckCircle />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={truck.status.toUpperCase().replace('-', ' ')}
                          color="info"
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Alert severity="warning">
                  No truck assigned to you yet. Please contact your
                  supervisor.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ============ RIGHT COLUMN ============ */}
        <Grid size={{ xs: 12, md: 5 }}>
          {/* Today's Route (REAL DATA) */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <RouteIcon color="info" />
                <Typography variant="h6">Today's Route</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : route ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Paper
                      sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}
                    >
                      <Typography variant="h4" color="info.main">
                        {totalStops}
                      </Typography>
                      <Typography variant="caption">Total Stops</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <CheckCircle fontSize="small" color="success" />
                        <Typography variant="h4" color="success.main">
                          {completedStops}
                        </Typography>
                      </Box>
                      <Typography variant="caption">Completed</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Timer fontSize="small" color="warning" />
                        <Typography variant="h4" color="warning.main">
                          {skippedStops}
                        </Typography>
                      </Box>
                      <Typography variant="caption">Skipped</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <PendingIcon fontSize="small" color="error" />
                        <Typography variant="h4" color="error.main">
                          {pendingStops}
                        </Typography>
                      </Box>
                      <Typography variant="caption">Pending</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  No route scheduled for today.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics (Still Mock — Placeholder) */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp color="info" />
                <Typography variant="h6">Performance</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="caption">
                  Performance metrics require historical data and will
                  populate once tracking is enabled.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <MetricBar
                  icon={<CheckCircle fontSize="small" />}
                  label="Completion Rate"
                  value={0}
                  color="success"
                />
                <MetricBar
                  icon={<Schedule fontSize="small" />}
                  label="Punctuality"
                  value={0}
                  color="info"
                />
                <MetricBar
                  icon={<Speed fontSize="small" />}
                  label="Fuel Efficiency"
                  value={0}
                  color="warning"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              💡 Reminder
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Only the Administrator can modify your personal information.
              Contact your supervisor for any changes.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

// ============================================
// HELPERS
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

interface MetricBarProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'success' | 'info' | 'warning' | 'error';
}

const MetricBar: React.FC<MetricBarProps> = ({ icon, label, value, color }) => {
  const colorMap = {
    success: '#4CAF50',
    info: '#2196F3',
    warning: '#FF9800',
    error: '#F44336',
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 0.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: colorMap[color], display: 'flex' }}>{icon}</Box>
          <Typography variant="body2">{label}</Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value}%
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: 8,
          borderRadius: 4,
          bgcolor: 'grey.200',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${value}%`,
            height: '100%',
            bgcolor: colorMap[color],
            transition: 'width 0.5s ease',
          }}
        />
      </Box>
    </Box>
  );
};

export default DriverProfile;
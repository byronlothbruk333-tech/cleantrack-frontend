import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  CircularProgress,
  TextField,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Route as RouteIcon,
  CheckCircle,
  PhotoCamera,
  LocationOn,
  Schedule,
  DirectionsCar,
  Warning,
  Navigation,
  Delete,
  SkipNext,
  Refresh,
  ReportProblem,
} from '@mui/icons-material';
import {
  routeService,
  type Route,
  type RouteStop,
} from '../../Services/routeService';
import { uploadService } from '../../Services/uploadService';
import { reportService } from '../../Services/reportService';

// ============================================
// EMERGENCY TYPES
// ============================================
const EMERGENCY_TYPES = [
  { value: 'breakdown', label: '🔧 Vehicle Breakdown' },
  { value: 'accident', label: '🚗 Accident' },
  { value: 'medical', label: '🚑 Medical Emergency' },
  { value: 'security', label: '🚨 Security Threat' },
  { value: 'other', label: '⚠️ Other Emergency' },
];

// ============================================
// HELPER: Is this a complaint-response route?
// ============================================
const isResponseRoute = (route: Route): boolean => {
  return !!route.notes && route.notes.startsWith('Complaint response route');
};

// ============================================
// COMPONENT
// ============================================
export const DriverPortal: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [selectedStopRoute, setSelectedStopRoute] = useState<Route | null>(
    null
  );
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  // Photo dialog state — only AFTER photo now
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Emergency dialog state
  const [openEmergencyDialog, setOpenEmergencyDialog] = useState(false);
  const [emergencyType, setEmergencyType] = useState<string>('breakdown');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [emergencySubmitting, setEmergencySubmitting] = useState(false);

  // ============================================
  // LOAD TODAY'S ROUTES
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await routeService.getTodaysRoute();
        if (isMounted) {
          // ✅ Handle both response shapes (new: routes[], old: route)
          const list: Route[] = Array.isArray(data.routes)
            ? data.routes
            : data.route
            ? [data.route]
            : [];
          setRoutes(list);
        }
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        if (isMounted) {
          setError(
            error.response?.data?.message ||
              error.response?.data?.error ||
              "Failed to load today's routes. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRoutes();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // REFRESH
  // ============================================
  const refreshRoutes = async () => {
    setRefreshing(true);
    try {
      const data = await routeService.getTodaysRoute();
      const list: Route[] = Array.isArray(data.routes)
        ? data.routes
        : data.route
        ? [data.route]
        : [];
      setRoutes(list);
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================
  // AGGREGATE PROGRESS
  // ============================================
  const totalStops = routes.reduce(
    (sum, r) => sum + (r.stops?.length || 0),
    0
  );
  const completedStops = routes.reduce(
    (sum, r) =>
      sum + (r.stops?.filter((s) => s.status === 'completed').length || 0),
    0
  );
  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  // ============================================
  // NAVIGATE TO STOP
  // ============================================
  const navigateToStop = (stop: RouteStop) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // ============================================
  // PHOTO HANDLING (AFTER ONLY)
  // ============================================
  const openPhotoDialog = () => {
    setShowPhotoDialog(true);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);

    if (afterPhotoPreview) URL.revokeObjectURL(afterPhotoPreview);
    setAfterPhotoFile(file);
    setAfterPhotoPreview(previewUrl);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = () => {
    if (afterPhotoPreview) URL.revokeObjectURL(afterPhotoPreview);
    setAfterPhotoFile(null);
    setAfterPhotoPreview('');
  };

  // ============================================
  // COMPLETE STOP
  // ============================================
  const handleCompleteStop = async (stop: RouteStop, route: Route) => {
    if (!route) return;

    if (stop.isComplaintStop) {
      if (!afterPhotoFile) {
        alert(
          'Please take an "After" photo as proof of service for this complaint stop.'
        );
        return;
      }
    }

    setActionLoading(true);
    try {
      let afterPhotoUrl = '';

      if (stop.isComplaintStop && afterPhotoFile) {
        const uploadResult = await uploadService.uploadSingle(afterPhotoFile);
        afterPhotoUrl = uploadResult.url;
      }

      const response = await routeService.completeStop(route.id, stop.id, {
        afterPhoto: afterPhotoUrl || undefined,
      });

      if (stop.isComplaintStop) {
        // Complaint stop was removed → refetch everything
        await refreshRoutes();
      } else {
        // Regular stop — patch just this route in the array
        setRoutes((prev) =>
          prev.map((r) => {
            if (r.id !== route.id || !r.stops) return r;
            return {
              ...r,
              completedStops: response.routeProgress.completedStops,
              status: response.routeProgress.routeStatus,
              stops: r.stops.map((s) =>
                s.id === stop.id && response.stop ? response.stop : s
              ),
            };
          })
        );
      }

      removePhoto();
      setSelectedStop(null);
      setSelectedStopRoute(null);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to complete stop. Please try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // SKIP STOP
  // ============================================
  const handleOpenSkipDialog = () => {
    setSkipReason('');
    setShowSkipDialog(true);
  };

  const handleSkipStop = async () => {
    if (!selectedStopRoute || !selectedStop) return;

    if (!skipReason.trim()) {
      alert('Please provide a reason for skipping');
      return;
    }

    setActionLoading(true);
    try {
      const response = await routeService.skipStop(
        selectedStopRoute.id,
        selectedStop.id,
        skipReason
      );

      setRoutes((prev) =>
        prev.map((r) => {
          if (r.id !== selectedStopRoute.id || !r.stops) return r;
          return {
            ...r,
            stops: r.stops.map((s) =>
              s.id === selectedStop.id && response.stop ? response.stop : s
            ),
          };
        })
      );

      setShowSkipDialog(false);
      setSkipReason('');
      setSelectedStop(null);
      setSelectedStopRoute(null);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to skip stop. Please try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // EMERGENCY DISPATCH
  // ============================================
  const handleOpenEmergencyDialog = () => {
    setEmergencyType('breakdown');
    setEmergencyDescription('');
    setOpenEmergencyDialog(true);
  };

  const handleSendEmergency = async () => {
    setEmergencySubmitting(true);
    try {
      // First pending stop across all routes
      let currentStop: RouteStop | undefined;
      for (const r of routes) {
        currentStop = r.stops?.find((s) => s.status === 'pending');
        if (currentStop) break;
      }

      const latitude = currentStop?.latitude
        ? Number(currentStop.latitude)
        : -9.4438;
      const longitude = currentStop?.longitude
        ? Number(currentStop.longitude)
        : 147.1803;

      await reportService.createEmergencyAlert({
        emergencyType:
          EMERGENCY_TYPES.find((t) => t.value === emergencyType)?.label ||
          emergencyType,
        description: emergencyDescription,
        latitude,
        longitude,
      });

      setOpenEmergencyDialog(false);
      alert('🚨 Emergency alert sent to dispatch successfully!');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to send emergency alert. Please try calling dispatch directly.'
      );
    } finally {
      setEmergencySubmitting(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getComplaintLabel = (stop: RouteStop) => {
    if (!stop.isComplaintStop) return null;
    switch (stop.complaintType) {
      case 'missed-collection':
        return '⚠️ Missed Collection';
      case 'illegal-dumping':
        return '🚯 Illegal Dumping';
      default:
        return '⚠️ Complaint';
    }
  };

  const getComplaintColor = (
    stop: RouteStop
  ): 'warning' | 'error' | 'info' => {
    if (!stop.isComplaintStop) return 'info';
    switch (stop.complaintType) {
      case 'missed-collection':
        return 'warning';
      case 'illegal-dumping':
        return 'error';
      default:
        return 'info';
    }
  };

  // ============================================
  // LOADING / ERROR / EMPTY
  // ============================================
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && routes.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (routes.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info">
          No route scheduled for today. Check back later.
        </Alert>
      </Container>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* ============================================ */}
        {/* Header: aggregate across all routes */}
        {/* ============================================ */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Grid
              container
              spacing={2}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Grid size="auto">
                <Typography variant="h5">
                  <DirectionsCar sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Today's Work
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Truck: {routes[0].truck?.truckId || 'N/A'} | Zone:{' '}
                  {routes[0].zone} | {routes.length} route
                  {routes.length !== 1 ? 's' : ''}
                </Typography>
              </Grid>
              <Grid size="auto">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${completedStops}/${totalStops} stops`}
                    sx={{ color: 'white' }}
                    variant="outlined"
                  />
                  <IconButton
                    color="inherit"
                    onClick={refreshRoutes}
                    disabled={refreshing}
                    sx={{ color: 'white' }}
                    title="Refresh routes"
                  >
                    {refreshing ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Refresh />
                    )}
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* ============================================ */}
        {/* Aggregate Progress */}
        {/* ============================================ */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Progress (all routes)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                </Box>
                <Typography variant="h6">{Math.round(progress)}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ============================================ */}
        {/* Left column: one card per route */}
        {/* ============================================ */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {routes.map((route) => {
              const routeCompleted =
                route.stops?.filter((s) => s.status === 'completed').length ||
                0;
              const routeTotal = route.stops?.length || 0;
              const routeProgress =
                routeTotal > 0 ? (routeCompleted / routeTotal) * 100 : 0;
              const isResponse = isResponseRoute(route);

              return (
                <Card
                  key={route.id}
                  sx={{
                    borderLeft: isResponse
                      ? '4px solid #f44336'
                      : '4px solid #1976d2',
                  }}
                >
                  <CardContent>
                    {/* Route header */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {isResponse ? <ReportProblem /> : <Schedule />}
                        {isResponse
                          ? 'Complaint Response'
                          : `${route.zone} — ${route.suburb}`}
                      </Typography>
                      <Chip
                        label={route.status.toUpperCase().replace('-', ' ')}
                        color={
                          route.status === 'completed'
                            ? 'success'
                            : route.status === 'in-progress'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </Box>

                    {isResponse && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 1 }}
                      >
                        Assigned from a citizen complaint · {routeTotal} stop
                        {routeTotal !== 1 ? 's' : ''}
                      </Typography>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    {/* Per-route progress */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <LinearProgress
                        variant="determinate"
                        value={routeProgress}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {routeCompleted}/{routeTotal}
                      </Typography>
                    </Box>

                    {/* Stops list */}
                    {routeTotal === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 1 }}
                      >
                        No stops on this route.
                      </Typography>
                    ) : (
                      <List disablePadding>
                        {route.stops?.map((stop, index) => (
                          <ListItem
                            key={stop.id}
                            onClick={() => {
                              setSelectedStop(stop);
                              setSelectedStopRoute(route);
                              removePhoto();
                            }}
                            sx={{
                              cursor: 'pointer',
                              borderLeft: `4px solid ${
                                stop.status === 'completed'
                                  ? '#4CAF50'
                                  : stop.status === 'skipped'
                                  ? '#f44336'
                                  : '#FFA726'
                              }`,
                              mb: 1,
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <ListItemIcon>
                              {stop.status === 'completed' ? (
                                <CheckCircle color="success" />
                              ) : stop.status === 'skipped' ? (
                                <SkipNext color="error" />
                              ) : (
                                <LocationOn color="warning" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Typography variant="body1">
                                    {index + 1}. {stop.address}
                                  </Typography>
                                  {stop.isComplaintStop && (
                                    <Chip
                                      label={getComplaintLabel(stop)}
                                      size="small"
                                      color={getComplaintColor(stop)}
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Status: {stop.status.toUpperCase()}
                                  {stop.completedAt &&
                                    ` | Completed: ${new Date(
                                      stop.completedAt
                                    ).toLocaleTimeString()}`}
                                </Typography>
                              }
                            />
                            {stop.status === 'pending' && (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteStop(stop, route);
                                }}
                                disabled={actionLoading}
                              >
                                Complete
                              </Button>
                            )}
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Grid>

        {/* ============================================ */}
        {/* Right column: Selected stop details */}
        {/* ============================================ */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ position: 'sticky', top: 16 }}>
            <CardContent>
              {selectedStop ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    Stop Details
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedStop.address}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 2 }}
                    >
                      Status
                    </Typography>
                    <Chip
                      label={selectedStop.status.toUpperCase()}
                      color={
                        selectedStop.status === 'completed'
                          ? 'success'
                          : selectedStop.status === 'pending'
                          ? 'warning'
                          : 'error'
                      }
                    />

                    {selectedStop.isComplaintStop && (
                      <Alert
                        severity={
                          selectedStop.complaintType === 'illegal-dumping'
                            ? 'error'
                            : 'warning'
                        }
                        sx={{ mt: 2 }}
                      >
                        <strong>{getComplaintLabel(selectedStop)}</strong>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          An "After" photo is required as proof of service.
                        </Typography>
                      </Alert>
                    )}

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Quick Actions
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12 }}>
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<Navigation />}
                            onClick={() => navigateToStop(selectedStop)}
                            disabled={selectedStop.status === 'completed'}
                          >
                            Navigate
                          </Button>
                        </Grid>

                        {selectedStop.isComplaintStop &&
                          selectedStop.status !== 'completed' && (
                            <Grid size={{ xs: 12 }}>
                              <Button
                                variant={
                                  afterPhotoFile ? 'contained' : 'outlined'
                                }
                                fullWidth
                                startIcon={<PhotoCamera />}
                                onClick={openPhotoDialog}
                                color={afterPhotoFile ? 'success' : 'primary'}
                              >
                                {afterPhotoFile
                                  ? '✅ After Photo Captured'
                                  : '📸 Take After Photo'}
                              </Button>
                            </Grid>
                          )}
                      </Grid>

                      {/* After photo preview */}
                      {selectedStop.isComplaintStop &&
                        selectedStop.status !== 'completed' &&
                        afterPhotoPreview && (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              After Photo:
                            </Typography>
                            <Box
                              sx={{
                                position: 'relative',
                                width: 100,
                                height: 100,
                                mt: 1,
                              }}
                            >
                              <img
                                src={afterPhotoPreview}
                                alt="After"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: 8,
                                }}
                              />
                              <IconButton
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  bgcolor: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                }}
                                onClick={removePhoto}
                              >
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Box>
                          </Box>
                        )}

                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={
                          actionLoading ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <CheckCircle />
                          )
                        }
                        onClick={() =>
                          selectedStopRoute &&
                          handleCompleteStop(selectedStop, selectedStopRoute)
                        }
                        disabled={
                          actionLoading ||
                          selectedStop.status === 'completed' ||
                          (selectedStop.isComplaintStop && !afterPhotoFile)
                        }
                        sx={{ mt: 2 }}
                      >
                        {actionLoading
                          ? 'Processing...'
                          : selectedStop.isComplaintStop && !afterPhotoFile
                          ? '📸 Take After Photo First'
                          : selectedStop.status === 'completed'
                          ? '✅ Completed'
                          : 'Complete Stop'}
                      </Button>

                      {selectedStop.status === 'pending' && (
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          startIcon={<SkipNext />}
                          onClick={handleOpenSkipDialog}
                          disabled={actionLoading}
                          sx={{ mt: 1 }}
                        >
                          Skip Stop
                        </Button>
                      )}
                    </Box>

                    <Box
                      sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        💡 Tip: An "After" photo is required for all complaint
                        stops as proof of service.
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <RouteIcon
                    sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}
                  />
                  <Typography variant="body1" color="text.secondary">
                    Select a stop from any route to view details and take
                    action
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ============================================ */}
      {/* Photo Upload Dialog — After Only */}
      {/* ============================================ */}
      <Dialog
        open={showPhotoDialog}
        onClose={() => setShowPhotoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>📸 Take "After" Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Take a photo showing the site AFTER collection.
            </Typography>

            <Alert severity="success" sx={{ mt: 1, mb: 2 }}>
              This photo confirms the issue has been resolved and serves as
              proof of service.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
                id="driver-photo-upload"
              />
              <label htmlFor="driver-photo-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  Choose Photo
                </Button>
              </label>
            </Box>

            {afterPhotoPreview && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={afterPhotoPreview}
                  alt="After preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 8,
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPhotoDialog(false)}>Close</Button>
          <Button variant="contained" onClick={() => setShowPhotoDialog(false)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================ */}
      {/* Skip Stop Dialog */}
      {/* ============================================ */}
      <Dialog
        open={showSkipDialog}
        onClose={() => setShowSkipDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Skip Stop</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please provide a reason for skipping this stop.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder="e.g., Access blocked by parked car"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSkipDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSkipStop}
            disabled={actionLoading || !skipReason.trim()}
          >
            Skip Stop
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================ */}
      {/* Emergency Dispatch Dialog */}
      {/* ============================================ */}
      <Dialog
        open={openEmergencyDialog}
        onClose={() => setOpenEmergencyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          🚨 Emergency Alert
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            This will immediately notify dispatch and the administrator. Only
            use in genuine emergencies.
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Emergency Type *</InputLabel>
            <Select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              label="Emergency Type *"
            >
              {EMERGENCY_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Details (optional)"
            value={emergencyDescription}
            onChange={(e) => setEmergencyDescription(e.target.value)}
            placeholder="Describe the situation briefly..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenEmergencyDialog(false)}
            disabled={emergencySubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleSendEmergency}
            disabled={emergencySubmitting}
            startIcon={
              emergencySubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Warning />
              )
            }
          >
            {emergencySubmitting ? 'Sending...' : 'Send Emergency Alert'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================ */}
      {/* Emergency FAB */}
      {/* ============================================ */}
      <Fab
        color="error"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)' },
            '70%': { boxShadow: '0 0 0 20px rgba(244, 67, 54, 0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' },
          },
        }}
        onClick={handleOpenEmergencyDialog}
        title="Emergency Dispatch"
      >
        <Warning />
      </Fab>
    </Container>
  );
};

export default DriverPortal;
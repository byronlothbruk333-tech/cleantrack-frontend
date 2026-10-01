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
// COMPONENT
// ============================================
export const DriverPortal: React.FC = () => {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  // Photo dialog state
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [beforePhotoFile, setBeforePhotoFile] = useState<File | null>(null);
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [beforePhotoPreview, setBeforePhotoPreview] = useState<string>('');
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Emergency dialog state
  const [openEmergencyDialog, setOpenEmergencyDialog] = useState(false);
  const [emergencyType, setEmergencyType] = useState<string>('breakdown');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [emergencySubmitting, setEmergencySubmitting] = useState(false);

  // ============================================
  // LOAD TODAY'S ROUTE
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const loadRoute = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await routeService.getTodaysRoute();
        
        // --- DEBUGGING ADDED HERE ---
        console.log("🔍 API Response for Today's Route:", data);
        // ----------------------------

        if (isMounted) {
          // Check if data exists and has a route property
          if (data && data.route) {
            setRoute(data.route);
          } else {
            setRoute(null); // Explicitly set to null if no route
          }
        }
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        if (isMounted) {
          setError(
            error.response?.data?.message ||
              error.response?.data?.error ||
              "Failed to load today's route. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRoute();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // REFRESH ROUTE
  // ============================================
  const refreshRoute = async () => {
    setRefreshing(true);
    try {
      const data = await routeService.getTodaysRoute();
      if (data && data.route) {
        setRoute(data.route);
      } else {
        setRoute(null);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================
  // PROGRESS
  // ============================================
  const completedStops =
    route?.stops?.filter((s) => s.status === 'completed').length || 0;
  const totalStops = route?.stops?.length || 0;
  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  // ============================================
  // NAVIGATE TO STOP
  // ============================================
  const navigateToStop = (stop: RouteStop) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // ============================================
  // PHOTO HANDLING
  // ============================================
  const openPhotoDialog = (type: 'before' | 'after') => {
    setPhotoType(type);
    setShowPhotoDialog(true);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const previewUrl = URL.createObjectURL(file);

    if (photoType === 'before') {
      if (beforePhotoPreview) URL.revokeObjectURL(beforePhotoPreview);
      setBeforePhotoFile(file);
      setBeforePhotoPreview(previewUrl);
    } else {
      if (afterPhotoPreview) URL.revokeObjectURL(afterPhotoPreview);
      setAfterPhotoFile(file);
      setAfterPhotoPreview(previewUrl);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (type: 'before' | 'after') => {
    if (type === 'before') {
      if (beforePhotoPreview) URL.revokeObjectURL(beforePhotoPreview);
      setBeforePhotoFile(null);
      setBeforePhotoPreview('');
    } else {
      if (afterPhotoPreview) URL.revokeObjectURL(afterPhotoPreview);
      setAfterPhotoFile(null);
      setAfterPhotoPreview('');
    }
  };

  // ============================================
  // COMPLETE STOP
  // ============================================
  const handleCompleteStop = async (stop: RouteStop) => {
    if (!route) return;

    if (stop.isComplaintStop) {
      if (!beforePhotoFile || !afterPhotoFile) {
        alert(
          'Please take both "Before" and "After" photos for this complaint stop.'
        );
        return;
      }
    }

    setActionLoading(true);
    try {
      let beforePhotoUrl = '';
      let afterPhotoUrl = '';

      if (stop.isComplaintStop && beforePhotoFile && afterPhotoFile) {
        const uploadResult = await uploadService.uploadBeforeAfter(
          beforePhotoFile,
          afterPhotoFile
        );
        beforePhotoUrl = uploadResult.beforePhoto || '';
        afterPhotoUrl = uploadResult.afterPhoto || '';
      }

      const response = await routeService.completeStop(route.id, stop.id, {
        beforePhoto: beforePhotoUrl || undefined,
        afterPhoto: afterPhotoUrl || undefined,
      });

      setRoute((prev) => {
        if (!prev || !prev.stops) return prev;
        return {
          ...prev,
          completedStops: response.routeProgress.completedStops,
          status: response.routeProgress.routeStatus,
          stops: prev.stops.map((s) => (s.id === stop.id ? response.stop : s)),
        };
      });

      removePhoto('before');
      removePhoto('after');
      setSelectedStop(null);
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
    if (!route || !selectedStop) return;

    if (!skipReason.trim()) {
      alert('Please provide a reason for skipping');
      return;
    }

    setActionLoading(true);
    try {
      const response = await routeService.skipStop(
        route.id,
        selectedStop.id,
        skipReason
      );

      setRoute((prev) => {
        if (!prev || !prev.stops) return prev;
        return {
          ...prev,
          stops: prev.stops.map((s) =>
            s.id === selectedStop.id ? response.stop : s
          ),
        };
      });

      setShowSkipDialog(false);
      setSkipReason('');
      setSelectedStop(null);
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
      // Get current stop location as reference
      const currentStop = route?.stops?.find((s) => s.status === 'pending');
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
  // LOADING / ERROR
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

  if (error && !route) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!route) {
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
        {/* Header */}
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
                  Today's Route
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Truck: {route.truck?.truckId || 'N/A'} | Zone: {route.zone} |{' '}
                  {route.suburb}
                </Typography>
              </Grid>
              <Grid size="auto">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={route.status.toUpperCase().replace('-', ' ')}
                    color={
                      route.status === 'in-progress' ? 'warning' : 'success'
                    }
                    sx={{ color: 'white' }}
                  />
                  <IconButton
                    color="inherit"
                    onClick={refreshRoute}
                    disabled={refreshing}
                    sx={{ color: 'white' }}
                    title="Refresh route"
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

        {/* Progress */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Route Progress
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
                <Typography variant="body2" color="text.secondary">
                  {completedStops}/{totalStops} stops
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stops List */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Schedule /> Stops ({totalStops})
              </Typography>
              <List>
                {route.stops?.map((stop, index) => (
                  <ListItem
                    key={stop.id}
                    onClick={() => setSelectedStop(stop)}
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
                        <Typography variant="caption" color="text.secondary">
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
                          handleCompleteStop(stop);
                        }}
                        disabled={actionLoading}
                      >
                        Complete
                      </Button>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Selected Stop Details */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
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
                          Before & After photos required for this stop.
                        </Typography>
                      </Alert>
                    )}

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        Quick Actions
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid
                          size={{ xs: selectedStop.isComplaintStop ? 6 : 12 }}
                        >
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
                            <>
                              <Grid size={{ xs: 6 }}>
                                <Button
                                  variant={
                                    beforePhotoFile ? 'contained' : 'outlined'
                                  }
                                  fullWidth
                                  size="small"
                                  startIcon={<PhotoCamera />}
                                  onClick={() => openPhotoDialog('before')}
                                  color={beforePhotoFile ? 'success' : 'primary'}
                                >
                                  {beforePhotoFile ? '✅ Before' : '📸 Before'}
                                </Button>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Button
                                  variant={
                                    afterPhotoFile ? 'contained' : 'outlined'
                                  }
                                  fullWidth
                                  size="small"
                                  startIcon={<PhotoCamera />}
                                  onClick={() => openPhotoDialog('after')}
                                  color={afterPhotoFile ? 'success' : 'primary'}
                                >
                                  {afterPhotoFile ? '✅ After' : '📸 After'}
                                </Button>
                              </Grid>
                            </>
                          )}
                      </Grid>

                      {selectedStop.isComplaintStop &&
                        selectedStop.status !== 'completed' && (
                          <Box sx={{ mt: 2 }}>
                            {beforePhotoPreview && (
                              <Box sx={{ mb: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Before Photo:
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
                                    src={beforePhotoPreview}
                                    alt="Before"
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
                                    onClick={() => removePhoto('before')}
                                  >
                                    <Delete sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            )}
                            {afterPhotoPreview && (
                              <Box>
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
                                    onClick={() => removePhoto('after')}
                                  >
                                    <Delete sx={{ fontSize: 14 }} />
                                  </IconButton>
                                </Box>
                              </Box>
                            )}
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
                        onClick={() => handleCompleteStop(selectedStop)}
                        disabled={
                          actionLoading ||
                          selectedStop.status === 'completed' ||
                          (selectedStop.isComplaintStop &&
                            (!beforePhotoFile || !afterPhotoFile))
                        }
                        sx={{ mt: 2 }}
                      >
                        {actionLoading
                          ? 'Processing...'
                          : selectedStop.isComplaintStop &&
                            (!beforePhotoFile || !afterPhotoFile)
                          ? '📸 Take Both Photos First'
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
                        💡 Tip: Before & After photos are required for all
                        complaint stops
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
                    Select a stop from the list to view details and take action
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Photo Upload Dialog */}
      <Dialog
        open={showPhotoDialog}
        onClose={() => setShowPhotoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {photoType === 'before'
            ? '📸 Take "Before" Photo'
            : '📸 Take "After" Photo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {photoType === 'before'
                ? 'Take a photo showing the site BEFORE collection.'
                : 'Take a photo showing the site AFTER collection.'}
            </Typography>

            <Alert
              severity={photoType === 'before' ? 'warning' : 'success'}
              sx={{ mt: 1, mb: 2 }}
            >
              {photoType === 'before'
                ? 'This photo serves as evidence of the reported issue'
                : 'This photo confirms the issue has been resolved'}
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

            {photoType === 'before' && beforePhotoPreview && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={beforePhotoPreview}
                  alt="Before preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 8,
                  }}
                />
              </Box>
            )}
            {photoType === 'after' && afterPhotoPreview && (
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

      {/* Skip Stop Dialog */}
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

      {/* Emergency Dispatch Dialog */}
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

      {/* Emergency FAB */}
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
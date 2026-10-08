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
  Avatar,
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
  ImageList,
  ImageListItem,
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
  ChatBubbleOutlineOutlined,
  Close as CloseIcon,
  MyLocation as MyLocationIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import {
  routeService,
  type Route,
  type RouteStop,
  type ReportCommentSummary,
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

// localStorage key for dismissed FAB responses
const DISMISSED_RESPONSES_KEY = 'driver_dismissed_emergency_responses';

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

  // Photo preview state (with navigation)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);
  const [previewPhotoList, setPreviewPhotoList] = useState<string[]>([]);

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

  // GPS location state for emergency alerts
  const [emergencyLocation, setEmergencyLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [locationFetching, setLocationFetching] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Admin responses to my emergency alerts
  const [emergencyResponses, setEmergencyResponses] = useState<
    Array<{
      id: string;
      emergencyType: string;
      adminResponse: string;
      respondedAt: string;
      createdAt: string;
      isResolved?: boolean;
      resolvedAt?: string | null;
    }>
  >([]);

  // Dismissed responses persisted to localStorage
  const [dismissedResponses, setDismissedResponses] = useState<string[]>(
    () => {
      try {
        const stored = localStorage.getItem(DISMISSED_RESPONSES_KEY);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  );

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
        if (isMounted) {
          setRoute(data && data.route ? data.route : null);
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
  // POLL FOR ADMIN RESPONSES TO MY EMERGENCY ALERTS
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const fetchResponses = async () => {
      try {
        const data = await reportService.getMyEmergencyResponses();
        if (isMounted) {
          setEmergencyResponses(data.responses || []);
        }
      } catch (err) {
        console.error('Failed to fetch emergency responses:', err);
      }
    };

    fetchResponses();

    // Faster poll (10s) when there's an active response, slower (30s) otherwise
    const hasActiveResponse = emergencyResponses.some(
      (r) => !r.isResolved && !dismissedResponses.includes(r.id)
    );
    const interval = hasActiveResponse ? 10000 : 30000;

    const intervalId = setInterval(fetchResponses, interval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [emergencyResponses, dismissedResponses]);

  // ============================================
  // Persist dismissals to localStorage
  // ============================================
  useEffect(() => {
    try {
      localStorage.setItem(
        DISMISSED_RESPONSES_KEY,
        JSON.stringify(dismissedResponses)
      );
    } catch (err) {
      console.error('Failed to persist dismissed responses:', err);
    }
  }, [dismissedResponses]);

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
  // PHOTO VIEWER HANDLERS
  // ============================================
  const openPhotoPreview = (photos: string[], index: number) => {
    setPreviewPhotoList(photos);
    setPreviewPhotoIndex(index);
    setPreviewPhoto(photos[index]);
  };

  const closePhotoPreview = () => {
    setPreviewPhoto(null);
    setPreviewPhotoList([]);
    setPreviewPhotoIndex(0);
  };

  const showNextPhoto = () => {
    if (previewPhotoList.length === 0) return;
    const nextIndex = (previewPhotoIndex + 1) % previewPhotoList.length;
    setPreviewPhotoIndex(nextIndex);
    setPreviewPhoto(previewPhotoList[nextIndex]);
  };

  const showPrevPhoto = () => {
    if (previewPhotoList.length === 0) return;
    const prevIndex =
      (previewPhotoIndex - 1 + previewPhotoList.length) %
      previewPhotoList.length;
    setPreviewPhotoIndex(prevIndex);
    setPreviewPhoto(previewPhotoList[prevIndex]);
  };

  // Keyboard navigation for photo viewer
  useEffect(() => {
    if (!previewPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') showNextPhoto();
      if (e.key === 'ArrowLeft') showPrevPhoto();
      if (e.key === 'Escape') closePhotoPreview();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPhoto, previewPhotoList, previewPhotoIndex]);

  // ============================================
  // PHOTO UPLOAD HANDLING (before/after)
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

      if (stop.isComplaintStop) {
        await refreshRoute();
      } else {
        setRoute((prev) => {
          if (!prev || !prev.stops) return prev;
          return {
            ...prev,
            completedStops: response.routeProgress.completedStops,
            status: response.routeProgress.routeStatus,
            stops: prev.stops.map((s) =>
              s.id === stop.id ? response.stop : s
            ),
          };
        });
      }

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
  // FETCH CURRENT GPS LOCATION FOR EMERGENCY
  // ============================================
  const fetchEmergencyLocation = (): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported');
        resolve(null);
        return;
      }

      setLocationFetching(true);
      setLocationError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setEmergencyLocation({ latitude, longitude, accuracy });
          setLocationFetching(false);
          resolve({ latitude, longitude, accuracy });
        },
        (err) => {
          console.error('Geolocation error:', err);
          setLocationError(
            'Could not get precise GPS. Using last known stop location.'
          );
          setLocationFetching(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // ============================================
  // EMERGENCY DISPATCH
  // ============================================
  const handleOpenEmergencyDialog = async () => {
    setEmergencyType('breakdown');
    setEmergencyDescription('');
    setEmergencyLocation(null);
    setLocationError('');
    setOpenEmergencyDialog(true);

    await fetchEmergencyLocation();
  };

  const handleSendEmergency = async () => {
    setEmergencySubmitting(true);
    try {
      let latitude: number;
      let longitude: number;
      let locationSource = '';

      if (emergencyLocation) {
        latitude = emergencyLocation.latitude;
        longitude = emergencyLocation.longitude;
        locationSource = `Live GPS (±${Math.round(
          emergencyLocation.accuracy || 0
        )}m)`;
      } else {
        const currentStop = route?.stops?.find((s) => s.status === 'pending');
        latitude = currentStop?.latitude
          ? Number(currentStop.latitude)
          : -9.4438;
        longitude = currentStop?.longitude
          ? Number(currentStop.longitude)
          : 147.1803;
        locationSource = 'Last known route stop';
      }

      await reportService.createEmergencyAlert({
        emergencyType:
          EMERGENCY_TYPES.find((t) => t.value === emergencyType)?.label ||
          emergencyType,
        description: emergencyDescription,
        latitude,
        longitude,
      });

      setOpenEmergencyDialog(false);
      alert(
        `🚨 Emergency alert sent to dispatch!\n\nLocation shared: ${latitude.toFixed(
          6
        )}, ${longitude.toFixed(6)}\nSource: ${locationSource}`
      );
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

  // Only show responses that are not dismissed and not resolved
  const activeResponses = emergencyResponses.filter(
    (r) => !dismissedResponses.includes(r.id) && !r.isResolved
  );

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
        {/* ADMIN RESPONSES TO EMERGENCY ALERTS */}
        {activeResponses.map((response) => (
          <Grid size={{ xs: 12 }} key={response.id}>
            <Alert
              severity="success"
              icon={<CheckCircle />}
              onClose={() =>
                setDismissedResponses((prev) => [...prev, response.id])
              }
              sx={{
                border: '2px solid',
                borderColor: 'success.main',
                '& .MuiAlert-message': { width: '100%' },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    📨 Response from Dispatch
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {response.adminResponse}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Responded: {new Date(response.respondedAt).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Alert>
          </Grid>
        ))}

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
                          {stop.reportComments &&
                            stop.reportComments.length > 0 && (
                              <Chip
                                icon={<ChatBubbleOutlineOutlined />}
                                label={`${stop.reportComments.length}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20 }}
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
                    {stop.status === 'pending' && !stop.isComplaintStop && (
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

                    {/* Admin Comments for Complaint Stops */}
                    {selectedStop.isComplaintStop &&
                      selectedStop.reportComments &&
                      selectedStop.reportComments.length > 0 && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <ChatBubbleOutlineOutlined
                              color="primary"
                              fontSize="small"
                            />
                            <Typography
                              variant="subtitle2"
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            >
                              Admin Comments (
                              {selectedStop.reportComments.length})
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              bgcolor: 'primary.50',
                              borderLeft: '3px solid',
                              borderColor: 'primary.main',
                              borderRadius: 1,
                              p: 2,
                              mb: 2,
                            }}
                          >
                            {selectedStop.reportComments.map(
                              (comment: ReportCommentSummary) => (
                                <Box
                                  key={comment.id}
                                  sx={{
                                    mb: 1.5,
                                    '&:last-child': { mb: 0 },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      mb: 0.5,
                                    }}
                                  >
                                    <Avatar
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        bgcolor: 'primary.main',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {comment.authorName
                                        .charAt(0)
                                        .toUpperCase()}
                                    </Avatar>
                                    <Typography
                                      variant="caption"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {comment.authorName}
                                    </Typography>
                                    <Chip
                                      label={comment.authorRole.toUpperCase()}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ height: 18, fontSize: '0.65rem' }}
                                    />
                                  </Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ ml: 4, color: 'text.primary' }}
                                  >
                                    {comment.content}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ ml: 4, display: 'block', mt: 0.25 }}
                                  >
                                    {new Date(
                                      comment.createdAt
                                    ).toLocaleString()}
                                  </Typography>
                                </Box>
                              )
                            )}
                          </Box>
                        </>
                      )}

                    {/* Report Photos (Citizen-submitted) */}
                    {selectedStop.isComplaintStop &&
                      selectedStop.reportPhotos &&
                      selectedStop.reportPhotos.length > 0 && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <PhotoCamera color="primary" fontSize="small" />
                            <Typography
                              variant="subtitle2"
                              color="primary"
                              sx={{ fontWeight: 600 }}
                            >
                              Report Photos ({selectedStop.reportPhotos.length})
                            </Typography>
                          </Box>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mb: 1 }}
                          >
                            Photos submitted by the citizen — click to enlarge
                          </Typography>

                          <ImageList
                            cols={3}
                            rowHeight={100}
                            sx={{ mt: 1, mb: 2 }}
                          >
                            {selectedStop.reportPhotos.map((photo, idx) => (
                              <ImageListItem
                                key={idx}
                                onClick={() =>
                                  openPhotoPreview(
                                    selectedStop.reportPhotos!,
                                    idx
                                  )
                                }
                                sx={{
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                    boxShadow: 3,
                                  },
                                }}
                              >
                                <img
                                  src={photo}
                                  alt={`Report photo ${idx + 1}`}
                                  loading="lazy"
                                  style={{
                                    borderRadius: 8,
                                    objectFit: 'cover',
                                    width: '100%',
                                    height: '100%',
                                  }}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        </>
                      )}

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
            This will immediately notify dispatch. Your truck's current GPS
            location will be shared automatically.
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
            sx={{ mb: 2 }}
          />

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: locationError ? 'warning.50' : 'success.50',
              borderColor: locationError ? 'warning.main' : 'success.main',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
              }}
            >
              <MyLocationIcon
                color={locationError ? 'warning' : 'success'}
                fontSize="small"
              />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600 }}
                color={locationError ? 'warning.main' : 'success.main'}
              >
                Truck GPS Location
              </Typography>
              {locationFetching && (
                <CircularProgress size={14} sx={{ ml: 'auto' }} />
              )}
            </Box>

            {locationFetching ? (
              <Typography variant="caption" color="text.secondary">
                Getting precise GPS position...
              </Typography>
            ) : emergencyLocation ? (
              <>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                >
                  📍 {emergencyLocation.latitude.toFixed(6)},{' '}
                  {emergencyLocation.longitude.toFixed(6)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.5 }}
                >
                  Accuracy: ±{Math.round(emergencyLocation.accuracy || 0)}m
                </Typography>
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={fetchEmergencyLocation}
                  disabled={locationFetching}
                  sx={{ mt: 1 }}
                >
                  Refresh Location
                </Button>
              </>
            ) : (
              <>
                <Typography variant="caption" color="warning.main">
                  {locationError ||
                    'Could not get GPS. Will use last known route stop.'}
                </Typography>
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={fetchEmergencyLocation}
                  disabled={locationFetching}
                  sx={{ mt: 1, display: 'block' }}
                >
                  Retry GPS
                </Button>
              </>
            )}
          </Paper>
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
            disabled={emergencySubmitting || locationFetching}
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

      {/* Enhanced Photo Preview Dialog with Navigation */}
      <Dialog
        open={!!previewPhoto}
        onClose={closePhotoPreview}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'rgba(0,0,0,0.95)',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Report Photo
            {previewPhotoList.length > 1 && (
              <Typography
                component="span"
                variant="body2"
                sx={{ ml: 2, opacity: 0.7 }}
              >
                {previewPhotoIndex + 1} of {previewPhotoList.length}
              </Typography>
            )}
          </Typography>
          <IconButton onClick={closePhotoPreview} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
            position: 'relative',
            minHeight: 400,
          }}
        >
          {/* Previous arrow */}
          {previewPhotoList.length > 1 && (
            <IconButton
              onClick={showPrevPhoto}
              sx={{
                position: 'absolute',
                left: 16,
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                zIndex: 2,
              }}
            >
              <ChevronLeftIcon fontSize="large" />
            </IconButton>
          )}

          {previewPhoto && (
            <img
              src={previewPhoto}
              alt="Enlarged preview"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 4,
              }}
            />
          )}

          {/* Next arrow */}
          {previewPhotoList.length > 1 && (
            <IconButton
              onClick={showNextPhoto}
              sx={{
                position: 'absolute',
                right: 16,
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                zIndex: 2,
              }}
            >
              <ChevronRightIcon fontSize="large" />
            </IconButton>
          )}
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: 'center', pb: 2, gap: 1 }}
        >
          {previewPhotoList.length > 1 && (
            <>
              <Button
                onClick={showPrevPhoto}
                sx={{ color: 'white' }}
                startIcon={<ChevronLeftIcon />}
              >
                Previous
              </Button>
              <Button
                onClick={showNextPhoto}
                sx={{ color: 'white' }}
                endIcon={<ChevronRightIcon />}
              >
                Next
              </Button>
            </>
          )}
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
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  DirectionsCar,
  CheckCircle,
  LocationOn,
  Warning,
  Route as RouteIcon,
  Refresh,
  Schedule,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { routeService, type Route, type RouteStop } from '../../Services/routeService';

// ============================================
// HELPERS — normalize status strings
// ============================================
const normalizeStatus = (status: string): string =>
  (status || '').toLowerCase().replace(/-/g, '_');

const getStopStatusColor = (status: string): string => {
  switch (normalizeStatus(status)) {
    case 'completed':
      return '#4CAF50';
    case 'skipped':
      return '#f44336';
    case 'pending':
    default:
      return '#FFA726';
  }
};

const getStopStatusIcon = (status: string) => {
  switch (normalizeStatus(status)) {
    case 'completed':
      return <CheckCircle sx={{ color: '#4CAF50' }} />;
    case 'skipped':
      return <Warning sx={{ color: '#f44336' }} />;
    case 'pending':
    default:
      return <LocationOn sx={{ color: '#FFA726' }} />;
  }
};

const getStopStatusLabel = (status: string): string => {
  switch (normalizeStatus(status)) {
    case 'completed':
      return 'Completed';
    case 'skipped':
      return 'Skipped';
    case 'pending':
    default:
      return 'Pending';
  }
};

const getRouteStatusColor = (
  status: string
): 'success' | 'warning' | 'error' | 'info' => {
  switch (normalizeStatus(status)) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'delayed':
      return 'error';
    case 'pending':
    default:
      return 'info';
  }
};

// UPDATED: Better time formatting with fallback
const formatTime = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    // Check if date is valid
    if (isNaN(date.getTime())) return '—';
    
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

// UPDATED: Robust time range formatter
const formatTimeRange = (start?: string | null, end?: string | null): string => {
  const startTime = formatTime(start);
  const endTime = formatTime(end);

  // If both are missing or identical, use the system default
  if (startTime === '—' && endTime === '—') return '8:00 AM – 4:00 PM';
  if (startTime === endTime) return '8:00 AM – 4:00 PM';

  // If one is missing, fill it with the default
  if (startTime === '—') return `8:00 AM – ${endTime}`;
  if (endTime === '—') return `${startTime} – 4:00 PM`;

  return `${startTime} – ${endTime}`;
};

// NEW: Calculate duration between two times
const calculateDuration = (start?: string | null, end?: string | null): string => {
  if (!start || !end) return '8.0 hrs (Default)';
  
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return '8.0 hrs (Default)';
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // If duration is less than 1 hour or negative, use default
    if (diffHours <= 0 || diffHours > 24) return '8.0 hrs (Default)';
    
    return `${diffHours.toFixed(1)} hrs`;
  } catch {
    return '8.0 hrs (Default)';
  }
};

// ============================================
// COMPONENT
// ============================================
export const RouteView: React.FC = () => {
  const navigate = useNavigate();
  const { truckId } = useParams<{ truckId: string }>();

  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // FETCH ROUTE BY TRUCK ID
  // ============================================
  const fetchRouteData = useCallback(
    async (showSpinner = true) => {
      if (!truckId) return;

      if (showSpinner) setLoading(true);
      else setRefreshing(true);

      setError(null);

      try {
        let finalRouteData: Route | null = null;

        try {
          const res = await routeService.getRouteByTruckId(truckId);
          finalRouteData = res.route;
        } catch (err: unknown) {
          const apiError = err as { response?: { status?: number } };
          
          if (apiError?.response?.status === 404) {
            const all = await routeService.getAllRoutes();
            
            const truckRoutes = (all.routes || []).filter(
              (r: Route) => r.truck?.truckId === truckId
            );

            if (truckRoutes.length > 0) {
              finalRouteData = truckRoutes[0];
            }
          } else {
            throw err;
          }
        }

        if (!finalRouteData) {
          setError(`No route found for truck ${truckId}`);
          setRoute(null);
          return;
        }

        if (!finalRouteData.stops || finalRouteData.stops.length === 0) {
          const fullRes = await routeService.getRouteById(finalRouteData.id);
          finalRouteData = fullRes.route;
        }

        setRoute(finalRouteData);
        
      } catch (err: unknown) {
        const e = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        setError(
          e.response?.data?.message ||
            e.response?.data?.error ||
            'Failed to load route data'
        );
        setRoute(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [truckId]
  );

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!isMounted) return;
      await fetchRouteData(true);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [fetchRouteData]);

  // ============================================
  // REFRESH HANDLER
  // ============================================
  const handleRefresh = () => {
    fetchRouteData(false);
  };

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading route data...</Typography>
      </Container>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  if (error || !route) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error || 'Route not found'}
        </Alert>
      </Container>
    );
  }

  // ============================================
  // CALCULATIONS
  // ============================================
  const stops = route.stops || [];
  const completedStops = stops.filter(
    (s: RouteStop) => normalizeStatus(s.status) === 'completed'
  ).length;
  const skippedStops = stops.filter(
    (s: RouteStop) => normalizeStatus(s.status) === 'skipped'
  ).length;
  const totalStops = stops.length;
  const progress = totalStops > 0 ? (completedStops / totalStops) * 100 : 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Back + Refresh */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin')}>
          Back to Dashboard
        </Button>
        <Button
          startIcon={
            refreshing ? <CircularProgress size={16} color="inherit" /> : <Refresh />
          }
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outlined"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Route Header */}
      <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white', mb: 3 }}>
        <Grid
          container
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Grid size="auto">
            <Typography
              variant="h5"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <DirectionsCar sx={{ mr: 1, verticalAlign: 'middle' }} />
              {route.truck?.truckId || route.truckId} - Route Status
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
              <strong>Driver:</strong>{' '}
              {route.truck?.driver?.name || 'Unassigned'} &nbsp;|&nbsp;{' '}
              <strong>Zone:</strong> {route.zone}
            </Typography>
            {/* UPDATED: Use formatTimeRange for cleaner output */}
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              <Schedule
                sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }}
              />
              {formatTimeRange(route.scheduledStart, route.scheduledEnd)}
              {' · '}
              {calculateDuration(route.scheduledStart, route.scheduledEnd)}
            </Typography>
          </Grid>
          <Grid size="auto">
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={normalizeStatus(route.status).toUpperCase().replace('_', ' ')}
                color={getRouteStatusColor(route.status)}
                sx={{ color: 'white' }}
              />
              <Chip
                label={`${completedStops}/${totalStops} stops`}
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
              {skippedStops > 0 && (
                <Chip
                  label={`${skippedStops} skipped`}
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Progress Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Route Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ height: 12, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="h5">{Math.round(progress)}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Completed: {completedStops} stops
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Remaining: {totalStops - completedStops - skippedStops} stops
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Stop List */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <RouteIcon /> All Stops
          </Typography>

          {stops.length === 0 ? (
            <Alert severity="info">No stops on this route yet.</Alert>
          ) : (
            <List>
              {stops.map((stop: RouteStop, index: number) => {
                const normalized = normalizeStatus(stop.status);
                const isSkipped = normalized === 'skipped';

                return (
                  <React.Fragment key={stop.id}>
                    <ListItem
                      sx={{
                        borderLeft: `4px solid ${getStopStatusColor(stop.status)}`,
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        py: 1.5,
                      }}
                    >
                      <ListItemIcon>{getStopStatusIcon(stop.status)}</ListItemIcon>
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
                              <strong>{index + 1}.</strong> {stop.address}
                            </Typography>
                            <Chip
                              label={getStopStatusLabel(stop.status)}
                              size="small"
                              sx={{
                                bgcolor: getStopStatusColor(stop.status),
                                color: 'white',
                                fontWeight: 'bold',
                                height: 22,
                              }}
                            />
                            {stop.isComplaintStop && (
                              <Chip
                                label={
                                  stop.complaintType === 'illegal-dumping'
                                    ? '🚯 Illegal Dumping'
                                    : '⚠️ Missed Collection'
                                }
                                size="small"
                                color={
                                  stop.complaintType === 'illegal-dumping'
                                    ? 'error'
                                    : 'warning'
                                }
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                            {stop.suburb && (
                              <Typography variant="caption" color="text.secondary">
                                📍 {stop.suburb}
                              </Typography>
                            )}
                            {stop.completedAt && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {normalized === 'completed'
                                  ? '✅ Completed at: '
                                  : '⏭️ Skipped at: '}
                                {formatTime(stop.completedAt)}
                              </Typography>
                            )}
                            {isSkipped && stop.skippedReason && (
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                Reason: {stop.skippedReason}
                              </Typography>
                            )}
                            {stop.notes && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  fontStyle: 'italic',
                                }}
                              >
                                📝 {stop.notes}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < stops.length - 1 && <Divider sx={{ my: 0.5 }} />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default RouteView;
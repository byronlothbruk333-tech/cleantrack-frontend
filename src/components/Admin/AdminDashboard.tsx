import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  CheckCircle,
  DirectionsCar,
  Refresh,
  Download,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Timer,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  kpiService,
  type KPIs,
  type FleetTruck,
  type RoutePerformance,
} from '../../Services/kpiService';
import { reportService, type Report } from '../../Services/reportService';
import api from '../../Services/api';
import { exportDashboardToExcel } from '../../utils/excelExport';

// ============================================
// RESET RESPONSE TYPE
// ============================================
interface ResetWeekResponse {
  message: string;
  resetAt: string;
  reset: {
    stops: number;
    routes: number;
    trucks: number;
    complaints: number;
  };
}

// ============================================
// COMPONENT
// ============================================
export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trucks, setTrucks] = useState<FleetTruck[]>([]);
  const [routeData, setRouteData] = useState<RoutePerformance[]>([]);
  const [routeStats, setRouteStats] = useState({
    totalRoutes: 0,
    completedRoutes: 0,
    avgEfficiency: 0,
    avgDuration: 0,
  });
  const [complaints, setComplaints] = useState<Report[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // ✅ IMPROVEMENT 6: Track "last seen" timestamp (state), derive new-complaints flag during render
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => {
    const stored = localStorage.getItem('admin_last_complaints_seen');
    return stored ? new Date(stored).getTime() : 0;
  });

  const [tabValue, setTabValue] = useState<number>(
    (location.state as { tab?: number })?.tab ?? 0
  );

  const hasInitialized = useRef(false);
  const isFetching = useRef(false);

  // ============================================
  // FETCH DASHBOARD DATA
  // ============================================
  const fetchDashboardData = async (isInitial = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (isInitial) setLoading(true);

    try {
      const [dashboardData, complaintsData] = await Promise.all([
        kpiService.getDashboardData(),
        reportService.getAllReports({ limit: 10 }),
      ]);

      setKpis(dashboardData.kpis);
      setTrucks(dashboardData.fleet);
      setRouteData(dashboardData.routes);
      setRouteStats(dashboardData.stats);
      setComplaints(complaintsData.reports);
      setError('');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      if (isInitial) {
        setError(
          error.response?.data?.message ||
            error.response?.data?.error ||
            'Failed to load dashboard data. Please try again.'
        );
      }
    } finally {
      if (isInitial) setLoading(false);
      isFetching.current = false;
    }
  };

  // ============================================
  // INITIAL LOAD + AUTO-REFRESH
  // ============================================
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      fetchDashboardData(true);
    }

    const intervalId = setInterval(() => fetchDashboardData(false), 60000);
    return () => clearInterval(intervalId);
  }, []);

  // ============================================
  // HELPERS
  // ============================================
  const getStatusColor = (
    status: string
  ): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'active':
      case 'available':
      case 'completed':
      case 'resolved':
        return 'success';
      case 'delayed':
      case 'pending':
        return 'warning';
      case 'inactive':
      case 'offline':
      case 'rejected':
        return 'error';
      case 'in-progress':
      case 'on-route':
      case 'maintenance':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (
    priority: string
  ): 'error' | 'warning' | 'info' | 'success' | 'default' => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  // ✅ IMPROVEMENT 6: Mark as seen when switching to Complaints tab
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    if (newValue === 2) {
      const now = new Date().toISOString();
      localStorage.setItem('admin_last_complaints_seen', now);
      setLastSeenTimestamp(new Date(now).getTime());
    }
  };

  // ============================================
  // EXCEL EXPORT
  // ============================================
  const handleExportReport = () => {
    setExportLoading(true);
    setTimeout(() => {
      try {
        exportDashboardToExcel({
          kpis,
          trucks,
          routeData,
          routeStats,
          complaints,
        });
      } catch (err) {
        console.error('Excel export failed:', err);
        alert('Failed to export dashboard data. Please try again.');
      } finally {
        setExportLoading(false);
      }
    }, 200);
  };

  // ============================================
  // RESET WEEK
  // ✅ IMPROVEMENT 5b (REVISED): Now archives instead of deletes
  // ============================================
  const handleResetWeek = async () => {
    if (resetConfirmText !== 'RESET') return;

    setResetLoading(true);
    try {
      const response = await api.post<ResetWeekResponse>('/kpis/reset-week');
      const data = response.data;

      alert(
        `✅ Week reset successfully!\n\n` +
          `Reset: ${data.reset.routes} routes, ` +
          `${data.reset.stops} stops, ` +
          `${data.reset.trucks} trucks\n` +
          `Archived: ${data.reset.complaints} complaints\n\n` +
          `Note: Citizens can still see their own reports in "My Reports".`
      );

      setShowResetDialog(false);
      setResetConfirmText('');
      await fetchDashboardData(true);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      alert(
        `❌ Failed to reset week:\n\n${
          error.response?.data?.message || 'Network error'
        }`
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ============================================
  // KPI CONFIG
  // ============================================
  const kpiConfigs = kpis
    ? [
        {
          id: 'completionRate',
          title: 'Collection Rate',
          value: kpis.completionRate,
          suffix: '%',
          icon: CheckCircle,
          color: 'success.main',
          progressColor: 'success' as const,
        },
        {
          id: 'fuelEfficiency',
          title: 'Fuel Efficiency',
          value: kpis.fuelEfficiency,
          suffix: '%',
          icon: TrendingUp,
          color: 'primary.main',
          progressColor: 'primary' as const,
        },
        {
          id: 'punctuality',
          title: 'Punctuality',
          value: kpis.punctuality,
          suffix: '%',
          icon: Speed,
          color: 'warning.main',
          progressColor: 'warning' as const,
        },
        {
          id: 'totalCollections',
          title: 'Total Complaints',
          value: kpis.totalCollections,
          suffix: '',
          icon: DirectionsCar,
          color: 'info.main',
          progressColor: undefined,
        },
      ]
    : [];

  // ============================================
  // ✅ IMPROVEMENT 6: Derive "has new complaints" during render
  // ============================================
  const hasNewComplaints =
    complaints.length > 0 &&
    tabValue !== 2 &&
    complaints.some(
      (c) => new Date(c.createdAt).getTime() > lastSeenTimestamp
    );

  // ============================================
  // LOADING
  // ============================================
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="body1" color="text.secondary">
            Loading dashboard data...
          </Typography>
        </Box>
      </Container>
    );
  }

  // ============================================
  // ERROR
  // ============================================
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => fetchDashboardData(true)}>
          Retry
        </Button>
      </Container>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4">Dashboard Overview</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={
              exportLoading ? <CircularProgress size={20} /> : <Download />
            }
            onClick={handleExportReport}
            disabled={exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export Week'}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<Refresh />}
            onClick={() => setShowResetDialog(true)}
          >
            Reset Week
          </Button>

          <IconButton
            onClick={() => fetchDashboardData(true)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : <Refresh />}
          </IconButton>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpiConfigs.map((config) => {
          const Icon = config.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={config.id}>
              <Card>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {config.title}
                      </Typography>
                      <Typography variant="h4">
                        {config.value}
                        {config.suffix}
                      </Typography>
                    </Box>
                    <Icon sx={{ fontSize: 40, color: config.color }} />
                  </Box>

                  {config.progressColor && (
                    <LinearProgress
                      variant="determinate"
                      value={typeof config.value === 'number' ? config.value : 0}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      color={config.progressColor}
                    />
                  )}

                  {config.id === 'totalCollections' && kpis && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {kpis.resolvedReports} resolved / {kpis.totalReports} total
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Fleet Status" />
          <Tab label="Route Performance" />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Complaints ({complaints.length})
                {hasNewComplaints && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.5, transform: 'scale(1.3)' },
                        '100%': { opacity: 1, transform: 'scale(1)' },
                      },
                    }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Fleet Status */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Fleet Status ({trucks.length} trucks)
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Truck ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Collection Days</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Completion</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trucks.map((truck) => {
                    const isResponse = truck.truckType === 'response-unit';

                    return (
                      <TableRow key={truck.id}>
                        <TableCell>{truck.truckId}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              isResponse ? '🚨 RESPONSE' : '🚛 COLLECTION'
                            }
                            size="small"
                            color={isResponse ? 'error' : 'default'}
                            variant={isResponse ? 'filled' : 'outlined'}
                            sx={{ fontSize: '0.7rem', height: 22 }}
                          />
                        </TableCell>
                        <TableCell>{truck.driverName}</TableCell>

                        {/* ✅ Zone — hidden for response units */}
                        <TableCell>
                          {isResponse ? (
                            <Typography
                              variant="body2"
                              color="text.disabled"
                            >
                              —
                            </Typography>
                          ) : (
                            truck.zone
                          )}
                        </TableCell>

                        <TableCell>
                          {isResponse ? (
                            <Chip
                              label="ON-CALL"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 0.5,
                                flexWrap: 'wrap',
                              }}
                            >
                              {(truck.workingDays || []).map((day) => (
                                <Chip
                                  key={day}
                                  label={day.slice(0, 3).toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.65rem', height: 20 }}
                                />
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={truck.status.toUpperCase().replace('-', ' ')}
                            color={getStatusColor(truck.status)}
                            size="small"
                          />
                        </TableCell>

                        {/* ✅ Completion — hidden for response units */}
                        <TableCell>
                          {isResponse ? (
                            <Typography
                              variant="body2"
                              color="text.disabled"
                            >
                              —
                            </Typography>
                          ) : (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={truck.completion}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                color={
                                  truck.completion >= 80
                                    ? 'success'
                                    : truck.completion >= 50
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                              <Typography variant="caption">
                                {truck.completion}%
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* ✅ IMPROVEMENT 2: Hide "View Route" button for response units */}
                          {!isResponse ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                navigate(`/admin/route/${truck.truckId}`)
                              }
                            >
                              View Route
                            </Button>
                          ) : (
                            <Chip
                              label="Standby"
                              size="small"
                              variant="outlined"
                              color="error"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab 1: Route Performance */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {routeStats.totalRoutes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Routes
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {routeStats.completedRoutes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {routeStats.avgEfficiency}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg Efficiency
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {routeStats.avgDuration.toFixed(1)}h
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg Duration
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Route Performance Details
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Route</TableCell>
                        <TableCell>Driver</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Stops</TableCell>
                        <TableCell>Completed</TableCell>
                        <TableCell>Efficiency</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {routeData.map((route) => (
                        <TableRow key={route.id}>
                          <TableCell>{route.route}</TableCell>
                          <TableCell>{route.driver}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <span>{route.duration}</span>
                              {route.durationType === 'actual' && (
                                <Chip
                                  label="ACTUAL"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{
                                    height: 18,
                                    fontSize: '0.6rem',
                                    '& .MuiChip-label': { px: 0.5 },
                                  }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{route.stops}</TableCell>
                          <TableCell>{route.completed}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={route.efficiency}
                                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                color={
                                  route.efficiency >= 80
                                    ? 'success'
                                    : route.efficiency >= 50
                                    ? 'warning'
                                    : 'error'
                                }
                              />
                              <Typography variant="caption">
                                {route.efficiency}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={route.status.toUpperCase().replace('-', ' ')}
                              color={getStatusColor(route.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 2: Complaints */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 4 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {kpis?.pendingReports || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {kpis?.inProgressReports || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Progress
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 4 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {kpis?.resolvedReports || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Resolved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Complaints
                </Typography>
                <List>
                  {complaints.map((complaint, index) => (
                    <React.Fragment key={complaint.id}>
                      <ListItem
                        sx={{
                          py: 2,
                          '&:hover': { bgcolor: 'action.hover' },
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          navigate(`/admin/complaint/${complaint.id}`)
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor:
                                getStatusColor(complaint.status) + '.main',
                            }}
                          >
                            {complaint.status === 'pending' && <PendingIcon />}
                            {complaint.status === 'in-progress' && <Timer />}
                            {complaint.status === 'resolved' && (
                              <CheckCircleIcon />
                            )}
                            {complaint.status === 'rejected' && <CancelIcon />}
                          </Avatar>
                        </ListItemAvatar>
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
                              <Typography variant="subtitle1">
                                {complaint.issueType
                                  .split('-')
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(' ')}
                              </Typography>
                              <Chip
                                label={complaint.status
                                  .toUpperCase()
                                  .replace('-', ' ')}
                                color={getStatusColor(complaint.status)}
                                size="small"
                              />
                              <Chip
                                label={complaint.priority.toUpperCase()}
                                color={getPriorityColor(complaint.priority)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>
                                  {complaint.citizen?.name || 'Unknown'}
                                </strong>{' '}
                                • {complaint.address}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {complaint.description}
                              </Typography>
                            </Box>
                          }
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            const now = new Date().toISOString();
                            localStorage.setItem(
                              'admin_last_complaints_seen',
                              now
                            );
                            setLastSeenTimestamp(new Date(now).getTime());
                            navigate(`/admin/complaint/${complaint.id}`);
                          }}
                        >
                          View
                        </Button>
                      </ListItem>
                      {index < complaints.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                  {complaints.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No complaints"
                        secondary="No reports have been submitted yet"
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ============================================
          RESET WEEK CONFIRMATION DIALOG
          ✅ UPDATED: Mentions "Archive" instead of "Delete"
      ============================================ */}
      <Dialog
        open={showResetDialog}
        onClose={() => {
          setShowResetDialog(false);
          setResetConfirmText('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'error.main', color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon />
            Reset Week Data
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <strong>This will reset the current week's progress.</strong>
            <br />
            Routes, schedules, and citizen reports are permanent.
          </Alert>

          <Typography variant="body1" gutterBottom>
            Resetting will:
          </Typography>

          <Box component="ul" sx={{ pl: 3, mt: 1 }}>
            <li>
              Reset all <strong>stop statuses</strong> back to <em>pending</em>
            </li>
            <li>
              Clear all <strong>completion timestamps</strong> and photos
            </li>
            <li>
              Reset <strong>route progress</strong> back to 0%
            </li>
            <li>
              Reset <strong>truck completion</strong> to 0%
            </li>
            <li>
              Set <strong>truck statuses</strong> to <em>available</em>{' '}
              (maintenance/offline preserved)
            </li>
            <li>
              <strong>Archive all complaints</strong> reported this week
              (hidden from Complaint tab)
            </li>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <strong>Note:</strong> Citizens will still see their own reports in
            "My Reports". Only this Admin Complaint tab will hide them.
          </Alert>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Before resetting:</strong> Make sure you have exported this
            week's data using the <strong>Export Week</strong> button.
          </Alert>

          <Typography variant="body2" sx={{ mt: 3, mb: 1 }}>
            Type <strong>RESET</strong> to confirm:
          </Typography>

          <TextField
            fullWidth
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
            placeholder="RESET"
            autoFocus
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowResetDialog(false);
              setResetConfirmText('');
            }}
            disabled={resetLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleResetWeek}
            disabled={resetConfirmText !== 'RESET' || resetLoading}
            startIcon={
              resetLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            {resetLoading ? 'Resetting...' : 'Reset Week'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
import React, { useState, useEffect } from 'react';
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
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh,
  LocalShipping,
  Build,
  CheckCircle,
  Block,
  Visibility,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  truckService,
  userService,
  type Truck,
  type TruckStatus,
  type TruckFormData,
  type Driver,
} from '../../Services/truckService';

// ============================================
// CONSTANTS
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

const INITIAL_FORM: TruckFormData = {
  truckId: '',
  registrationNumber: '',
  driverId: '',
  zone: 'Zone 1',
  status: 'offline',
  capacity: 100,
  latitude: -9.4438,
  longitude: 147.1803,
  lastMaintenance: new Date().toISOString().split('T')[0],
  nextMaintenance: '',
};

// ============================================
// HELPER: Detect response units
// `truckType` may exist on the runtime object even though it isn't
// declared on the `Truck` interface yet. Read it defensively.
// ============================================
type TruckWithType = Truck & { truckType?: string };

const isResponseUnit = (truck: Truck): boolean => {
  return (truck as TruckWithType).truckType === 'response-unit';
};

// ============================================
// COMPONENT
// ============================================
export const TruckRegistry: React.FC = () => {
  const navigate = useNavigate();

  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  // Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [deletingTruck, setDeletingTruck] = useState<Truck | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Form
  const [formData, setFormData] = useState<TruckFormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');

  // Drivers (for dropdown)
  const [drivers, setDrivers] = useState<Driver[]>([]);

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchTrucks = async () => {
    setLoading(true);
    setError('');

    try {
      const [trucksData, driversData] = await Promise.all([
        truckService.getAllTrucks(),
        userService.getDrivers(),
      ]);
      setTrucks(trucksData.trucks);
      setDrivers(driversData.drivers);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to load trucks. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const [trucksData, driversData] = await Promise.all([
          truckService.getAllTrucks(),
          userService.getDrivers(),
        ]);

        if (isMounted) {
          setTrucks(trucksData.trucks);
          setDrivers(driversData.drivers);
        }
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        if (isMounted) {
          setError(
            error.response?.data?.message ||
              error.response?.data?.error ||
              'Failed to load trucks. Please try again.'
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
  }, []);

  // ============================================
  // HELPERS
  // ============================================
  const showSnackbar = (
    message: string,
    severity: typeof snackbarSeverity
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const getStatusColor = (
    status: TruckStatus
  ): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'available':
        return 'success';
      case 'on-route':
        return 'info';
      case 'maintenance':
        return 'warning';
      case 'offline':
        return 'error';
    }
  };

  const getStatusIcon = (status: TruckStatus) => {
    switch (status) {
      case 'available':
        return <CheckCircle fontSize="small" />;
      case 'on-route':
        return <LocalShipping fontSize="small" />;
      case 'maintenance':
        return <Build fontSize="small" />;
      case 'offline':
        return <Block fontSize="small" />;
    }
  };

  // ✅ Read driver from nested object with fallback
  const getDriverName = (truck: Truck): string => {
    return truck.driver?.name || truck.driverName || 'Unassigned';
  };

  const filteredTrucks = trucks.filter((truck) => {
    const matchesSearch =
      truck.truckId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.registrationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getDriverName(truck).toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.zone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || truck.status === statusFilter;
    const matchesZone = zoneFilter === 'all' || truck.zone === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
  });

  // ============================================
  // FORM HANDLERS
  // ============================================
  const handleOpenAddDialog = () => {
    setEditingTruck(null);
    setFormData({
      ...INITIAL_FORM,
      lastMaintenance: new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({
      truckId: truck.truckId,
      registrationNumber: truck.registrationNumber,
      driverId: truck.driverId || '',
      zone: truck.zone,
      status: truck.status,
      capacity: truck.capacity,
      latitude: truck.latitude || 0,
      longitude: truck.longitude || 0,
      lastMaintenance: truck.lastMaintenance.split('T')[0],
      nextMaintenance: truck.nextMaintenance.split('T')[0],
    });
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleOpenDeleteDialog = (truck: Truck) => {
    setDeletingTruck(truck);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTruck(null);
    setFormErrors({});
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingTruck(null);
  };

  const handleInputChange = (
    field: keyof TruckFormData,
    value: string | number
  ) => {
    setFormData({ ...formData, [field]: value });
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.truckId.trim()) errors.truckId = 'Truck ID is required';
    if (!formData.registrationNumber.trim())
      errors.registrationNumber = 'Registration is required';
    if (!formData.zone) errors.zone = 'Zone is required';
    if (!formData.capacity || formData.capacity <= 0)
      errors.capacity = 'Capacity must be > 0';
    if (!formData.lastMaintenance)
      errors.lastMaintenance = 'Last maintenance required';
    if (!formData.nextMaintenance)
      errors.nextMaintenance = 'Next maintenance required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTruck = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingTruck) {
        await truckService.updateTruck(editingTruck.id, formData);
        showSnackbar('Truck updated successfully', 'success');
      } else {
        await truckService.createTruck(formData);
        showSnackbar('Truck created successfully', 'success');
      }

      handleCloseDialog();
      await fetchTrucks();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to save truck. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTruck = async () => {
    if (!deletingTruck) return;

    setSubmitting(true);
    try {
      await truckService.deleteTruck(deletingTruck.id);
      showSnackbar('Truck deleted successfully', 'success');
      handleCloseDeleteDialog();
      await fetchTrucks();
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to delete truck. Please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // STATS
  // ============================================
  const totalTrucks = trucks.length;
  const availableTrucks = trucks.filter((t) => t.status === 'available').length;
  const onRouteTrucks = trucks.filter((t) => t.status === 'on-route').length;
  const maintenanceTrucks = trucks.filter(
    (t) => t.status === 'maintenance'
  ).length;
  const offlineTrucks = trucks.filter((t) => t.status === 'offline').length;

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LocalShipping sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4">Truck Registry</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and monitor the fleet of waste collection trucks
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Truck
          </Button>
          <IconButton onClick={fetchTrucks} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : <Refresh />}
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totalTrucks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Trucks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {availableTrucks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Available
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {onRouteTrucks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On Route
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {maintenanceTrucks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maintenance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 2.4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {offlineTrucks}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Offline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                placeholder="Search trucks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="on-route">On Route</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Zone</InputLabel>
                <Select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  label="Zone"
                >
                  <MenuItem value="all">All Zones</MenuItem>
                  {ZONES.map((zone) => (
                    <MenuItem key={zone} value={zone}>
                      {zone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setZoneFilter('all');
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Registered Trucks ({filteredTrucks.length})
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Truck ID</TableCell>
                    <TableCell>Registration</TableCell>
                    <TableCell>Driver</TableCell>
                    <TableCell>Zone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Capacity</TableCell>
                    <TableCell>Completion</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTrucks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <LocalShipping
                          sx={{
                            fontSize: 48,
                            color: 'text.secondary',
                            mb: 1,
                          }}
                        />
                        <Typography color="text.secondary">
                          No trucks found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTrucks.map((truck) => {
                      const responseUnit = isResponseUnit(truck);

                      return (
                        <TableRow key={truck.id} hover>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {truck.truckId}
                            </Typography>
                          </TableCell>
                          <TableCell>{truck.registrationNumber}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  bgcolor: truck.driverId
                                    ? 'primary.main'
                                    : 'grey.400',
                                  fontSize: 14,
                                }}
                              >
                                {getDriverName(truck)
                                  .charAt(0)
                                  .toUpperCase()}
                              </Avatar>
                              <Typography variant="body2">
                                {getDriverName(truck)}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* ✅ Zone — hidden for response units */}
                          <TableCell>
                            {responseUnit ? (
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
                            <Chip
                              icon={getStatusIcon(truck.status)}
                              label={truck.status
                                .toUpperCase()
                                .replace('-', ' ')}
                              color={getStatusColor(truck.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{truck.capacity} units</TableCell>

                          {/* ✅ Completion — hidden for response units */}
                          <TableCell>
                            {responseUnit ? (
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
                                  minWidth: 120,
                                }}
                              >
                                <LinearProgress
                                  variant="determinate"
                                  value={truck.completion}
                                  sx={{
                                    flex: 1,
                                    height: 6,
                                    borderRadius: 3,
                                  }}
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

                          <TableCell align="right">
                            <Tooltip title="View Route">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() =>
                                  navigate(`/admin/route/${truck.truckId}`)
                                }
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleOpenEditDialog(truck)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenDeleteDialog(truck)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping color="primary" />
            {editingTruck ? 'Edit Truck' : 'Add New Truck'}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Truck ID *"
                value={formData.truckId}
                onChange={(e) => handleInputChange('truckId', e.target.value)}
                error={!!formErrors.truckId}
                helperText={formErrors.truckId}
                placeholder="e.g., T-001"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Registration Number *"
                value={formData.registrationNumber}
                onChange={(e) =>
                  handleInputChange('registrationNumber', e.target.value)
                }
                error={!!formErrors.registrationNumber}
                helperText={formErrors.registrationNumber}
                placeholder="e.g., ABC-123"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Assigned Driver</InputLabel>
                <Select
                  value={formData.driverId}
                  onChange={(e) =>
                    handleInputChange('driverId', e.target.value)
                  }
                  label="Assigned Driver"
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name} ({driver.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={!!formErrors.zone}>
                <InputLabel>Zone *</InputLabel>
                <Select
                  value={formData.zone}
                  onChange={(e) => handleInputChange('zone', e.target.value)}
                  label="Zone *"
                >
                  {ZONES.map((zone) => (
                    <MenuItem key={zone} value={zone}>
                      {zone}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.zone && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.5 }}
                  >
                    {formErrors.zone}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange('status', e.target.value as TruckStatus)
                  }
                  label="Status"
                >
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="on-route">On Route</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="offline">Offline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Capacity (units) *"
                value={formData.capacity}
                onChange={(e) =>
                  handleInputChange('capacity', parseInt(e.target.value) || 0)
                }
                error={!!formErrors.capacity}
                helperText={formErrors.capacity}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Last Maintenance *"
                value={formData.lastMaintenance}
                onChange={(e) =>
                  handleInputChange('lastMaintenance', e.target.value)
                }
                error={!!formErrors.lastMaintenance}
                helperText={formErrors.lastMaintenance}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Next Maintenance *"
                value={formData.nextMaintenance}
                onChange={(e) =>
                  handleInputChange('nextMaintenance', e.target.value)
                }
                error={!!formErrors.nextMaintenance}
                helperText={formErrors.nextMaintenance}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveTruck}
            disabled={submitting}
            startIcon={
              submitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : undefined
            }
          >
            {submitting
              ? 'Saving...'
              : editingTruck
              ? 'Update Truck'
              : 'Add Truck'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Truck</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete truck{' '}
            <strong>{deletingTruck?.truckId}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteTruck}
            disabled={submitting}
          >
            Delete
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

export default TruckRegistry;
import React, { useState, useRef } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Breadcrumbs,
  Link,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  LocationOn,
  Send,
  Warning,
  CheckCircle,
  PhotoCamera,
  Delete,
  Home as HomeIcon,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../Services/reportService';
import { uploadService } from '../../Services/uploadService';
import type { IssueType } from '../../Services/reportService';

// ============================================
// TYPES
// ============================================
interface ReportFormData {
  location: string;
  zone: string; // ADDED
  issueType: string;
  description: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}

const INITIAL_FORM: ReportFormData = {
  location: '',
  zone: '', // ADDED
  issueType: '',
  description: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
};

const ISSUE_TYPES = [
  { value: 'missed-collection', label: 'Missed Collection' },
  { value: 'illegal-dumping', label: 'Illegal Dumping' },
  { value: 'overflowing-bin', label: 'Overflowing Bin' },
  { value: 'other', label: 'Other Issue' },
];

// ADDED: Zone options with their suburbs
const ZONE_OPTIONS = [
  { value: 'Zone 1', label: 'Zone 1 (5 Mile, 6 Mile, Boroko)' },
  { value: 'Zone 2', label: 'Zone 2 (Erima, Gordons)' },
  { value: 'Zone 3', label: 'Zone 3 (7 Mile, 8 Mile, 9 Mile, Bomana)' },
  { value: 'Zone 4', label: 'Zone 4 (Gerehu, Morata, Waigani)' },
  { value: 'Zone 5', label: 'Zone 5 (Hohola, Tokarara)' },
  { value: 'Zone 6', label: 'Zone 6 (Badili, Koki, Konedobu)' },
  { value: 'Zone 7', label: 'Zone 7 (4 Mile, Murray Barracks, 3 Mile)' },
  { value: 'Zone 8', label: 'Zone 8 (Korobosea, Gabutu)' },
  { value: 'Zone 9', label: 'Zone 9 (Sabama, Taurama)' },
];

const MAX_PHOTOS = 2;

// ============================================
// COMPONENT
// ============================================
export const CitizenPortal: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ReportFormData>(INITIAL_FORM);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // HANDLERS
  // ============================================
  const showSnackbar = (message: string, severity: typeof snackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleInputChange =
    (field: keyof ReportFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [field]: event.target.value });
    };

  const handleSelectChange =
    (field: keyof ReportFormData) =>
    (event: { target: { value: unknown } }) => {
      setFormData({ ...formData, [field]: event.target.value as string });
    };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalPhotos = photos.length + newFiles.length;

    if (totalPhotos > MAX_PHOTOS) {
      showSnackbar(
        `Maximum ${MAX_PHOTOS} photos allowed. You tried to add ${newFiles.length}.`,
        'warning'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const newUrls = newFiles.map((file) => URL.createObjectURL(file));

    setPhotos([...photos, ...newFiles]);
    setPhotoUrls([...photoUrls, ...newUrls]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(photoUrls[index]);

    const newPhotos = [...photos];
    const newUrls = [...photoUrls];
    newPhotos.splice(index, 1);
    newUrls.splice(index, 1);

    setPhotos(newPhotos);
    setPhotoUrls(newUrls);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      showSnackbar('Geolocation is not supported by your browser', 'warning');
      return;
    }

    showSnackbar('Getting your location...', 'info');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        });
        showSnackbar('Location detected successfully!', 'success');
      },
      (error) => {
        showSnackbar(`Error getting location: ${error.message}`, 'error');
      }
    );
  };

  const handleSubmit = async () => {
    // UPDATED: Now requires 'zone'
    if (!formData.location.trim()) {
      showSnackbar('Please enter a location', 'warning');
      return;
    }
    if (!formData.zone) {
      showSnackbar('Please select a zone', 'warning');
      return;
    }
    if (!formData.issueType) {
      showSnackbar('Please select an issue type', 'warning');
      return;
    }
    if (!formData.description.trim()) {
      showSnackbar('Please provide a description', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedPhotoUrls: string[] = [];
      if (photos.length > 0) {
        showSnackbar(`Uploading ${photos.length} photo(s)...`, 'info');
        const uploadResult = await uploadService.uploadMultiple(photos);
        uploadedPhotoUrls = uploadResult.urls;

        if (uploadResult.errors && uploadResult.errors.length > 0) {
          console.warn('Some photos failed to upload:', uploadResult.errors);
        }
      }

      let latitude: number | undefined;
      let longitude: number | undefined;
      const coordMatch = formData.location.match(
        /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/
      );
      if (coordMatch) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
      }

      const response = await reportService.createReport({
        issueType: formData.issueType as IssueType,
        description: formData.description,
        address: formData.location,
        zone: formData.zone, // ADDED
        latitude,
        longitude,
        photos: uploadedPhotoUrls,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
      });

      showSnackbar(
        `Report submitted successfully! Ref: ${response.report.id.slice(0, 8)}`,
        'success'
      );

      photoUrls.forEach((url) => URL.revokeObjectURL(url));
      setFormData(INITIAL_FORM);
      setPhotos([]);
      setPhotoUrls([]);

      setTimeout(() => {
        navigate('/citizen/reports');
      }, 2000);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string; error?: string } };
      };
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to submit report. Please try again.';
      showSnackbar(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearForm = () => {
    photoUrls.forEach((url) => URL.revokeObjectURL(url));
    setFormData(INITIAL_FORM);
    setPhotos([]);
    setPhotoUrls([]);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/citizen')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Report Issue
        </Link>
      </Breadcrumbs>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, bgcolor: 'primary.main', color: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning sx={{ fontSize: 30 }} />
              <Box>
                <Typography variant="h5" component="h1">
                  Report a Waste Management Issue
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Help us keep your community clean by reporting any
                  waste-related issues
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Report Details
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                {/* Location */}
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}
                  >
                    <TextField
                      fullWidth
                      label="Location *"
                      placeholder="Enter address or coordinates"
                      value={formData.location}
                      onChange={handleInputChange('location')}
                      required
                      helperText="Enter a street address or coordinates"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn />
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleUseCurrentLocation}
                      sx={{ minWidth: '120px', mt: 1 }}
                      startIcon={<LocationOn />}
                    >
                      My Location
                    </Button>
                  </Box>
                </Grid>

                {/* ADDED: Zone Selection */}
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Zone *</InputLabel>
                    <Select
                      value={formData.zone}
                      onChange={handleSelectChange('zone')}
                      label="Zone *"
                    >
                      {ZONE_OPTIONS.map((zone) => (
                        <MenuItem key={zone.value} value={zone.value}>
                          {zone.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Issue Type */}
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Issue Type *</InputLabel>
                    <Select
                      value={formData.issueType}
                      onChange={handleSelectChange('issueType')}
                      label="Issue Type *"
                    >
                      {ISSUE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Description */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Description *"
                    placeholder="Please describe the issue in detail..."
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    required
                    multiline
                    rows={4}
                  />
                </Grid>

                {/* Photo Upload */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Attach Photos (Optional)
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 2 }}
                  >
                    Upload up to {MAX_PHOTOS} photos
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoCamera />}
                        disabled={photos.length >= MAX_PHOTOS}
                      >
                        Add Photos ({photos.length}/{MAX_PHOTOS})
                      </Button>
                    </label>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 2 }}
                    >
                      Max {MAX_PHOTOS} photos (JPG, PNG, WebP)
                    </Typography>
                  </Box>

                  {photoUrls.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                      {photoUrls.map((url, index) => (
                        <Box
                          key={index}
                          sx={{
                            position: 'relative',
                            width: 120,
                            height: 120,
                            border: '1px solid #e0e0e0',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={url}
                            alt={`Photo ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                            }}
                            onClick={() => handleRemovePhoto(index)}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Grid>

                {/* Contact Info */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contact Information (Optional)
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mb: 2 }}
                  >
                    We may contact you for follow-up or clarification
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={formData.contactName}
                    onChange={handleInputChange('contactName')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.contactPhone}
                    onChange={handleInputChange('contactPhone')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.contactEmail}
                    onChange={handleInputChange('contactEmail')}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Send />
                    )
                  }
                  sx={{ minWidth: 200 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleClearForm}
                  disabled={isSubmitting}
                >
                  Clear Form
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>1. Describe the Issue</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Provide location, zone, issue type, and description
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>2. Submit Report</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click submit and we'll route it to the right team
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>3. Follow Up</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Track your report status and get updates
                </Typography>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<CheckCircle />}
                onClick={() => navigate('/citizen/reports')}
                sx={{ mt: 2 }}
              >
                View Your Reports
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<Schedule />}
                onClick={() => navigate('/citizen/ScheduleLookup')}
                sx={{ mt: 1 }}
              >
                View Collection Schedule
              </Button>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <strong>Pro Tip:</strong> For urgent issues, please also call
                  our hotline at <strong>1900-WASTE</strong>
                </Typography>
              </Alert>

              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  <CheckCircle
                    sx={{ fontSize: 16, verticalAlign: 'middle', mr: 1 }}
                  />
                  All reports are reviewed within 24 hours
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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

export default CitizenPortal;
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Breadcrumbs,
  Link,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@mui/material';
import {
  CheckCircle,
  Pending as PendingIcon,
  Timer,
  Cancel as CancelIcon,
  Home as HomeIcon,
  Refresh,
  Close as CloseIcon,
  LocationOn,
  CalendarToday,
  Info,
  PhotoCamera,
  ChatBubbleOutlineOutlined,
  VerifiedUser,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  reportService,
  type Report,
  type ReportStats,
  type AdminComment,
} from '../../Services/reportService';

// ============================================
// COMPONENT
// ============================================
export const ReportTracking: React.FC = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // ✅ Photo preview state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // ============================================
  // INITIAL LOAD
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [reportsData, statsData] = await Promise.all([
          reportService.getMyReports(),
          reportService.getMyStats(),
        ]);

        if (isMounted) {
          setReports(reportsData.reports);
          setStats(statsData.stats);
        }
      } catch (err: unknown) {
        const error = err as {
          response?: { data?: { message?: string; error?: string } };
        };
        if (isMounted) {
          setError(
            error.response?.data?.message ||
              error.response?.data?.error ||
              'Failed to load reports. Please try again.'
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
  // REFRESH
  // ============================================
  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [reportsData, statsData] = await Promise.all([
        reportService.getMyReports(),
        reportService.getMyStats(),
      ]);

      setReports(reportsData.reports);
      setStats(statsData.stats);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to load reports. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getStatusColor = (
    status: string
  ): 'warning' | 'info' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in-progress':
        return 'info';
      case 'resolved':
        return 'success';
      case 'rejected':
        return 'error';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon />;
      case 'in-progress':
        return <Timer />;
      case 'resolved':
        return <CheckCircle />;
      case 'rejected':
        return <CancelIcon />;
      default:
        return <Info />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // ✅ Check if a report has a proof-of-service photo to show
  const hasProof = (report: Report) => {
    return !!(
      report.proofPhoto ||
      report.completionProof?.afterPhoto ||
      report.completionProof?.beforePhoto
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="inherit"
          onClick={() => navigate('/citizen')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary">My Reports</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">My Reports</Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main">
                      {stats.total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Reports
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {stats.pending}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {stats.inProgress}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Progress
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {stats.resolved}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Resolved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Empty State */}
          {reports.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Info sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No reports yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You haven't submitted any reports. Start by reporting a waste
                management issue.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/citizen')}
                startIcon={<PhotoCamera />}
              >
                Report an Issue
              </Button>
            </Paper>
          ) : (
            <>
              {/* Report List */}
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                All Reports ({reports.length})
              </Typography>

              {reports.map((report) => (
                <Card
                  key={report.id}
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
                  onClick={() => setSelectedReport(report)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ mb: 0.5 }}>
                          {report.issueType
                            .split('-')
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(' ')}
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
                            icon={getStatusIcon(report.status)}
                            label={report.status.toUpperCase().replace('-', ' ')}
                            color={getStatusColor(report.status)}
                            size="small"
                          />
                          <Chip
                            label={report.priority.toUpperCase()}
                            color={getPriorityColor(report.priority)}
                            size="small"
                            variant="outlined"
                          />

                          {/* Response badge */}
                          {report.adminResponse && (
                            <Chip
                              icon={<CheckCircle />}
                              label="Admin responded"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}

                          {/* Public comments badge */}
                          {report.adminComments &&
                            report.adminComments.length > 0 && (
                              <Chip
                                icon={<ChatBubbleOutlineOutlined />}
                                label={`${report.adminComments.length} comment${
                                  report.adminComments.length > 1 ? 's' : ''
                                }`}
                                color="primary"
                                size="small"
                                variant="outlined"
                              />
                            )}

                          {/* ✅ Proof of Service badge */}
                          {hasProof(report) && (
                            <Chip
                              icon={<VerifiedUser />}
                              label="Proof of Service"
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(report.createdAt)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <LocationOn
                        sx={{ fontSize: 16, color: 'text.secondary' }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {report.address}
                      </Typography>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {report.description}
                    </Typography>

                    {report.photos && report.photos.length > 0 && (
                      <Typography
                        variant="caption"
                        color="primary"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        📷 {report.photos.length} photo
                        {report.photos.length > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      {/* ============================================
          DETAILS DIALOG
      ============================================ */}
      <Dialog
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedReport && (
          <>
            <DialogTitle>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="h6">
                    {selectedReport.issueType
                      .split('-')
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(' ')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ref: {selectedReport.id.slice(0, 8)}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelectedReport(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              {/* Status row */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  icon={getStatusIcon(selectedReport.status)}
                  label={selectedReport.status.toUpperCase().replace('-', ' ')}
                  color={getStatusColor(selectedReport.status)}
                />
                <Chip
                  label={`${selectedReport.priority.toUpperCase()} PRIORITY`}
                  color={getPriorityColor(selectedReport.priority)}
                  variant="outlined"
                />
              </Box>

              {/* Details */}
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <LocationOn color="action" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {selectedReport.address}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <CalendarToday color="action" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Reported On
                    </Typography>
                    <Typography variant="body1">
                      {formatDateTime(selectedReport.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {selectedReport.resolvedAt && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <CheckCircle color="success" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Resolved On
                      </Typography>
                      <Typography variant="body1">
                        {formatDateTime(selectedReport.resolvedAt)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedReport.description}
              </Typography>

              {/* Admin Response Section */}
              {selectedReport.adminResponse && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <CheckCircle color="primary" />
                    <Typography variant="h6" color="primary">
                      Response from Admin
                    </Typography>
                  </Box>

                  <Alert
                    severity="info"
                    icon={<ChatBubbleOutlineOutlined />}
                    sx={{
                      borderLeft: '4px solid',
                      borderColor: 'primary.main',
                      '& .MuiAlert-message': { width: '100%' },
                    }}
                  >
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {selectedReport.adminResponse}
                    </Typography>
                    {selectedReport.adminRespondedAt && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        Responded:{' '}
                        {new Date(
                          selectedReport.adminRespondedAt
                        ).toLocaleString()}
                      </Typography>
                    )}
                  </Alert>
                </>
              )}

              {/* ✅ Proof of Service Section */}
              {(() => {
                const proofAfter =
                  selectedReport.proofPhoto ||
                  selectedReport.completionProof?.afterPhoto ||
                  null;
                const proofBefore =
                  selectedReport.completionProof?.beforePhoto || null;
                const proofAt =
                  selectedReport.proofPhotoUploadedAt ||
                  selectedReport.completionProof?.completedAt ||
                  null;

                if (!proofAfter) return null;

                return (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <VerifiedUser color="success" />
                      <Typography variant="h6" color="success.main">
                        Proof of Service
                      </Typography>
                      <Chip
                        label="VERIFIED"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>

                    <Alert severity="success" sx={{ mb: 2 }}>
                      Our team has attended to your report. Below is the
                      proof-of-service photo taken on site.
                    </Alert>

                    <Grid container spacing={2}>
                      {proofBefore && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            📷 BEFORE
                          </Typography>
                          <Box
                            component="img"
                            src={proofBefore}
                            alt="Before completion"
                            loading="lazy"
                            onClick={() => setPreviewPhoto(proofBefore)}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 2,
                              mt: 0.5,
                              border: '2px solid',
                              borderColor: 'warning.light',
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': { transform: 'scale(1.02)' },
                            }}
                          />
                        </Grid>
                      )}

                      <Grid size={{ xs: 12, sm: proofBefore ? 6 : 12 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600 }}
                        >
                          ✅ PROOF OF SERVICE (AFTER)
                        </Typography>
                        <Box
                          component="img"
                          src={proofAfter}
                          alt="After completion"
                          loading="lazy"
                          onClick={() => setPreviewPhoto(proofAfter)}
                          sx={{
                            width: '100%',
                            height: 240,
                            objectFit: 'cover',
                            borderRadius: 2,
                            mt: 0.5,
                            border: '2px solid',
                            borderColor: 'success.light',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'scale(1.02)' },
                          }}
                        />
                      </Grid>
                    </Grid>

                    {proofAt && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1.5 }}
                      >
                        Completed: {formatDateTime(proofAt)}
                      </Typography>
                    )}
                  </>
                );
              })()}

              {/* Admin Comments Section */}
              {selectedReport.adminComments &&
                selectedReport.adminComments.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <ChatBubbleOutlineOutlined color="primary" />
                      <Typography variant="h6" color="primary">
                        Admin Comments ({selectedReport.adminComments.length})
                      </Typography>
                    </Box>

                    <List sx={{ p: 0 }}>
                      {selectedReport.adminComments.map(
                        (comment: AdminComment) => (
                          <ListItem
                            key={comment.id}
                            alignItems="flex-start"
                            sx={{
                              bgcolor: 'primary.50',
                              borderLeft: '3px solid',
                              borderColor: 'primary.main',
                              borderRadius: 1,
                              mb: 1,
                              p: 2,
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: 'primary.main',
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                {comment.authorName.charAt(0).toUpperCase()}
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
                                  <Typography variant="subtitle2">
                                    {comment.authorName}
                                  </Typography>
                                  <Chip
                                    label={comment.authorRole.toUpperCase()}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ height: 20 }}
                                  />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography
                                    variant="body2"
                                    sx={{ mt: 0.5, color: 'text.primary' }}
                                  >
                                    {comment.content}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: 'block', mt: 0.5 }}
                                  >
                                    {formatDateTime(comment.createdAt)}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                        )
                      )}
                    </List>
                  </>
                )}

              {/* Original Photos */}
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Your Original Photos ({selectedReport.photos.length})
                  </Typography>
                  <ImageList cols={3} rowHeight={160} sx={{ mt: 1 }}>
                    {selectedReport.photos.map((photo, index) => (
                      <ImageListItem
                        key={index}
                        onClick={() => setPreviewPhoto(photo)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
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

              {/* Contact Info */}
              {(selectedReport.contactName ||
                selectedReport.contactPhone ||
                selectedReport.contactEmail) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Contact Information
                  </Typography>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}
                  >
                    {selectedReport.contactName && (
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedReport.contactName}
                      </Typography>
                    )}
                    {selectedReport.contactPhone && (
                      <Typography variant="body2">
                        <strong>Phone:</strong> {selectedReport.contactPhone}
                      </Typography>
                    )}
                    {selectedReport.contactEmail && (
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedReport.contactEmail}
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedReport(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ✅ Photo Preview Dialog */}
      <Dialog
        open={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
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
          Photo Preview
          <IconButton
            onClick={() => setPreviewPhoto(null)}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          }}
        >
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
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ReportTracking;
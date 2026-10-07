import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  ImageList,
  ImageListItem,
  Snackbar,
  Breadcrumbs,
  Link,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Person,
  CalendarToday,
  Description,
  CheckCircle,
  Timer,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Home as HomeIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Close as CloseIcon,
  VerifiedUser,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import {
  complaintService,
  type Complaint,
  type Comment,
} from '../../Services/complaintService';
import api from '../../Services/api';

// ============================================
// TYPES
// ============================================
interface Truck {
  id: string;
  truckId: string;
  zone: string;
  truckType?: 'collection' | 'response-unit';
  driverName?: string;
}

// ============================================
// COMPONENT
// ============================================
export const ComplaintDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Data
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  // Dialog
  const [openRejectDialog, setOpenRejectDialog] = useState(false);

  // Assign Truck states
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  // Photo preview state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Send Response state
  const [showRespondDialog, setShowRespondDialog] = useState(false);
  const [respondText, setRespondText] = useState('');
  const [responding, setResponding] = useState(false);

  // New comment
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info' | 'warning'
  >('info');

  const goBackToComplaintsTab = () => {
    navigate('/admin', { state: { tab: 2 } });
  };

  // ============================================
  // LOAD DATA
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');
        setNotFound(false);

        const [complaintData, commentsData] = await Promise.all([
          complaintService.getComplaintById(id),
          complaintService.getComments(id),
        ]);

        if (isMounted) {
          setComplaint(complaintData.report);
          setComments(commentsData.comments);
        }
      } catch (err: unknown) {
        const error = err as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string };
          };
        };
        if (isMounted) {
          if (error.response?.status === 404) {
            setNotFound(true);
          } else {
            setError(
              error.response?.data?.message ||
                error.response?.data?.error ||
                'Failed to load complaint. Please try again.'
            );
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // ============================================
  // LOAD TRUCKS FOR ASSIGNMENT
  // ============================================
  useEffect(() => {
    const fetchTrucks = async () => {
      if (!showAssignDialog) return;
      try {
        const response = await api.get('/trucks');
        const allTrucks: Truck[] = response.data.trucks || [];

        // Prefer response units first, then filter by zone
        const responseUnits = allTrucks.filter(
          (t) => t.truckType === 'response-unit'
        );
        const matchingTrucks = complaint?.zone
          ? allTrucks.filter(
              (t) =>
                t.zone === complaint.zone && t.truckType !== 'response-unit'
            )
          : [];

        const combined = [
          ...responseUnits,
          ...matchingTrucks,
          ...allTrucks.filter(
            (t) =>
              !responseUnits.includes(t) && !matchingTrucks.includes(t)
          ),
        ];

        const unique = Array.from(
          new Map(combined.map((t) => [t.id, t])).values()
        );

        setTrucks(unique);
      } catch (err) {
        console.error('Failed to load trucks:', err);
      }
    };
    fetchTrucks();
  }, [showAssignDialog, complaint?.zone]);

  // ============================================
  // HELPERS
  // ============================================
  const showSnackbar = (message: string, severity: typeof snackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

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
        return undefined;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // ============================================
  // STATUS ACTIONS
  // ============================================
  const handleMarkInProgress = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      const response = await complaintService.updateStatus(
        complaint.id,
        'in-progress'
      );
      setComplaint(response.report);
      showSnackbar('Complaint marked as In Progress', 'info');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to update status',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      const response = await complaintService.updateStatus(
        complaint.id,
        'resolved'
      );
      setComplaint(response.report);
      showSnackbar('Complaint marked as Resolved', 'success');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to update status',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      const response = await complaintService.updateStatus(
        complaint.id,
        'rejected'
      );
      setComplaint(response.report);
      setOpenRejectDialog(false);
      showSnackbar('Complaint has been rejected', 'error');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to reject complaint',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // ASSIGN TRUCK
  // ============================================
  const handleAssignTruck = async () => {
    if (!selectedTruckId || !complaint) return;

    setAssigning(true);
    try {
      await api.post(`/reports/${complaint.id}/assign-truck`, {
        truckId: selectedTruckId,
      });

      showSnackbar('✅ Response Unit assigned successfully!', 'success');
      setShowAssignDialog(false);
      setSelectedTruckId('');

      const refreshed = await complaintService.getComplaintById(complaint.id);
      setComplaint(refreshed.report);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
      };
      showSnackbar(
        error.response?.data?.message || 'Failed to assign response unit',
        'error'
      );
    } finally {
      setAssigning(false);
    }
  };

  // ============================================
  // SEND RESPONSE TO REPORTER
  // ============================================
  const handleSendResponse = async () => {
    if (!complaint || !respondText.trim()) return;

    setResponding(true);
    try {
      await complaintService.respondToReport(complaint.id, respondText.trim());

      const refreshed = await complaintService.getComplaintById(complaint.id);
      setComplaint(refreshed.report);

      const commentsData = await complaintService.getComments(complaint.id);
      setComments(commentsData.comments);

      setShowRespondDialog(false);
      setRespondText('');
      showSnackbar('✅ Response sent successfully!', 'success');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message || 'Failed to send response',
        'error'
      );
    } finally {
      setResponding(false);
    }
  };

  // ============================================
  // COMMENT ACTIONS
  // ============================================
  const handleAddComment = async () => {
    if (!complaint || !newComment.trim()) return;

    setActionLoading(true);
    try {
      const response = await complaintService.addComment(
        complaint.id,
        newComment.trim(),
        isInternal
      );
      setComments([...comments, response.comment]);
      setNewComment('');
      setIsInternal(false);
      showSnackbar('Comment added successfully', 'success');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to add comment',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!complaint) return;
    setActionLoading(true);
    try {
      await complaintService.deleteComment(complaint.id, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      showSnackbar('Comment deleted', 'success');
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Failed to delete comment',
        'error'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // LOADING / ERROR / NOT FOUND
  // ============================================
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (notFound) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={goBackToComplaintsTab}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="error">
          <Typography variant="h6">Complaint not found</Typography>
          <Typography variant="body2">No complaint exists with ID: {id}</Typography>
        </Alert>
      </Container>
    );
  }

  if (error || !complaint) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={goBackToComplaintsTab}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>
        <Alert severity="error">{error || 'Something went wrong'}</Alert>
      </Container>
    );
  }

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
          onClick={goBackToComplaintsTab}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary">
          Complaint {complaint.id.slice(0, 8)}
        </Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBack />}
        onClick={goBackToComplaintsTab}
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: getStatusColor(complaint.status) + '.main',
            width: 56,
            height: 56,
          }}
        >
          {getStatusIcon(complaint.status)}
        </Avatar>
        <Box>
          <Typography variant="h4">
            {complaint.issueType
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complaint ID: <strong>{complaint.id.slice(0, 8)}</strong>
          </Typography>
        </Box>
      </Box>

      {/* Status / Priority / Zone Chips */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={complaint.status.toUpperCase().replace('-', ' ')}
          color={getStatusColor(complaint.status)}
        />
        <Chip
          label={`${complaint.priority.toUpperCase()} PRIORITY`}
          color={getPriorityColor(complaint.priority)}
          variant="outlined"
        />
        {complaint.zone && (
          <Chip
            label={`📍 ${complaint.zone}`}
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {/* Existing Response Alert */}
      {complaint.adminResponse && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            border: '2px solid',
            borderColor: 'info.main',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            📨 Previous Response Sent:
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {complaint.adminResponse}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            Sent:{' '}
            {complaint.adminRespondedAt
              ? formatDateTime(complaint.adminRespondedAt)
              : 'Unknown'}
          </Typography>
        </Alert>
      )}

      {/* Main Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Complaint Details
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}
              >
                <Description color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {complaint.description}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}
              >
                <LocationOn color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Address
                  </Typography>
                  <Typography variant="body1">{complaint.address}</Typography>
                  {complaint.zone && (
                    <Typography variant="caption" color="primary">
                      Zone: {complaint.zone}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}
              >
                <Person color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Reported By
                  </Typography>
                  <Typography variant="body1">
                    {complaint.citizen?.name || 'Unknown'}
                  </Typography>
                  {complaint.citizen?.email && (
                    <Typography variant="caption" color="text.secondary">
                      {complaint.citizen.email}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <CalendarToday color="action" />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date Reported
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(complaint.createdAt)}
                  </Typography>
                  {complaint.resolvedAt && (
                    <Typography variant="caption" color="success.main">
                      Resolved: {formatDateTime(complaint.resolvedAt)}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Driver Completion Proof */}
              {complaint.completionProof &&
                (complaint.completionProof.beforePhoto ||
                  complaint.completionProof.afterPhoto) && (
                  <>
                    <Divider sx={{ my: 3 }} />
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
                        Driver Completion Proof
                      </Typography>
                    </Box>

                    <Alert severity="success" sx={{ mb: 2 }}>
                      The response unit has attended to this complaint. Below is
                      the before and after evidence.
                    </Alert>

                    <Grid container spacing={2}>
                      {complaint.completionProof.beforePhoto && (
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
                            src={complaint.completionProof.beforePhoto}
                            alt="Before"
                            loading="lazy"
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 2,
                              mt: 0.5,
                              border: '2px solid',
                              borderColor: 'warning.light',
                              cursor: 'pointer',
                            }}
                            onClick={() =>
                              setPreviewPhoto(
                                complaint.completionProof!.beforePhoto
                              )
                            }
                          />
                        </Grid>
                      )}

                      {complaint.completionProof.afterPhoto && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            ✅ AFTER
                          </Typography>
                          <Box
                            component="img"
                            src={complaint.completionProof.afterPhoto}
                            alt="After"
                            loading="lazy"
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 2,
                              mt: 0.5,
                              border: '2px solid',
                              borderColor: 'success.light',
                              cursor: 'pointer',
                            }}
                            onClick={() =>
                              setPreviewPhoto(
                                complaint.completionProof!.afterPhoto
                              )
                            }
                          />
                        </Grid>
                      )}
                    </Grid>

                    {complaint.completionProof.completedAt && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1.5 }}
                      >
                        Completed:{' '}
                        {formatDateTime(complaint.completionProof.completedAt)}
                      </Typography>
                    )}
                  </>
                )}

              {/* Original Photos */}
              {complaint.photos && complaint.photos.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Original Photos ({complaint.photos.length}) — click to
                    enlarge
                  </Typography>
                  <ImageList cols={3} rowHeight={160} sx={{ mt: 1 }}>
                    {complaint.photos.map((photo, index) => (
                      <ImageListItem
                        key={index}
                        onClick={() => setPreviewPhoto(photo)}
                        sx={{
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.03)',
                            boxShadow: 3,
                          },
                        }}
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
            </CardContent>
          </Card>

          {/* Comments */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Comments ({comments.length})
              </Typography>
              <Divider sx={{ my: 2 }} />

              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No comments yet. Add the first one below.
                </Typography>
              ) : (
                <List>
                  {comments.map((comment) => (
                    <ListItem
                      key={comment.id}
                      alignItems="flex-start"
                      sx={{
                        bgcolor: comment.isInternal ? 'warning.50' : 'grey.50',
                        borderRadius: 1,
                        mb: 1,
                      }}
                      secondaryAction={
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={actionLoading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {comment.author?.name?.charAt(0).toUpperCase() || '?'}
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
                              {comment.author?.name || 'Unknown'}
                            </Typography>
                            <Chip
                              label={comment.author?.role || 'user'}
                              size="small"
                              variant="outlined"
                            />
                            {comment.isInternal && (
                              <Chip
                                label="INTERNAL"
                                size="small"
                                color="warning"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
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
                  ))}
                </List>
              )}

              <Divider sx={{ my: 2 }} />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Type your comment here..."
                disabled={actionLoading}
              />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      disabled={actionLoading}
                    />
                  }
                  label="Internal note (admin only)"
                />
                <Button
                  variant="contained"
                  startIcon={<SendIcon />}
                  onClick={handleAddComment}
                  disabled={actionLoading || !newComment.trim()}
                >
                  Add Comment
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column — Actions */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {complaint.status !== 'resolved' &&
                  complaint.status !== 'rejected' && (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => setShowAssignDialog(true)}
                      disabled={actionLoading}
                      size="large"
                    >
                      🚛 Assign Response Unit
                    </Button>
                  )}

                <Button
                  variant="contained"
                  color="info"
                  fullWidth
                  startIcon={<SendIcon />}
                  onClick={() => setShowRespondDialog(true)}
                  disabled={actionLoading}
                  size="large"
                >
                  📨 Send Response to Reporter
                </Button>

                {complaint.status === 'pending' && (
                  <>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      onClick={handleMarkInProgress}
                      disabled={actionLoading}
                    >
                      Mark as In Progress
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => setOpenRejectDialog(true)}
                      disabled={actionLoading}
                    >
                      Reject Complaint
                    </Button>
                  </>
                )}

                {complaint.status === 'in-progress' && (
                  <>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={handleMarkResolved}
                      disabled={actionLoading}
                    >
                      Mark as Resolved
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      onClick={() => setOpenRejectDialog(true)}
                      disabled={actionLoading}
                    >
                      Reject Complaint
                    </Button>
                  </>
                )}

                {complaint.status === 'resolved' && (
                  <Alert severity="success">
                    This complaint has been resolved.
                  </Alert>
                )}

                {complaint.status === 'rejected' && (
                  <Alert severity="error">
                    This complaint has been rejected.
                  </Alert>
                )}

                <Button
                  variant="outlined"
                  onClick={goBackToComplaintsTab}
                  fullWidth
                >
                  Return to Dashboard
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Paper sx={{ mt: 2, p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              💡 Tip
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {complaint.status === 'pending'
                ? 'Assign a response unit based on the complaint zone, or mark it In Progress.'
                : complaint.status === 'in-progress'
                ? 'Once the collection is done, mark this complaint as Resolved.'
                : 'This complaint is closed.'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Assign Truck Dialog */}
      <Dialog
        open={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Response Unit</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Complaint Zone:</strong> {complaint.zone || 'Not specified'}
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Only response units in this zone are shown below. The complaint will
            be added as a new stop on the selected unit's active route.
          </Typography>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Response Unit</InputLabel>
            <Select
              value={selectedTruckId}
              onChange={(e) => setSelectedTruckId(e.target.value)}
              label="Select Response Unit"
            >
              {trucks.length === 0 ? (
                <MenuItem value="" disabled>
                  No units available
                </MenuItem>
              ) : (
                trucks.map((truck) => (
                  <MenuItem key={truck.id} value={truck.id}>
                    {truck.truckType === 'response-unit' ? '🚨' : '🚛'}{' '}
                    {truck.truckId} - {truck.zone} (
                    {truck.driverName || 'Unassigned'})
                    {truck.truckType === 'response-unit' && ' — RESPONSE UNIT'}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignTruck}
            disabled={!selectedTruckId || assigning}
            startIcon={assigning ? <CircularProgress size={20} /> : null}
          >
            {assigning ? 'Assigning...' : 'Assign Response Unit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Response Dialog */}
      <Dialog
        open={showRespondDialog}
        onClose={() => setShowRespondDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Response</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your response will be visible to the reporter and any assigned
            response units. Use this for emergency alerts, clarifications, or
            status updates.
          </Alert>

          {complaint.adminResponse && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>Previous response:</strong>
              <br />
              {complaint.adminResponse}
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                Sent:{' '}
                {complaint.adminRespondedAt
                  ? formatDateTime(complaint.adminRespondedAt)
                  : 'Unknown'}
              </Typography>
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Response *"
            value={respondText}
            onChange={(e) => setRespondText(e.target.value)}
            placeholder="e.g., Response unit dispatched to your location. ETA 15 minutes."
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setShowRespondDialog(false)}
            disabled={responding}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={handleSendResponse}
            disabled={!respondText.trim() || responding}
            startIcon={
              responding ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
          >
            {responding ? 'Sending...' : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog
        open={openRejectDialog}
        onClose={() => setOpenRejectDialog(false)}
      >
        <DialogTitle>Reject Complaint</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reject the complaint{' '}
            <strong>{complaint.id.slice(0, 8)}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectConfirm}
            disabled={actionLoading}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Preview Dialog */}
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

export default ComplaintDetail;
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Box,
  Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';

interface PhotoLightboxProps {
  open: boolean;
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
  title?: string;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  open,
  photos,
  initialIndex = 0,
  onClose,
  title = 'Photo Preview',
}) => {
  const [index, setIndex] = useState(initialIndex);

  // ✅ Reset index during render when the dialog reopens or the photos change.
  //    This is React's recommended pattern instead of setState inside an effect.
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitial, setPrevInitial] = useState(initialIndex);
  const [prevLength, setPrevLength] = useState(photos.length);

  if (
    open !== prevOpen ||
    initialIndex !== prevInitial ||
    photos.length !== prevLength
  ) {
    setPrevOpen(open);
    setPrevInitial(initialIndex);
    setPrevLength(photos.length);

    if (open) {
      const safeIndex = Math.max(0, Math.min(initialIndex, photos.length - 1));
      setIndex(safeIndex);
    }
  }

  const current = photos[index];

  const showNext = () => {
    if (photos.length === 0) return;
    setIndex((prev) => (prev + 1) % photos.length);
  };

  const showPrev = () => {
    if (photos.length === 0) return;
    setIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Keyboard nav — this is a legitimate side effect (external event listener),
  // so it's fine in an effect.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, photos.length, index]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          {title}
          {photos.length > 1 && (
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 2, opacity: 0.7 }}
            >
              {index + 1} of {photos.length}
            </Typography>
          )}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
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
        {photos.length > 1 && (
          <IconButton
            onClick={showPrev}
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

        {current && (
          <Box
            component="img"
            src={current}
            alt="Enlarged preview"
            sx={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 1,
            }}
          />
        )}

        {photos.length > 1 && (
          <IconButton
            onClick={showNext}
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

      <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
        {photos.length > 1 && (
          <>
            <Button
              onClick={showPrev}
              sx={{ color: 'white' }}
              startIcon={<ChevronLeftIcon />}
            >
              Previous
            </Button>
            <Button
              onClick={showNext}
              sx={{ color: 'white' }}
              endIcon={<ChevronRightIcon />}
            >
              Next
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PhotoLightbox;
/**
 * Image Bank Feature - TypeScript Type Definitions
 *
 * @fileoverview Complete type definitions for the Image Bank feature
 * @module image-bank/types
 */

// ============================================================================
// CORE IMAGE TYPES
// ============================================================================

/**
 * Extracted image from news content
 */
export interface ExtractedImage {
  /** Unique identifier */
  id: string;

  /** Image URL (full resolution) */
  url: string;

  /** Thumbnail URL (optimized for grid display, e.g., 300x300) */
  thumbnailUrl?: string;

  /** Source outlet information */
  outlet: {
    id: string;
    name: string;
    baseUrl: string;
  };

  /** Keywords/tags associated with the image */
  keywords: string[];

  /** Original article/content URL where image was found */
  sourceUrl: string;

  /** Extraction metadata */
  extraction: {
    /** When the image was extracted */
    extractedAt: Date | string;
    /** ID of the extraction run */
    extractionId: string;
  };

  /** Image dimensions (optional, may not be available) */
  dimensions?: {
    width: number;
    height: number;
    aspectRatio: number;
  };

  /** Alt text for accessibility (if available from source) */
  altText?: string;

  /** Whether image is already saved in user's bank */
  isSaved?: boolean;
}

/**
 * Paginated response for image list
 */
export interface ImageListResponse {
  images: ExtractedImage[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    nextCursor?: string | null;
  };
}

/**
 * Image detail with additional information
 */
export interface ImageDetail extends ExtractedImage {
  /** Related images from same article or keywords */
  relatedImages: ExtractedImage[];

  /** Additional metadata */
  metadata?: {
    /** File size in bytes */
    fileSize?: number;
    /** MIME type */
    mimeType?: string;
    /** Dominant color (hex) */
    dominantColor?: string;
  };
}

// ============================================================================
// FILTER & SORT TYPES
// ============================================================================

/**
 * Filter options for image list
 */
export interface ImageFilters {
  /** Filter by keywords (OR logic - any keyword matches) */
  keywords?: string[];

  /** Filter by source outlet IDs */
  outletIds?: string[];

  /** Filter by date range */
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };

  /** Show only saved images */
  onlySaved?: boolean;
}

/**
 * Sort options for image list
 */
export type ImageSortOption =
  | 'newest'        // Most recent first
  | 'oldest'        // Oldest first
  | 'relevant'      // Most relevant (algorithm-based)
  | 'source-asc'    // By source name (A-Z)
  | 'source-desc';  // By source name (Z-A)

/**
 * Complete query parameters for fetching images
 */
export interface ImageQueryParams {
  page?: number;
  limit?: number;
  filters?: ImageFilters;
  sort?: ImageSortOption;
  cursor?: string | null; // For cursor-based pagination
}

// ============================================================================
// SELECTION & UI STATE TYPES
// ============================================================================

/**
 * Multi-selection mode state
 */
export interface SelectionState {
  /** Whether multi-select mode is active */
  isMultiSelectMode: boolean;

  /** Set of selected image IDs */
  selectedImageIds: Set<string>;

  /** Timestamp when selection was made (for 30s grace period) */
  selectionTimestamp?: number;
}

/**
 * Active filter chip display
 */
export interface ActiveFilterChip {
  id: string;
  type: 'keyword' | 'outlet' | 'date';
  label: string;
  value: string | string[];
}

/**
 * UI state for image list screen
 */
export interface ImageListUIState {
  selection: SelectionState;
  filters: ImageFilters;
  activeFilterChips: ActiveFilterChip[];
  sort: ImageSortOption;
  isFilterModalOpen: boolean;
  isSortModalOpen: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to save images to bank
 */
export interface SaveToBankRequest {
  imageIds: string[];
}

/**
 * Response from save to bank operation
 */
export interface SaveToBankResponse {
  success: boolean;
  savedCount: number;
  failedCount?: number;
  errors?: Array<{
    imageId: string;
    reason: string;
  }>;
}

/**
 * Generic API error response
 */
export interface ImageAPIError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Props for ImageCard component
 */
export interface ImageCardProps {
  /** Image data to display */
  image: ExtractedImage;

  /** Whether the image is currently selected */
  isSelected: boolean;

  /** Whether multi-select mode is active */
  isMultiSelectMode: boolean;

  /** Callback when card is pressed (normal mode) */
  onPress: () => void;

  /** Callback when card is long-pressed (enter multi-select) */
  onLongPress: () => void;

  /** Optional: Show skeleton loading state */
  isLoading?: boolean;
}

/**
 * Props for ImageGrid component
 */
export interface ImageGridProps {
  /** Array of images to display */
  images: ExtractedImage[];

  /** Whether data is loading */
  isLoading: boolean;

  /** Whether more data is being fetched */
  isFetchingMore: boolean;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Callback to fetch next page */
  onLoadMore: () => void;

  /** Callback to refresh data */
  onRefresh: () => void;

  /** Whether refresh is in progress */
  isRefreshing: boolean;

  /** Current selection state */
  selectionState: SelectionState;

  /** Callback when image is tapped */
  onImagePress: (imageId: string) => void;

  /** Callback when multi-select mode is entered */
  onEnterMultiSelect: (imageId: string) => void;

  /** Callback when selection is toggled */
  onToggleSelection: (imageId: string) => void;
}

/**
 * Props for MultiSelectBar component
 */
export interface MultiSelectBarProps {
  /** Number of selected images */
  selectedCount: number;

  /** Callback when cancel/exit is pressed */
  onCancel: () => void;

  /** Callback when save/almacenar is pressed */
  onSave: () => void;

  /** Whether save operation is in progress */
  isSaving: boolean;

  /** Maximum allowed selections */
  maxSelections?: number;
}

/**
 * Props for FilterModal component
 */
export interface FilterModalProps {
  /** Whether modal is visible */
  visible: boolean;

  /** Currently active filters */
  activeFilters: ImageFilters;

  /** Available keywords to filter by */
  availableKeywords: string[];

  /** Available outlets to filter by */
  availableOutlets: Array<{ id: string; name: string }>;

  /** Callback when filters are applied */
  onApply: (filters: ImageFilters) => void;

  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Props for SortModal component
 */
export interface SortModalProps {
  /** Whether modal is visible */
  visible: boolean;

  /** Currently selected sort option */
  currentSort: ImageSortOption;

  /** Callback when sort option is selected */
  onSelectSort: (sort: ImageSortOption) => void;

  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * Props for FilterChip component
 */
export interface FilterChipProps {
  /** Chip data */
  chip: ActiveFilterChip;

  /** Callback when chip is removed */
  onRemove: (chipId: string) => void;
}

/**
 * Props for RelatedImagesCarousel component
 */
export interface RelatedImagesCarouselProps {
  /** Array of related images */
  relatedImages: ExtractedImage[];

  /** Callback when related image is tapped */
  onImagePress: (imageId: string) => void;

  /** Whether images are loading */
  isLoading?: boolean;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * Return type for useImages hook
 */
export interface UseImagesReturn {
  /** Flattened array of all images across pages */
  images: ExtractedImage[];

  /** Whether initial data is loading */
  isLoading: boolean;

  /** Whether an error occurred */
  isError: boolean;

  /** Error object if any */
  error: ImageAPIError | null;

  /** Whether next page is being fetched */
  isFetchingNextPage: boolean;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Function to fetch next page */
  fetchNextPage: () => void;

  /** Function to refetch current data */
  refetch: () => Promise<void>;

  /** Whether refresh is in progress */
  isRefreshing: boolean;
}

/**
 * Return type for useImageSelection hook
 */
export interface UseImageSelectionReturn {
  /** Current selection state */
  selectionState: SelectionState;

  /** Whether multi-select mode is active */
  isMultiSelectMode: boolean;

  /** Set of selected image IDs */
  selectedImageIds: Set<string>;

  /** Number of selected images */
  selectedCount: number;

  /** Enter multi-select mode with first selection */
  enterMultiSelect: (imageId: string) => void;

  /** Exit multi-select mode */
  exitMultiSelect: () => void;

  /** Toggle selection of an image */
  toggleSelection: (imageId: string) => void;

  /** Select all images */
  selectAll: (imageIds: string[]) => void;

  /** Deselect all images */
  deselectAll: () => void;

  /** Check if specific image is selected */
  isSelected: (imageId: string) => boolean;
}

/**
 * Return type for useImageFilters hook
 */
export interface UseImageFiltersReturn {
  /** Current active filters */
  filters: ImageFilters;

  /** Active filter chips for display */
  activeFilterChips: ActiveFilterChip[];

  /** Current sort option */
  sort: ImageSortOption;

  /** Apply new filters */
  applyFilters: (filters: ImageFilters) => void;

  /** Clear all filters */
  clearFilters: () => void;

  /** Remove specific filter chip */
  removeFilterChip: (chipId: string) => void;

  /** Set sort option */
  setSort: (sort: ImageSortOption) => void;

  /** Whether any filters are active */
  hasActiveFilters: boolean;
}

/**
 * Return type for useImageBank hook
 */
export interface UseImageBankReturn {
  /** Function to save images to bank */
  saveToBank: (imageIds: string[]) => Promise<SaveToBankResponse>;

  /** Whether save operation is in progress */
  isSaving: boolean;

  /** Error from save operation if any */
  error: ImageAPIError | null;

  /** Success response from last save */
  lastSaveResponse: SaveToBankResponse | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Sort option configuration
 */
export interface SortOptionConfig {
  value: ImageSortOption;
  label: string;
  icon: string; // Icon name from lucide-react-native
}

/**
 * Filter section configuration
 */
export interface FilterSection {
  id: string;
  title: string;
  type: 'checkbox' | 'radio' | 'date';
  options?: Array<{ id: string; label: string; value: string }>;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
}

/**
 * Toast notification configuration
 */
export interface ToastConfig {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
  duration?: number; // milliseconds
  position?: 'top' | 'bottom';
}

// ============================================================================
// CONSTANTS & ENUMS
// ============================================================================

/**
 * Constant values used across the feature
 */
export const IMAGE_BANK_CONSTANTS = {
  /** Grid configuration */
  GRID: {
    COLUMNS_MOBILE: 3,
    COLUMNS_TABLET: 6,
    GAP_MOBILE: 8,
    GAP_TABLET: 12,
    CARD_ASPECT_RATIO: 1, // 1:1 square
  },

  /** Pagination */
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 30,
    INITIAL_LOAD_COUNT: 60,
  },

  /** Selection limits */
  SELECTION: {
    MAX_SELECTIONS: 200,
    GRACE_PERIOD_MS: 30000, // 30 seconds
    LONG_PRESS_DURATION: 600, // milliseconds
  },

  /** Animation durations */
  ANIMATION: {
    SELECTION_DURATION: 200,
    MODAL_DURATION: 300,
    TOAST_DURATION: 3000,
    TOAST_AUTO_DISMISS: 3000,
  },

  /** Image URLs */
  IMAGE: {
    THUMBNAIL_SIZE: 300, // 300x300 for grid
    DETAIL_MAX_HEIGHT: 500, // Max height for detail view
  },
} as const;

/**
 * Sort option configurations
 */
export const SORT_OPTIONS: SortOptionConfig[] = [
  { value: 'newest', label: 'Más Recientes', icon: 'calendar' },
  { value: 'oldest', label: 'Más Antiguos', icon: 'calendar' },
  { value: 'relevant', label: 'Más Relevantes', icon: 'star' },
  { value: 'source-asc', label: 'Por Fuente (A-Z)', icon: 'arrow-up-a-z' },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if value is a valid ExtractedImage
 */
export function isExtractedImage(value: unknown): value is ExtractedImage {
  if (typeof value !== 'object' || value === null) return false;

  const img = value as Partial<ExtractedImage>;

  return (
    typeof img.id === 'string' &&
    typeof img.url === 'string' &&
    typeof img.outlet === 'object' &&
    Array.isArray(img.keywords)
  );
}

/**
 * Check if value is a valid ImageFilters object
 */
export function isImageFilters(value: unknown): value is ImageFilters {
  if (typeof value !== 'object' || value === null) return false;

  const filters = value as Partial<ImageFilters>;

  // All properties are optional, so just check types if they exist
  if (filters.keywords && !Array.isArray(filters.keywords)) return false;
  if (filters.outletIds && !Array.isArray(filters.outletIds)) return false;
  if (filters.onlySaved && typeof filters.onlySaved !== 'boolean') return false;

  return true;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  // Re-export all types for convenience
  ExtractedImage as Image,
  ImageListResponse as ImagesResponse,
  ImageQueryParams as QueryParams,
};

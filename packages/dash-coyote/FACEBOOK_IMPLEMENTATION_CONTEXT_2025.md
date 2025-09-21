# 📱 Facebook Module Implementation Context - 2025

## 🎯 Project Overview
Implementation of Facebook content extraction module for Pachuca Noticias dashboard. This module manages Facebook page monitoring, content extraction, and analytics with rate limiting compliance.

## 📋 Implementation Checklist

### ✅ Frontend UI Complete
- [x] Sidebar navigation with Facebook tab
- [x] Main dashboard route (`/facebook`)
- [x] Facebook dashboard component with tabs (Overview, Pages, Posts)
- [x] Statistics cards for monitoring
- [x] Pages management table
- [x] Recent posts display
- [x] Mock data structure
- [x] Progress component for quota visualization
- [x] All UI components using shadcn/ui

### ✅ Backend API Integration (In Progress)

#### 📊 Statistics Dashboard Connection
- [x] ✅ Connect dashboard stats to `/content-extraction-facebook/pages/stats/general` endpoint
  - [x] ✅ Map `activePages` to `pagesActive` in frontend
  - [x] ✅ Calculate `efficiency` from activePages/totalPages ratio
  - [x] ✅ Add safe fallbacks for undefined data
  - [ ] Map `postsToday` to API response (pending backend endpoint)
  - [ ] Map `extractionsHour` to API response (pending backend endpoint)
  - [ ] Map `quotaLimit` to API response (pending backend endpoint)
- [x] ✅ Implement real-time updates using TanStack Query
- [x] ✅ Add error handling for API failures
- [x] ✅ Add loading states for statistics cards

#### 📄 Pages Management Integration
- [x] ✅ Connect pages table to `/content-extraction-facebook/pages` endpoint
- [x] ✅ Implement CRUD operations:
  - [x] ✅ Create new page (`POST /content-extraction-facebook/pages`)
  - [x] ✅ Read pages list (`GET /content-extraction-facebook/pages`)
  - [x] ✅ Update page settings (`PUT /content-extraction-facebook/pages/:id`)
  - [x] ✅ Delete page (`DELETE /content-extraction-facebook/pages/:id`)
- [x] ✅ Connect page status updates to API
- [x] ✅ Implement extraction toggle functionality
- [x] ✅ Add pagination for large page lists
- [x] ✅ Add search/filter functionality

#### 🔗 URL-to-PageID Feature Implementation
- [ ] **PHASE 1**: Main Facebook Module (`facebook/`)
  - [ ] Create `FacebookPageUrlDto` and `FacebookPageInfoDto`
  - [ ] Implement `getPageIdFromUrl()` method in `FacebookService`
  - [ ] Add `POST /facebook/page-info-from-url` endpoint in controller
  - [ ] Add Graph API integration for URL → PageID conversion
- [ ] **PHASE 2**: Data Module Integration (`content-extraction-facebook/`)
  - [ ] Configure module dependencies (import FacebookModule)
  - [ ] Implement `createPageFromUrl()` in `FacebookPageManagementService`
  - [ ] Add `POST /content-extraction-facebook/pages/from-url` endpoint
  - [ ] Add duplicate page validation
- [ ] **PHASE 3**: Module Configuration
  - [ ] Export `FacebookService` from main module
  - [ ] Import `FacebookModule` in content-extraction module
  - [ ] Test cross-module service injection

#### 🎨 Enhanced Page Creation Form (Two-Step Process)

##### 📋 **Step 1: URL Input & Validation**
- [ ] Create Sheet/Dialog component for page creation
- [ ] Add URL input field as primary step
- [ ] Add "Validate URL" button to fetch page info
- [ ] Show loading state during URL validation
- [ ] Display page preview card with fetched data:
  - [ ] Page name
  - [ ] Page category
  - [ ] Follower count
  - [ ] Verification status
  - [ ] Page thumbnail/avatar
- [ ] Handle validation errors (invalid URL, page not found, etc.)
- [ ] Add manual PageID option as fallback/advanced mode

##### 📋 **Step 2: Form Configuration (Enabled after validation)**
- [ ] Enable form fields only after successful URL validation
- [ ] Pre-populate fields with fetched data:
  - [ ] Page Name (editable)
  - [ ] Category (editable)
  - [ ] PageID (read-only, from validation)
- [ ] Add configuration options:
  - [ ] Active monitoring toggle
  - [ ] Extraction frequency select (manual/daily/weekly)
  - [ ] Max posts per extraction slider (1-100)
  - [ ] API fields multi-select
- [ ] Add form validation with Zod
- [ ] Implement create page mutation
- [ ] Add success/error handling and toast notifications
- [ ] Form reset and close sheet on success

##### 🔧 **Technical Implementation Updates**
- [ ] Create `useFacebookPageValidation` hook for URL validation
- [ ] Update `useFacebookPages` hook with `createPageFromUrl` method
- [ ] Add loading and error states for both steps
- [ ] Implement proper TypeScript types for two-step flow
- [ ] Add form state management for step progression
- [ ] Handle edge cases (duplicate pages, private pages, etc.)

##### 🎯 **UX Flow**
```
1. User opens "Add Page" sheet
2. User pastes Facebook URL
3. User clicks "Validate URL"
4. System fetches page info and shows preview
5. Form fields become enabled with pre-populated data
6. User configures monitoring settings
7. User clicks "Create Page"
8. Success confirmation and sheet closes
```

##### 🛡️ **Error Handling**
- [ ] Invalid URL format errors
- [ ] Page not found/private page errors
- [ ] Already monitored page warnings
- [ ] Network/API errors with retry options
- [ ] Rate limiting notifications

## 🔍 API Analysis for Page Creation Form

### 📝 Create Facebook Page Endpoint Analysis

**Endpoint**: `POST /content-extraction-facebook/pages`
**DTO**: `CreateFacebookPageDto`

#### Required Fields:
```typescript
{
  pageId: string;        // Facebook Page ID (required)
  pageName: string;      // Page display name (required)
  category: string;      // Page category (required)
}
```

#### Optional Fields:
```typescript
{
  isActive?: boolean;    // Enable monitoring (default: true)
  extractionConfig?: {
    maxPosts?: number;           // Max posts per extraction (1-100, default: 50)
    frequency?: string;          // 'manual' | 'daily' | 'weekly' (default: 'manual')
    fields?: string[];           // API fields to extract (default: ['message', 'created_time', 'likes', 'shares', 'comments'])
  }
}
```

#### Response Structure:
```typescript
{
  message: string;       // Success message
  pageId: string;        // Created page ID
  pageName: string;      // Created page name
}
```

#### Error Responses:
- `400 BAD_REQUEST`: Invalid page ID or page not accessible
- `409 CONFLICT`: Page already being monitored

### 📋 Form Implementation Checklist

#### 🎨 UI Components Required:
- [ ] Sheet/Dialog component for form modal
- [ ] Form with react-hook-form + Zod validation
- [ ] Input field for Facebook Page ID (with validation)
- [ ] Input field for Page Name
- [ ] Select/Input for Category
- [ ] Toggle switch for "Active monitoring"
- [ ] Collapsible section for Advanced Configuration:
  - [ ] Slider/Input for Max Posts (1-100)
  - [ ] Select for Extraction Frequency
  - [ ] Multi-select for API Fields
- [ ] Submit button with loading state
- [ ] Cancel button

#### 🛠️ Implementation Steps:
- [ ] Create `CreateFacebookPageForm.tsx` component
- [ ] Create Zod schema matching backend DTO
- [ ] Implement form state management with react-hook-form
- [ ] Add mutation hook for page creation
- [ ] Implement optimistic updates
- [ ] Add success/error toast notifications
- [ ] Add form validation with error display
- [ ] Integrate with existing pages table refresh

#### 🔧 Technical Requirements:
- [ ] Use existing `useFacebookPages` hook for creation
- [ ] Implement proper TypeScript types
- [ ] Add loading and error states
- [ ] Form reset on successful submission
- [ ] Proper accessibility attributes

---

## 🚀 **URL-to-PageID Implementation Plan**

### 🎯 **Problem Statement**
Users need to input Facebook Page URLs instead of manually finding PageIDs. Current API only accepts PageID, but users typically have page URLs like `https://www.facebook.com/PageName`.

### 🏗️ **Module Architecture**

#### 📘 **Module: `facebook/` (Main API)**
- **Role**: Direct Facebook Graph API calls
- **Responsibility**: URL → PageID conversion logic
- **New Service Method**: `getPageIdFromUrl(pageUrl: string)`
- **New Controller Endpoint**: `POST /facebook/page-info-from-url`

#### 📊 **Module: `content-extraction-facebook/` (Data Management)**
- **Role**: Data persistence and monitoring management
- **Responsibility**: Use main module services for validation
- **New Service Method**: `createPageFromUrl(pageUrl: string)`
- **New Controller Endpoint**: `POST /content-extraction-facebook/pages/from-url`

### 📋 **Implementation Phases**

#### **PHASE 1: Main Module Implementation (`facebook/`)**

##### 🔧 **1.1 - Update `facebook.service.ts`**
```typescript
async getPageIdFromUrl(pageUrl: string): Promise<FacebookPageInfoDto> {
  const response = await axios.get('https://graph.facebook.com/', {
    params: {
      id: pageUrl,
      fields: 'id,name,category,verification_status',
      access_token: this.accessToken
    }
  });

  return {
    pageId: response.data.id,
    pageName: response.data.name,
    category: response.data.category,
    verified: response.data.verification_status === 'blue_verified',
    isAccessible: true
  };
}
```

##### 🎮 **1.2 - Update `facebook.controller.ts`**
```typescript
@Post('page-info-from-url')
@ApiOperation({ summary: 'Get Facebook page info from URL' })
@ApiResponse({ status: 200, description: 'Page info retrieved successfully' })
@ApiResponse({ status: 400, description: 'Invalid URL or page not found' })
async getPageInfoFromUrl(@Body() dto: FacebookPageUrlDto): Promise<FacebookPageInfoDto> {
  return this.facebookService.getPageIdFromUrl(dto.pageUrl);
}
```

##### 📝 **1.3 - Create DTOs**
```typescript
// facebook/dto/facebook-url.dto.ts
export class FacebookPageUrlDto {
  @ApiProperty({ description: 'Facebook page URL', example: 'https://www.facebook.com/PageName' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  pageUrl: string;
}

export class FacebookPageInfoDto {
  @ApiProperty({ description: 'Facebook Page ID', example: '123456789' })
  pageId: string;

  @ApiProperty({ description: 'Page name', example: 'Page Name' })
  pageName: string;

  @ApiProperty({ description: 'Page category', example: 'Media/News Company' })
  category: string;

  @ApiProperty({ description: 'Page is verified', example: true })
  verified: boolean;

  @ApiProperty({ description: 'Page is accessible', example: true })
  isAccessible: boolean;
}
```

#### **PHASE 2: Data Module Integration (`content-extraction-facebook/`)**

##### 🔄 **2.1 - Update Module Dependencies**
```typescript
// content-extraction-facebook.module.ts
import { FacebookModule } from '../facebook/facebook.module';

@Module({
  imports: [
    FacebookModule, // Import main Facebook module
    // ... other imports
  ],
})
export class ContentExtractionFacebookModule {}
```

##### 🔄 **2.2 - Update `facebook-page-management.service.ts`**
```typescript
constructor(
  private readonly facebookService: FacebookService, // Inject from main module
  // ... other services
) {}

async createPageFromUrl(pageUrl: string): Promise<MonitoredFacebookPageDocument> {
  // 1. Get page info from URL using main module
  const pageInfo = await this.facebookService.getPageIdFromUrl(pageUrl);

  // 2. Check if page already exists
  const existingPage = await this.getPageById(pageInfo.pageId).catch(() => null);
  if (existingPage) {
    throw new ConflictException('Page is already being monitored');
  }

  // 3. Create page DTO
  const createPageDto: CreateFacebookPageDto = {
    pageId: pageInfo.pageId,
    pageName: pageInfo.pageName,
    category: pageInfo.category,
    isActive: true
  };

  // 4. Use existing createPage method
  return this.createPage(createPageDto);
}
```

##### 🎮 **2.3 - Update `facebook-pages.controller.ts`**
```typescript
@Post('from-url')
@ApiOperation({
  summary: 'Add Facebook page from URL',
  description: 'Add a new Facebook page to monitoring using page URL instead of page ID'
})
@ApiResponse({ status: 201, description: 'Page added from URL successfully' })
@ApiResponse({ status: 400, description: 'Invalid URL or page not accessible' })
@ApiResponse({ status: 409, description: 'Page already being monitored' })
async createPageFromUrl(@Body() dto: FacebookPageUrlDto): Promise<{
  message: string;
  pageId: string;
  pageName: string;
}> {
  this.logger.log(`Creating page from URL: ${dto.pageUrl}`);

  const createdPage = await this.pageManagementService.createPageFromUrl(dto.pageUrl);

  return {
    message: 'Page added from URL successfully',
    pageId: createdPage.pageId,
    pageName: createdPage.pageName
  };
}
```

#### **PHASE 3: Module Exports Configuration**

##### 📤 **3.1 - Update `facebook.module.ts`**
```typescript
@Module({
  // ... existing config
  exports: [
    FacebookService, // Export for other modules
    // ... other exports
  ],
})
export class FacebookModule {}
```

### 🔧 **Technical Specifications**

#### **📡 Facebook Graph API Integration:**
- **Endpoint**: `GET https://graph.facebook.com/?id={pageUrl}&fields=id,name,category,verification_status&access_token={token}`
- **Rate Limiting**: Counts against daily quota
- **Error Handling**: Handle invalid URLs, private pages, deleted pages

#### **🛡️ Validation Requirements:**
- URL format validation (must be Facebook URL)
- Page accessibility verification
- Duplicate page checking
- Rate limit protection

#### **⚡ User Flow:**
1. User enters Facebook page URL in form
2. Frontend calls: `POST /content-extraction-facebook/pages/from-url`
3. Backend validates URL and fetches page info
4. Backend creates monitored page entry
5. Frontend shows success with page details

### 📊 **Updated Frontend Integration**

#### **Form Enhancement:**
- Add URL input field as primary method
- Keep manual PageID as secondary/advanced option
- Auto-populate fields when URL is processed
- Show page preview before final submission

#### **API Integration:**
```typescript
// In useFacebookPages.ts
const createPageFromUrl = async (pageUrl: string): Promise<FacebookPage> => {
  const { data } = await apiClient.post<FacebookPage>('/content-extraction-facebook/pages/from-url', {
    pageUrl
  });
  return data;
}
```

### 🧪 **Testing Strategy**
- Unit tests for URL parsing and validation
- Integration tests for Graph API calls
- E2E tests for complete user flow
- Error scenario testing (invalid URLs, private pages)

---

#### 📝 Posts Integration
- [x] ✅ Connect recent posts to `/content-extraction-facebook/extraction/posts` endpoint
- [x] ✅ Implement post pagination
- [x] ✅ Connect engagement metrics to API
- [x] ✅ Add post filtering by page/date
- [ ] Implement post details view
- [ ] Add post engagement analytics

#### ⚡ Real-time Features
- [ ] Implement Socket.IO connection for live updates
- [ ] Connect quota monitoring to real-time data
- [ ] Add live extraction job status updates
- [ ] Implement system status monitoring

#### 🔧 Queue Management Integration
- [ ] Connect to Bull queue system
- [ ] Display extraction job queue status
- [ ] Show pending/processing/failed jobs
- [ ] Implement job retry functionality
- [ ] Add job priority management

### 🛠️ Technical Implementation Details

#### 🔗 API Endpoint Mapping
```typescript
// Statistics
GET /facebook/stats → Dashboard statistics cards
GET /facebook/quota → Real-time quota monitoring

// Pages Management
GET /facebook/pages → Pages table data
POST /facebook/pages → Add new page
PUT /facebook/pages/:id → Update page
DELETE /facebook/pages/:id → Remove page
POST /facebook/pages/:id/extract → Trigger extraction

// Posts
GET /facebook/posts/recent → Recent posts list
GET /facebook/posts/:id → Post details
GET /facebook/posts?page=:pageId → Posts by page

// System
GET /facebook/system/status → System health check
GET /facebook/jobs → Queue status
POST /facebook/jobs/:id/retry → Retry failed job
```

#### 📦 Data Type Integration
- [ ] Create TypeScript interfaces matching API responses
- [ ] Update mock data structure to match real API
- [ ] Implement Zod schemas for validation
- [ ] Add error boundary components

#### 🎣 TanStack Patterns Implementation
- [ ] Implement Server Functions for data fetching
- [ ] Add route loaders for initial data
- [ ] Implement optimistic updates
- [ ] Add mutation error handling
- [ ] Implement route-level error boundaries

#### 🔄 State Management
- [ ] Configure TanStack Query for Facebook module
- [ ] Implement cache invalidation strategies
- [ ] Add offline support for critical data
- [ ] Implement optimistic UI updates

### 🔐 Security & Validation
- [ ] Implement Facebook API token management
- [ ] Add rate limiting client-side protection
- [ ] Validate all form inputs with Zod
- [ ] Implement proper error messages
- [ ] Add CSRF protection for mutations

### 🧪 Testing Strategy
- [ ] Unit tests for Facebook components
- [ ] Integration tests for API connections
- [ ] E2E tests for complete workflows
- [ ] Performance testing for large datasets
- [ ] Error scenario testing

### 📈 Performance Optimization
- [ ] Implement virtual scrolling for large lists
- [ ] Add image lazy loading
- [ ] Optimize bundle size
- [ ] Implement proper caching strategies
- [ ] Add performance monitoring

### 🎨 UX Enhancements
- [ ] Add loading skeletons
- [ ] Implement toast notifications
- [ ] Add confirmation dialogs
- [ ] Implement bulk operations
- [ ] Add keyboard shortcuts
- [ ] Implement responsive design improvements

## 🗂️ File Structure Map

```
src/
├── features/facebook/
│   ├── components/
│   │   ├── FacebookDashboard.tsx ✅
│   │   ├── FacebookPageForm.tsx (pending)
│   │   ├── FacebookPostDetail.tsx (pending)
│   │   └── FacebookMetrics.tsx (pending)
│   ├── hooks/
│   │   ├── useFacebookStats.ts (pending)
│   │   ├── useFacebookPages.ts (pending)
│   │   └── useFacebookPosts.ts (pending)
│   ├── types/
│   │   └── facebook.types.ts (pending)
│   └── utils/
│       └── facebook.utils.ts (pending)
├── routes/_authenticated/
│   └── facebook.tsx ✅
└── components/
    ├── AppSidebar.tsx ✅
    └── ui/progress.tsx ✅
```

## 🔗 Existing Backend Structure

### Available API Modules
- `content-extraction-facebook/` - Main Facebook integration module
- Controllers: `facebook.controller.ts`, `facebook-pages.controller.ts`
- Services: `facebook.service.ts`, `facebook-webhook.service.ts`
- DTOs: Create/Update page schemas
- Queue: Bull integration for async processing

### Database Schema
- FacebookPage entity with extraction settings
- FacebookPost entity with engagement metrics
- FacebookJob entity for queue management
- FacebookMetrics for analytics storage

## 🚀 Implementation Priority

### Phase 1: Core Data Connection (Week 1)
1. Statistics API integration
2. Pages CRUD operations
3. Basic error handling

### Phase 2: Real-time Features (Week 2)
1. Socket.IO integration
2. Live quota monitoring
3. Job queue visualization

### Phase 3: Advanced Features (Week 3)
1. Post management
2. Advanced filtering
3. Performance optimization

### Phase 4: Polish & Testing (Week 4)
1. Comprehensive testing
2. UX enhancements
3. Performance tuning

## 📝 Notes
- All API endpoints follow RESTful conventions
- Rate limiting: 200 Facebook API calls per hour
- Real-time updates via Socket.IO
- MongoDB for data persistence
- Bull queues for async processing
- Proper error handling and user feedback
- Mobile-responsive design required

---
**Status**: UI Complete ✅ | API Integration Pending 🔄 | Testing Pending ⏳
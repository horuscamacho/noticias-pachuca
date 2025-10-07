export interface Xpostsreponse {
  cursor: Cursor;
  result: XpostsreponseResult;
}

export interface Cursor {
  bottom: string;
  top: string;
}

export interface XpostsreponseResult {
  timeline: Timeline;
}

export interface Timeline {
  instructions: Instruction[];
  metadata: TimelineMetadata;
}

export interface Instruction {
  type: string;
  entry?: PurpleEntry;
  entries?: EntryElement[];
}

export interface EntryElement {
  entryId: string;
  sortIndex: string;
  content: PurpleContent;
}

export interface PurpleContent {
  entryType: EntryTypeEnum;
  __typename: EntryTypeEnum;
  itemContent?: PurpleItemContent;
  clientEventInfo?: ItemClientEventInfo;
  items?: ItemElement[];
  metadata?: ContentMetadata;
  displayType?: string;
  header?: Header;
  footer?: Footer;
  value?: string;
  cursorType?: string;
}

export enum EntryTypeEnum {
  TimelineTimelineCursor = 'TimelineTimelineCursor',
  TimelineTimelineItem = 'TimelineTimelineItem',
  TimelineTimelineModule = 'TimelineTimelineModule',
}

export interface ItemClientEventInfo {
  component: Ent;
  element?: Element;
  details: Details;
}

export enum Ent {
  SuggestRankedOrganicTweet = 'suggest_ranked_organic_tweet',
  SuggestWhoToFollow = 'suggest_who_to_follow',
  Tweet = 'tweet',
}

export interface Details {
  timelinesDetails: TimelinesDetails;
}

export interface TimelinesDetails {
  injectionType: InjectionType;
  controllerData: ControllerData;
  sourceData?: string;
}

export enum ControllerData {
  DAACDAABDAABCGABAAAAAAAAAAAKAAkAAAAARLLM2QoACGAAAZl8NYaTAAAAAA = 'DAACDAABDAABCgABAAAAAAAAAAAKAAkAAAAARLLM2QoACgAAAZl8NYaTAAAAAA==',
  DAACDAACDAABCGABAAAAAAAAAAgAAAAA = 'DAACDAACDAABCgABAAAAAAAAAAgAAAAA',
}

export enum InjectionType {
  RankedOrganicTweet = 'RankedOrganicTweet',
  WhoToFollow = 'WhoToFollow',
}

export enum Element {
  Tweet = 'tweet',
  User = 'user',
}

export interface Footer {
  displayType: string;
  text: string;
  landingUrl: LandingURLClass;
}

export interface LandingURLClass {
  url: string;
  urlType: URLType;
}

export enum URLType {
  DeepLink = 'DeepLink',
}

export interface Header {
  displayType: string;
  text: string;
  sticky: boolean;
}

export interface PurpleItemContent {
  itemType: ItemTypeEnum;
  __typename: ItemTypeEnum;
  tweet_results: PurpleTweetResults;
  tweetDisplayType: TweetDisplayType;
  promotedMetadata?: PromotedMetadata;
}

export enum ItemTypeEnum {
  TimelineTweet = 'TimelineTweet',
  TimelineUser = 'TimelineUser',
}

export interface PromotedMetadata {
  advertiser_results: SerResults;
  adMetadataContainer: AdMetadataContainer;
  disclosureType: string;
  experimentValues: ExperimentValue[];
  impressionId: string;
  impressionString: string;
  clickTrackingInfo: ClickTrackingInfo;
}

export interface AdMetadataContainer {
  renderLegacyWebsiteCard: boolean;
}

export interface SerResults {
  result: AdvertiserResultsResult;
}

export interface AdvertiserResultsResult {
  __typename: UserDisplayTypeEnum;
  id: string;
  rest_id: string;
  affiliates_highlighted_label: AffiliatesHighlightedLabel;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: ProfileImageShape;
  legacy: PurpleLegacy;
  professional?: Professional;
  tipjar_settings: UnmentionData;
}

export enum UserDisplayTypeEnum {
  User = 'User',
}

export interface AffiliatesHighlightedLabel {
  label?: Label;
}

export interface Label {
  url: LandingURLClass;
  badge: Badge;
  description: string;
  userLabelType: string;
  userLabelDisplayType: string;
}

export interface Badge {
  url: string;
}

export interface PurpleLegacy {
  can_dm: boolean;
  can_media_tag: boolean;
  created_at: string;
  default_profile: boolean;
  default_profile_image: boolean;
  description: string;
  entities: Entities;
  fast_followers_count: number;
  favourites_count: number;
  followers_count: number;
  friends_count: number;
  has_custom_timelines: boolean;
  is_translator: boolean;
  listed_count: number;
  location: string;
  media_count: number;
  name: string;
  normal_followers_count: number;
  pinned_tweet_ids_str: string[];
  possibly_sensitive: boolean;
  profile_banner_url: string;
  profile_image_url_https: string;
  profile_interstitial_type: string;
  screen_name: string;
  statuses_count: number;
  translator_type: TranslatorType;
  url?: string;
  verified: boolean;
  want_retweets: boolean;
  withheld_in_countries: any[];
  verified_type?: string;
}

export interface Entities {
  description: Description;
  url?: Description;
}

export interface Description {
  urls: URLElement[];
}

export interface URLElement {
  display_url: string;
  expanded_url: string;
  url: string;
  indices: number[];
}

export enum TranslatorType {
  None = 'none',
  Regular = 'regular',
}

export interface Professional {
  rest_id: string;
  professional_type: ProfessionalType;
  category: Category[];
}

export interface Category {
  id: number;
  name: Name;
  icon_name: string;
}

export enum Name {
  ContentCreator = 'Content Creator',
  EntertainmentRecreation = 'Entertainment & Recreation',
  FoodBeverageCompany = 'Food & Beverage Company',
  MediaNewsCompany = 'Media & News Company',
  MediaPersonality = 'Media Personality',
}

export enum ProfessionalType {
  Business = 'Business',
  Creator = 'Creator',
}

export enum ProfileImageShape {
  Circle = 'Circle',
  Square = 'Square',
}

export interface UnmentionData {}

export interface ClickTrackingInfo {
  urlParams: ExperimentValue[];
}

export interface ExperimentValue {
  key: string;
  value: string;
}

export enum TweetDisplayType {
  Tweet = 'Tweet',
  TweetWithVisibilityResults = 'TweetWithVisibilityResults',
}

export interface PurpleTweetResults {
  result: PurpleResult;
}

export interface PurpleResult {
  __typename: TweetDisplayType;
  rest_id?: string;
  core?: PurpleCore;
  unmention_data?: UnmentionData;
  edit_control?: EditControl;
  is_translatable?: boolean;
  views?: Views;
  source?: string;
  legacy?: TentacledLegacy;
  quick_promote_eligibility?: QuickPromoteEligibility;
  tweet?: Tweet;
  limitedActionResults?: LimitedActionResults;
  card?: TweetCard;
}

export interface TweetCard {
  rest_id: string;
  legacy: FluffyLegacy;
}

export interface FluffyLegacy {
  binding_values: PurpleBindingValue[];
  card_platform: CardPlatform;
  name: string;
  url: string;
  user_refs_results: any[];
}

export interface PurpleBindingValue {
  key: string;
  value: PurpleValue;
}

export interface PurpleValue {
  string_value: string;
  type: ValueType;
  scribe_key?: string;
}

export enum ValueType {
  Image = 'IMAGE',
  ImageColor = 'IMAGE_COLOR',
  String = 'STRING',
  User = 'USER',
}

export interface CardPlatform {
  platform: Platform;
}

export interface Platform {
  audience: Audience;
  device: Device;
}

export interface Audience {
  name: string;
}

export interface Device {
  name: string;
  version: string;
}

export interface PurpleCore {
  user_results: ItemContentUserResults;
}

export interface ItemContentUserResults {
  result: FluffyResult;
}

export interface FluffyResult {
  __typename: UserDisplayTypeEnum;
  id: string;
  rest_id: string;
  affiliates_highlighted_label: AffiliatesHighlightedLabel;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: ProfileImageShape;
  legacy: PurpleLegacy;
  professional?: Professional;
  tipjar_settings: TipjarSettings;
  super_follow_eligible?: boolean;
}

export interface TipjarSettings {
  is_enabled?: boolean;
}

export interface EditControl {
  edit_tweet_ids: string[];
  editable_until_msecs: string;
  is_edit_eligible: boolean;
  edits_remaining: string;
}

export interface TentacledLegacy {
  bookmark_count: number;
  bookmarked: boolean;
  created_at: string;
  conversation_id_str: string;
  display_text_range: number[];
  entities: Entit;
  extended_entities?: ExtendedEntities;
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  is_quote_status: boolean;
  lang: Lang;
  possibly_sensitive?: boolean;
  possibly_sensitive_editable?: boolean;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  user_id_str: string;
  id_str: string;
  scopes?: Scopes;
}

export interface Entit {
  hashtags: any[];
  media?: Media[];
  symbols: any[];
  timestamps?: any[];
  urls: URLElement[];
  user_mentions: UserMention[];
}

export interface Media {
  display_url: string;
  expanded_url: string;
  id_str: string;
  indices: number[];
  media_key: string;
  media_url_https: string;
  type: MediaType;
  url: string;
  ext_media_availability: EXTMediaAvailability;
  features?: Features;
  sizes: Sizes;
  original_info: OriginalInfo;
  allow_download_status?: AllowDownloadStatus;
  media_results: MediaResults;
  additional_media_info?: AdditionalMediaInfo;
  video_info?: VideoInfo;
}

export interface AdditionalMediaInfo {
  monetizable: boolean;
  title?: string;
  description?: string;
  embeddable?: boolean;
}

export interface AllowDownloadStatus {
  allow_download: boolean;
}

export interface EXTMediaAvailability {
  status: Status;
}

export enum Status {
  Available = 'Available',
}

export interface Features {
  large: OrigClass;
  medium: OrigClass;
  small: OrigClass;
  orig: OrigClass;
}

export interface OrigClass {
  faces: FocusRect[];
}

export interface FocusRect {
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface MediaResults {
  result: MediaResultsResult;
}

export interface MediaResultsResult {
  media_key: string;
}

export interface OriginalInfo {
  height: number;
  width: number;
  focus_rects: FocusRect[];
}

export interface Sizes {
  large: ThumbClass;
  medium: ThumbClass;
  small: ThumbClass;
  thumb: ThumbClass;
}

export interface ThumbClass {
  h: number;
  w: number;
  resize: Resize;
}

export enum Resize {
  Crop = 'crop',
  Fit = 'fit',
}

export enum MediaType {
  Photo = 'photo',
  Video = 'video',
}

export interface VideoInfo {
  aspect_ratio: number[];
  duration_millis: number;
  variants: Variant[];
}

export interface Variant {
  content_type: ContentType;
  url: string;
  bitrate?: number;
}

export enum ContentType {
  ApplicationXMPEGURL = 'application/x-mpegURL',
  VideoMp4 = 'video/mp4',
}

export interface UserMention {
  id_str: string;
  name: string;
  screen_name: string;
  indices: number[];
}

export interface ExtendedEntities {
  media: Media[];
}

export enum Lang {
  En = 'en',
  Qme = 'qme',
}

export interface Scopes {
  followers: boolean;
}

export interface LimitedActionResults {
  limited_actions: LimitedAction[];
}

export interface LimitedAction {
  action: string;
  prompt: Prompt;
}

export interface Prompt {
  __typename: string;
  cta_type: string;
  headline: Headline;
  subtext: Headline;
}

export interface Headline {
  text: string;
  entities: any[];
}

export interface QuickPromoteEligibility {
  eligibility: Eligibility;
}

export enum Eligibility {
  IneligibleNotProfessional = 'IneligibleNotProfessional',
}

export interface Tweet {
  rest_id: string;
  core: TweetCore;
  card: TweetCard;
  unmention_data: UnmentionData;
  edit_control: EditControl;
  is_translatable: boolean;
  views: Views;
  source: string;
  legacy: TweetLegacy;
  quick_promote_eligibility: QuickPromoteEligibility;
}

export interface TweetCore {
  user_results: SerResults;
}

export interface TweetLegacy {
  bookmark_count: number;
  bookmarked: boolean;
  created_at: string;
  conversation_control?: ConversationControl;
  conversation_id_str: string;
  display_text_range: number[];
  entities: Entit;
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  is_quote_status: boolean;
  lang: Lang;
  limited_actions?: string;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  scopes?: Scopes;
  user_id_str: string;
  id_str: string;
}

export interface ConversationControl {
  policy: string;
  conversation_owner_results: ConversationOwnerResults;
}

export interface ConversationOwnerResults {
  result: ConversationOwnerResultsResult;
}

export interface ConversationOwnerResultsResult {
  __typename: UserDisplayTypeEnum;
  legacy: StickyLegacy;
}

export interface StickyLegacy {
  screen_name: string;
}

export interface Views {
  count: string;
  state: State;
}

export enum State {
  EnabledWithCount = 'EnabledWithCount',
}

export interface ItemElement {
  entryId: string;
  dispensable?: boolean;
  item: ItemItem;
}

export interface ItemItem {
  itemContent: ItemItemContent;
  clientEventInfo: ItemClientEventInfo;
}

export interface ItemItemContent {
  itemType: ItemTypeEnum;
  __typename: ItemTypeEnum;
  tweet_results?: FluffyTweetResults;
  tweetDisplayType?: TweetDisplayType;
  user_results?: ItemContentUserResults;
  userDisplayType?: UserDisplayTypeEnum;
}

export interface FluffyTweetResults {
  result: TentacledResult;
}

export interface TentacledResult {
  __typename: TweetDisplayType;
  rest_id: string;
  core: FluffyCore;
  unmention_data: UnmentionData;
  edit_control: EditControl;
  is_translatable: boolean;
  views: Views;
  source: string;
  legacy: IndecentLegacy;
  quick_promote_eligibility: QuickPromoteEligibility;
  card?: PurpleCard;
}

export interface PurpleCard {
  rest_id: string;
  legacy: IndigoLegacy;
}

export interface IndigoLegacy {
  binding_values: FluffyBindingValue[];
  card_platform: CardPlatform;
  name: string;
  url: string;
  user_refs_results: UserRefsResult[];
}

export interface FluffyBindingValue {
  key: string;
  value: FluffyValue;
}

export interface FluffyValue {
  string_value?: string;
  type: ValueType;
  image_value?: ImageValue;
  scribe_key?: string;
  user_value?: UserValue;
  image_color_value?: ImageColorValue;
}

export interface ImageColorValue {
  palette: Palette[];
}

export interface Palette {
  rgb: RGB;
  percentage: number;
}

export interface RGB {
  blue: number;
  green: number;
  red: number;
}

export interface ImageValue {
  height: number;
  width: number;
  url: string;
}

export interface UserValue {
  id_str: string;
  path: any[];
}

export interface UserRefsResult {
  result: UserRefsResultResult;
}

export interface UserRefsResultResult {
  __typename: UserDisplayTypeEnum;
  id: string;
  rest_id: string;
  affiliates_highlighted_label: UnmentionData;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: ProfileImageShape;
  legacy: PurpleLegacy;
  tipjar_settings: UnmentionData;
}

export interface FluffyCore {
  user_results: PurpleUserResults;
}

export interface PurpleUserResults {
  result: StickyResult;
}

export interface StickyResult {
  __typename: UserDisplayTypeEnum;
  id: string;
  rest_id: string;
  affiliates_highlighted_label: UnmentionData;
  has_graduated_access: boolean;
  is_blue_verified: boolean;
  profile_image_shape: ProfileImageShape;
  legacy: PurpleLegacy;
  professional: Professional;
  tipjar_settings: TipjarSettings;
  super_follow_eligible: boolean;
}

export interface IndecentLegacy {
  bookmark_count: number;
  bookmarked: boolean;
  created_at: string;
  conversation_id_str: string;
  display_text_range: number[];
  entities: Entit;
  favorite_count: number;
  favorited: boolean;
  full_text: string;
  is_quote_status: boolean;
  lang: Lang;
  quote_count: number;
  reply_count: number;
  retweet_count: number;
  retweeted: boolean;
  user_id_str: string;
  id_str: string;
  in_reply_to_screen_name?: string;
  in_reply_to_status_id_str?: string;
  in_reply_to_user_id_str?: string;
  extended_entities?: ExtendedEntities;
  possibly_sensitive?: boolean;
  possibly_sensitive_editable?: boolean;
}

export interface ContentMetadata {
  conversationMetadata: ConversationMetadata;
}

export interface ConversationMetadata {
  allTweetIds: string[];
  enableDeduplication: boolean;
}

export interface PurpleEntry {
  entryId: string;
  sortIndex: string;
  content: FluffyContent;
}

export interface FluffyContent {
  entryType: EntryTypeEnum;
  __typename: EntryTypeEnum;
  itemContent: FluffyItemContent;
  clientEventInfo: PurpleClientEventInfo;
}

export interface PurpleClientEventInfo {
  component: string;
  element: Ent;
}

export interface FluffyItemContent {
  itemType: ItemTypeEnum;
  __typename: ItemTypeEnum;
  tweet_results: TentacledTweetResults;
  tweetDisplayType: TweetDisplayType;
  socialContext: SocialContext;
}

export interface SocialContext {
  type: string;
  contextType: string;
  text: string;
}

export interface TentacledTweetResults {
  result: IndigoResult;
}

export interface IndigoResult {
  __typename: TweetDisplayType;
  rest_id: string;
  core: FluffyCore;
  unmention_data: UnmentionData;
  edit_control: EditControl;
  is_translatable: boolean;
  views: Views;
  source: string;
  note_tweet: NoteTweet;
  legacy: TweetLegacy;
  quick_promote_eligibility: QuickPromoteEligibility;
}

export interface NoteTweet {
  is_expandable: boolean;
  note_tweet_results: NoteTweetResults;
}

export interface NoteTweetResults {
  result: NoteTweetResultsResult;
}

export interface NoteTweetResultsResult {
  id: string;
  text: string;
  entity_set: Entit;
}

export interface TimelineMetadata {
  scribeConfig: ScribeConfig;
}

export interface ScribeConfig {
  page: string;
}

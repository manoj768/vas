export type CaseStatus = "Open" | "Pending" | "Completed";

export type BranchLocation = string;

export interface BranchInfo {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager: string;
  status: "Active" | "Inactive";
  createdAt: string;
}

export type UserRole = "admin" | "engineer" | "drafter" | "reviewer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branch: BranchLocation;
}

export type SyncStatus = "synced" | "pending_sync" | "offline_draft" | "syncing" | "error";

export interface OnboardedInstitution {
  id: string;
  name: string;
  code: string;
  category: string;
  contactEmail?: string;
  contactPhone?: string;
  defaultLTV?: string;
  status: "Active" | "Inactive";
  metaDocument?: {
    filename: string;
    originalName: string;
    fileType: "docx" | "xlsx" | "pdf" | string;
    sizeBytes: number;
    uploadedAt: string;
    url: string;
  } | null;
  createdAt: string;
}

export interface PendingSyncAction {
  id: string;
  actionType: "UPDATE_CASE" | "CREATE_CASE" | "FINISH_SURVEY" | "SAVE_DRAFT";
  caseId: string;
  payload: any;
  timestamp: number;
  retryCount: number;
}

// ============================================================================
// 10-SECTION DRR ASSOCIATES & CONSULTANT SITE VISIT FORMAT DATA TYPES
// ============================================================================

export interface GeneralInfo {
  company: string; // Default: "DRR ASSOCIATES AND CONSULTANT"
  engineerName: string;
  clientName: string;
  bankName: string;
  visitDate: string;
}

export interface PropertyIdentification {
  propertyAddress: string;
  addressMatch: "YES" | "NO" | "";
  personMetAndId: string;
  relationWithClient: string;
  mobileNumber: string;
  identificationMethod: "Contact Person" | "Address" | "Number Plate" | "Neighbour Enquiry" | "";
  latitude?: string;
  longitude?: string;
  capturedMapImage?: string;
}

export interface LegalStatusLocality {
  ownership: "FREEHOLD" | "LEASEHOLD" | "";
  colonyStatus: "REGULARIZED" | "UNAUTHORIZED" | "AUTHORITY" | "LAL DORA" | "APPROVED" | "GRAM PANCHAYAT" | "";
  localityType: "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "AGRICULTURE" | "";
  location: "INTERMITTENT" | "CORNER" | "MAIN ROAD" | "INNER ROAD" | "PARK FACING" | "GALI" | "DEAD END" | "";
}

export interface BuildingSpecifications {
  propertyType: string;
  roofType: string;
  plotAreaSqYd: string;
  plotFrontFt: string;
  plotDepthFt: string;
  plotShape: "REGULAR" | "IRREGULAR" | "";
  numberOfFloors: string;
  entirePropertyShown: "YES" | "NO" | "";
  stiltFloorHeightFt: string;
  floorHeightFt: string;
  floorApproachIndependent: "YES" | "NO" | "";
  unitsOnEachFloor: string;
  unitsInBuilding: string;
  propertyAge: string;
  electricalFitting: "Open" | "Concealed" | "";
  flooring: "Marble" | "Tile" | "PCC" | "Katcha" | "";
  landmark: string;
  demarcation: "proper demarcated" | "temporary demarcated" | "Not demarcated" | "demarcated by fencing" | "";
}

export interface TenantDetail {
  id: string;
  tenantName: string;
  occupiedSince: string;
  purposeOfUse: string;
  rentedArea: string;
  rentPayable: string;
}

export interface OccupancyUsage {
  occupationStatus: "OWNER" | "RENTED" | "APPLICANT" | "SELLER" | "VACANT" | "LEASE" | "UNDER CONSTRUCTION" | "Renovation" | "";
  ownerAtSite: "YES" | "NO" | "";
  buildingOccupancy: string;
  usage: "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "INSTITUTIONAL" | "VACANT" | "";
  numberOfTenants: string;
  tenants: TenantDetail[];
}

export interface AmenitiesUtilities {
  lift: "YES" | "NO" | "WORKING" | "Not Working" | "(Under construction)" | "";
  meterInstalled: "YES" | "NO" | "";
  billProvided: "YES" | "NO" | "";
  meterNumber: string;
  meterMatchesBill: "YES" | "NO" | "";
  sewerConnection: "YES" | "NO" | "";
}

export interface NeighborhoodSurroundings {
  roadWidthFt: string;
  roadType: "CONCRETE" | "BITUMEN" | "INTERLOCKING TILES" | "KACHA" | "BRICK" | "";
  occupancyInLocalityPct: string;
  developmentInLocalityPct: string;
  dominantCommunityName: string;
  dominantCommunityPct: string;
  negativeRemarks: string[];
  negativeRemarksNotes: string;
}

export interface FloorAccommodationRow {
  floorLevel: "Basement" | "Stilt Floor" | "Ground Floor" | "1st Floor" | "2nd Floor" | "3rd Floor" | "4th Floor";
  accommodation: string;
  carpetOpenBUA: string;
  occupiedBy: string;
  usage: string;
  structure: string;
}

export interface DealerInquiry {
  id: string;
  dealerName: string;
  mobileNo: string;
  landOrShopRate: string;
  oldFlatRate: string;
  newFlatRate: string;
  disputeInfo: string;
}

export interface CategorizedMedia {
  roadPhotos: string[];
  outsideNameplatePhotos: string[];
  selfiePhotos: string[];
  internalPhotos: string[];
  generalPhotos: string[];
}

export interface DocumentationMarketData {
  internalPicsTaken: "YES" | "NO" | "";
  roadPhotoTaken: boolean;
  outsideNameplateTaken: boolean;
  selfieTaken: boolean;
  dealerInquiries: DealerInquiry[];
  categorizedMedia: CategorizedMedia;
}

export interface FinalRemarksSubmissions {
  remarksWithDeviation: string;
  measurementNotes: string;
  floorFlatLayoutNotes: string;
  elevationPlanNotes: string;
  routeMapNotes: string;
  enggSignatureName: string;
  submittedAt?: string;
  overallStatus: "Positive" | "Negative" | "Cannot decide";
  rating?: string;
}

export interface FullSiteVisitFormat {
  generalInfo: GeneralInfo;
  propertyIdentification: PropertyIdentification;
  legalStatusLocality: LegalStatusLocality;
  buildingSpecifications: BuildingSpecifications;
  occupancyUsage: OccupancyUsage;
  amenitiesUtilities: AmenitiesUtilities;
  neighborhoodSurroundings: NeighborhoodSurroundings;
  floorAccommodationRows: FloorAccommodationRow[];
  documentationMarketData: DocumentationMarketData;
  finalRemarksSubmissions: FinalRemarksSubmissions;
}

// Legacy compatible interfaces
export interface LocalityData {
  roadApproachCondition: string;
  connections: string;
  propertyElectricity: string;
  ownershipType: string;
  roadWidthFt: string;
  lift: string;
  developmentType: string;
  fallingWithin: string;
  closestLandmark: string;
  propertyNumbering: string;
  surroundingOccupancy: string;
  localityStatus: string;
}

export interface ObservationData {
  communityDominated: string;
  communityPercentage: string;
  unitsOnFloor: string;
  totalUnitsInBuilding: string;
  sellerNameAtSite: string;
  buildingOccupancy: string;
  structureType: string;
  contactMetName: string;
  contactMetPhone: string;
  contactMetRelation: string;
  electricityMeterNo: string;
  electricityBillMeterNo: string;
  addressMatchesTitleDocs: string;
  presentlyOccupiedBy: string;
  negativeRemarks: string;
  plotDemarcated: string;
  disputeObserved: string;
  internalVisitDone: string;
  previouslyValuatedForOtherBanks: string;
  sewerageDrainage: string;
  yearOfConstruction: string;
  ageOfBuilding: string;
  totalFloors: string;
  landShape: string;
}

export interface BoundaryDetail {
  direction: string;
  measurement: string;
  details: string;
}

export interface IdentityData {
  boundaries: {
    front: BoundaryDetail;
    left: BoundaryDetail;
    right: BoundaryDetail;
    rear: BoundaryDetail;
  };
  photos: {
    front: string | null;
    left: string | null;
    right: string | null;
    rear: string | null;
  };
}

export interface ValuationData {
  valuationType: string;
  buildingDepth: string;
  buildingFrontWidth: string;
  landAreaSqFt: string;
  landRatePerSqFt: string;
  buaSqFt: string;
  constructionRatePerSqFt: string;
  sbuaSqFt: string;
  flatRatePerSqFt: string;
  fairMarketValue: number;
  realizableValue: number;
  distressValue: number;
}

export interface MediaAttachments {
  selfie: string | null;
  elevation: string | null;
  road: string | null;
  dataSheet: string | null;
  photosVideos: string[];
  voiceNotes: string[];
  docs: string[];
}

export interface GeoData {
  addressAsPerSiteVisit: string;
  latitude: string;
  longitude: string;
}

export interface FinalSubmission {
  statusAsPerSiteVisit: "Positive" | "Negative" | "Cannot decide";
  remarks: string;
  rating: "Did not Like" | "Its OK" | "Good" | "Like it" | "Very Nice";
  submittedAt: string;
}

export interface SurveyDraft {
  caseId: string;
  currentStep: number;
  activeTab?: string;
  lastUpdated: number;
  localityData: LocalityData;
  observationData: ObservationData;
  identityData: IdentityData;
  valuationData: ValuationData;
  mediaAttachments: MediaAttachments;
  geoData: GeoData;
  finalSubmission: FinalSubmission | null;
  syncStatus: SyncStatus;
  siteVisitFormat?: FullSiteVisitFormat;
}

export interface ValuationCase {
  id: string;
  institution: string;
  customerName: string;
  loanType: string;
  date: string;
  phone: string;
  address: string;
  remarks: string;
  status: CaseStatus;
  branch?: BranchLocation;
  assignedEngineer?: string;
  completedSiteVisit: boolean | null;
  propertyType: string;
  localityData: LocalityData;
  observationData: ObservationData;
  identityData: IdentityData;
  valuationData: ValuationData;
  mediaAttachments: MediaAttachments;
  geoData: GeoData;
  finalSubmission: FinalSubmission | null;
  siteVisitFormat?: FullSiteVisitFormat;
}

export interface AIRiskReport {
  riskScore: number;
  riskCategory: string;
  valuationConfidence: string;
  keyRiskFactors: string[];
  positiveFactors: string[];
  executiveSummary: string;
  recommendedLTV: string;
}


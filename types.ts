
export type AppState = 'keyGate' | 'hero' | 'groupSelect' | 'camera' | 'styleSelect' | 'magic' | 'result' | 'certificate' | 'error';
export type Language = 'FI' | 'EN';
export type ElfStyle = 'classic' | 'frost' | 'forest' | 'royal';
export type GroupType = 'single' | 'group';
export type UpscaleLevel = '1K' | '2K' | '4K';

export interface Translation {
  title: string;
  subtitle: string;
  buttonBegin: string;
  smileText: string;
  footerText: string;
  capturing: string;
  processing: string;
  processingSub: string;
  resultTitle: string;
  backHome: string;
  errorTitle: string;
  errorAction: string;
  // Group selection
  groupSelectTitle: string;
  groupSelectSingle: string;
  groupSelectSingleDesc: string;
  groupSelectGroup: string;
  groupSelectGroupDesc: string;
  // Style selection
  selectStyleTitle: string;
  styleClassic: string;
  styleFrost: string;
  styleForest: string;
  styleRoyal: string;
  btnStartMagic: string;
  // Upscaling
  btnUpscale: string;
  upscaleLevelLabel: string;
  upscalingText: string;
  upscaleSuccess: string;
  // Certificate additions
  btnCreateCert: string;
  btnDownloadImage: string;
  inputNamePlaceholder: string;
  inputGroupNamePlaceholder: string;
  certTitle: string;
  certProof: string;
  certOfficial: string;
  certExperience: string;
  certPlaceDate: string;
  certMagicCert: string;
  btnPrint: string;
  // Key Gate additions
  keyGateTitle: string;
  keyGateDesc: string;
  keyGateButton: string;
  keyGateBillingLink: string;
}

export interface Dictionary {
  FI: Translation;
  EN: Translation;
}

/**
 * Zod validation message keys.
 *
 * Because Zod schemas are defined at module level (outside React components),
 * they cannot call hooks like useTranslations(). Instead, we store i18n keys
 * as the Zod error messages and resolve them in the UI layer via the
 * <TranslatedFieldError> component or the FieldError helper.
 *
 * Convention: every value starts with "validation." so the UI can detect
 * whether a message is a raw string or an i18n key.
 */
export const V = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  required: "validation.required",
  emailRequired: "validation.emailRequired",
  emailInvalid: "validation.emailInvalid",
  passwordRequired: "validation.passwordRequired",
  passwordMinLength: "validation.passwordMinLength",
  passwordUppercase: "validation.passwordUppercase",
  passwordDigit: "validation.passwordDigit",
  confirmRequired: "validation.confirmRequired",
  passwordsMismatch: "validation.passwordsMismatch",
  nameMinLength: "validation.nameMinLength",
  nameTooLong: "validation.nameTooLong",

  // ── Brand DNA ─────────────────────────────────────────────────────────────
  brandNameRequired: "validation.brandNameRequired",
  sectorRequired: "validation.sectorRequired",
  positioningMinLength: "validation.positioningMinLength",
  colorPrimaryRequired: "validation.colorPrimaryRequired",
  colorSecondaryRequired: "validation.colorSecondaryRequired",
  colorAccentRequired: "validation.colorAccentRequired",
  voiceToneRequired: "validation.voiceToneRequired",
  audienceMinLength: "validation.audienceMinLength",

  // ── Visual / Brief ────────────────────────────────────────────────────────
  briefMinLength: "validation.briefMinLength",
  briefMaxLength: "validation.briefMaxLength",
  promptMinLength: "validation.promptMinLength",
  promptMaxLength: "validation.promptMaxLength",

  // ── Workflow ──────────────────────────────────────────────────────────────
  titleRequired: "validation.titleRequired",
  descriptionRequired: "validation.descriptionRequired",
  platformRequired: "validation.platformRequired",

  // ── Document ──────────────────────────────────────────────────────────────
  docTitleMinLength: "validation.docTitleMinLength",
  docTitleMaxLength: "validation.docTitleMaxLength",
  docTypeInvalid: "validation.docTypeInvalid",
  docClientNameMaxLength: "validation.docClientNameMaxLength",
  docBriefMaxLength: "validation.docBriefMaxLength",

  // ── Lead ──────────────────────────────────────────────────────────────────
  companyNameRequired: "validation.companyNameRequired",
  contactNameRequired: "validation.contactNameRequired",
  emailInvalidShort: "validation.emailInvalidShort",
  linkedinUrlInvalid: "validation.linkedinUrlInvalid",
  activityContentRequired: "validation.activityContentRequired",

  // ── Storage ───────────────────────────────────────────────────────────────
  filenameRequired: "validation.filenameRequired",
  filenameTooLong: "validation.filenameTooLong",
  filenameInvalidChars: "validation.filenameInvalidChars",
  mimeTypeNotAllowed: "validation.mimeTypeNotAllowed",
  fileSizeInvalid: "validation.fileSizeInvalid",
  fileTooLarge: "validation.fileTooLarge",
  assetIdInvalid: "validation.assetIdInvalid",

  // ── Transcription ─────────────────────────────────────────────────────────
  transcriptionTitleRequired: "validation.transcriptionTitleRequired",
  transcriptionMimeInvalid: "validation.transcriptionMimeInvalid",
  transcriptionFileTooLarge: "validation.transcriptionFileTooLarge",

  // ── Video ─────────────────────────────────────────────────────────────────
  videoPromptMinLength: "validation.videoPromptMinLength",
  videoPromptMaxLength: "validation.videoPromptMaxLength",

  // ── Scheduler (posts) ───────────────────────────────────────────────────
  contentRequired: "validation.contentRequired",
  contentTooLong: "validation.contentTooLong",

  // ── Onboarding (tenant) ─────────────────────────────────────────────────
  tenantNameMinLength: "validation.tenantNameMinLength",
  tenantNameMaxLength: "validation.tenantNameMaxLength",
  slugMinLength: "validation.slugMinLength",
  slugMaxLength: "validation.slugMaxLength",
  slugInvalidChars: "validation.slugInvalidChars",

  // ── Admin prompts ───────────────────────────────────────────────────────
  fieldKeyRequired: "validation.fieldKeyRequired",
  fieldKeyInvalidChars: "validation.fieldKeyInvalidChars",
  systemPromptMinLength: "validation.systemPromptMinLength",
  providerRequired: "validation.providerRequired",
  modelRequired: "validation.modelRequired",
} as const

import * as yup from 'yup'

// Email settings schema
export const emailSettingsSchema = yup.object({
  smtpServer: yup.string().required('SMTP server is required'),
  port: yup
    .number()
    .typeError('Port must be a number')
    .required('Port is required')
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must be less than 65535'),
  service: yup.string().required('Service is required'),
  username: yup.string().email('Must be a valid email').required('Username is required'),
  password: yup.string().required('Password is required'),
  useTLS: yup.boolean().default(true),
  description: yup.string(),
})

// Razorpay settings schema
export const razorpaySettingsSchema = yup.object({
  keyId: yup.string().required('Key ID is required'),
  keySecret: yup.string().required('Key Secret is required'),
  webhookSecret: yup.string().required('Webhook Secret is required'),
  description: yup.string(),
})

// WhatsApp settings schema
export const whatsappSettingsSchema = yup.object({
  phoneNumberId: yup.string().required('Phone Number ID is required'),
  businessAccountId: yup.string().required('Business Account ID is required'),
  accessToken: yup.string().required('Access Token is required'),
  webhookSecret: yup.string().required('Webhook Secret is required'),
  phoneNumber: yup.string().required('Phone Number is required'),
  description: yup.string(),
})

// Google Meet settings schema
export const googleMeetSettingsSchema = yup.object({
  meetingLink: yup.string().url('Must be a valid URL').required('Meeting link is required'),
  meetingId: yup.string().required('Meeting ID is required'),
  meetingName: yup.string().required('Meeting name is required'),
  description: yup.string(),
  defaultDuration: yup
    .number()
    .typeError('Duration must be a number')
    .min(15, 'Minimum duration is 15 minutes')
    .max(480, 'Maximum duration is 8 hours')
    .default(60),
  workingDaysRule: yup
    .string()
    .matches(/^RRULE:/, 'Must be a valid RRULE string starting with "RRULE:"')
    .default('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'),
  holidays: yup.string(),
  workingHoursStart: yup
    .string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format (24-hour)')
    .default('09:00'),
  workingHoursEnd: yup
    .string()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be in HH:MM format (24-hour)')
    .default('17:00'),
  scheduleTimezone: yup.string().default('America/New_York'),
})

// General settings schema
export const generalSettingsSchema = yup.object({
  siteName: yup.string().required('Site name is required'),
  siteDescription: yup.string().required('Site description is required'),
  contactEmail: yup.string().email('Must be a valid email').required('Contact email is required'),
})

// List of Values schema
export const lovSchema = yup.object({
  category: yup.string().required('Category is required'),
  code: yup.string().required('Code is required'),
  description: yup.string().required('Description is required'),
  isActive: yup.boolean().default(true),
})

// Upload path schema
export const uploadPathSchema = yup.object({
  moduleName: yup
    .string()
    .required('Module name is required')
    .oneOf(
      [
        'COURSE_SYLLABUS',
        'USER_DOCUMENTS',
        'COURSE_MATERIALS',
        'ASSESSMENT_FILES',
        'CERTIFICATES',
        'SERVICE_FILES',
        'HRMS_FILES',
      ],
      'Invalid module selection'
    ),
  path: yup.string().required('Upload path is required'),
  description: yup.string(),
})

// Branch schema (from BranchManagement)
export const branchSchema = yup.object({
  code: yup.string().required('Branch code is required'),
  name: yup.string().required('Branch name is required'),
  address: yup.string().required('Address is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  description: yup.string(),
})

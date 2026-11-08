// src/modules/Employees/EmployeeModal.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import {
  X, Save, User, Briefcase, Award, ChevronRight,
  Upload as UploadIcon, Trash2, Image as ImageIcon, PenTool, RefreshCw,
  Eye,
} from 'lucide-react';
import { hrAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import * as yup from 'yup';

const DepartmentSelectionModal = lazy(() => import('../Departments/DepartmentSelectionModal'));
const PositionSelectionModal = lazy(() => import('../Recruitment/Positions/PositionSelectionModal'));
const EmployeeSelectionModal = lazy(() => import('./EmployeeSelectionModal'));
const WorkLocationSelectionModal = lazy(() => import('../Attendance/Work_locations/WorkLocationSelectionModal'));

/* ──────────────────────────────────────────────────────────────────
   SIGNATURE IMAGE SCANNER
────────────────────────────────────────────────────────────────── */
const scanSignatureImage = (file, options = {}) => {
  const { maxDimension = 1600, thresholdBias = 10, paddingPercent = 0.05 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const { data } = imageData;
        const pixelCount = width * height;

        const gray = new Uint8Array(pixelCount);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          gray[j] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
        }

        const histogram = new Array(256).fill(0);
        for (let i = 0; i < pixelCount; i++) histogram[gray[i]]++;
        let total = pixelCount;
        let sum = 0;
        for (let t = 0; t < 256; t++) sum += t * histogram[t];
        let sumB = 0, wB = 0, wF = 0, maxVar = 0, threshold = 127;
        for (let t = 0; t < 256; t++) {
          wB += histogram[t];
          if (wB === 0) continue;
          wF = total - wB;
          if (wF === 0) break;
          sumB += t * histogram[t];
          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const variance = wB * wF * (mB - mF) * (mB - mF);
          if (variance > maxVar) { maxVar = variance; threshold = t; }
        }

        const effectiveThreshold = Math.min(255, threshold + thresholdBias);

        let darkCount = 0;
        const binarized = new Uint8Array(pixelCount);
        for (let i = 0; i < pixelCount; i++) {
          const isDark = gray[i] < effectiveThreshold;
          if (isDark) darkCount++;
          binarized[i] = isDark ? 0 : 255;
        }

        if (darkCount > pixelCount * 0.5) {
          for (let i = 0; i < pixelCount; i++) binarized[i] = 255 - binarized[i];
        }

        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const v = binarized[j];
          data[i] = data[i + 1] = data[i + 2] = v;
          data[i + 3] = 255;
        }

        let minX = width, minY = height, maxX = -1, maxY = -1;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (binarized[y * width + x] === 0) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX < minX || maxY < minY) {
          const emptyCanvas = document.createElement('canvas');
          emptyCanvas.width = width;
          emptyCanvas.height = height;
          emptyCanvas.getContext('2d').putImageData(imageData, 0, 0);
          emptyCanvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Blob failed')), 'image/png');
          return;
        }

        const padX = Math.max(2, Math.round((maxX - minX) * paddingPercent));
        const padY = Math.max(2, Math.round((maxY - minY) * paddingPercent));
        const cropX = Math.max(0, minX - padX);
        const cropY = Math.max(0, minY - padY);
        const cropW = Math.min(width - cropX, (maxX - minX + 1) + padX * 2);
        const cropH = Math.min(height - cropY, (maxY - minY + 1) + padY * 2);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        tempCanvas.getContext('2d').putImageData(imageData, 0, 0);

        const outCanvas = document.createElement('canvas');
        outCanvas.width = cropW;
        outCanvas.height = cropH;
        const outCtx = outCanvas.getContext('2d');
        outCtx.fillStyle = '#ffffff';
        outCtx.fillRect(0, 0, cropW, cropH);
        outCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        outCanvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Blob failed')), 'image/png');
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
};

/* ──────────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────────── */
const computeAge = (dob) => {
  if (!dob) return '';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : '';
};

const computeDobFromAge = (age, currentDob = '') => {
  const n = Number(age);
  if (!age && age !== 0) return '';
  if (isNaN(n) || n < 0 || n > 150) return '';
  const today = new Date();
  let month = 1, day = 1;
  if (currentDob) {
    const d = new Date(currentDob);
    if (!isNaN(d.getTime())) { month = d.getMonth() + 1; day = d.getDate(); }
  }
  const year = today.getFullYear() - n;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const buildDisplayName = ({ title, first_name, middle_name, last_name }) => {
  const name = [first_name, middle_name, last_name].filter(Boolean).map(s => String(s).trim()).join(' ');
  if (!name) return '';
  return title ? `${title} ${name}`.trim() : name;
};

const TITLE_OPTIONS = ['', 'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'];

const titleToGender = (title) => {
  switch (title) {
    case 'Mr.': return 'male';
    case 'Ms.': return 'female';
    case 'Mrs.': return 'female';
    default: return null;
  }
};

const genderToTitle = (gender) => {
  if (gender === 'male') return 'Mr.';
  if (gender === 'female') return 'Ms.';
  return null;
};

const employeeSchema = yup.object().shape({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  hire_date: yup.string().required('Hire date is required'),
  title: yup.string().nullable(),
  display_name: yup.string().nullable().max(150, 'Display name too long'),
  age: yup.number().nullable().typeError('Age must be a number').min(0).max(150, 'Invalid age'),
  middle_name: yup.string().nullable(),
  personal_email: yup.string().email('Invalid personal email').nullable(),
  phone: yup.string().nullable(),
  mobile: yup.string().nullable(),
  date_of_birth: yup.string().nullable(),
  gender: yup.string().nullable(),
  marital_status: yup.string().nullable(),
  nationality: yup.string().nullable(),
  passport_number: yup.string().nullable(),
  social_security_number: yup.string().nullable(),
  dept_id: yup.string().nullable(),
  position_id: yup.string().nullable(),
  dept_head_id: yup.string().nullable(),
  employment_type: yup.string().nullable(),
  work_location_id: yup.string().nullable(),
  base_salary: yup.string().nullable(),
  salary_currency: yup.string().nullable(),
  confirmation_date: yup.string()
    .nullable()
    .test('is-after-hire', 'Confirmation date must be on or after hire date', function (value) {
      const { hire_date } = this.parent;
      if (!value || !hire_date) return true;
      return new Date(value) >= new Date(hire_date);
    }),
  termination_date: yup.string()
    .nullable()
    .test('is-after-hire', 'Termination date must be on or after hire date', function (value) {
      const { hire_date } = this.parent;
      if (!value || !hire_date) return true;
      return new Date(value) >= new Date(hire_date);
    }),
});

const safeParseJSONArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/* ──────────────────────────────────────────────────────────────────
   MODAL
────────────────────────────────────────────────────────────────── */
const EmployeeModal = ({
  show, employee, onClose, onSaved, readOnly = false,
  departments = [], positions = [], managers = [], workLocations = [],
}) => {
  const [saveLoading, setSaveLoading] = useState(false);

  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [signatureFile, setSignatureFile] = useState(null);
  const [signatureOriginalFile, setSignatureOriginalFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const signatureInputRef = useRef(null);

  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loadingDepartment, setLoadingDepartment] = useState(false);

  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedDepartmentHead, setSelectedDepartmentHead] = useState(null);

  const [showWorkLocationModal, setShowWorkLocationModal] = useState(false);
  const [selectedWorkLocation, setSelectedWorkLocation] = useState(null);
  const [loadingWorkLocation, setLoadingWorkLocation] = useState(false);

  const userEditedDisplayNameRef = useRef(false);

  const isDisabled = saveLoading || readOnly;

  const [formData, setFormData] = useState({
    title: '', age: '', display_name: '',
    first_name: '', middle_name: '', last_name: '', email: '', personal_email: '',
    phone: '', mobile: '', date_of_birth: '', gender: '', marital_status: '', nationality: '',
    passport_number: '', social_security_number: '',
    address: { line1: '', city: '', state: '', country: '', zip: '' },
    emergency_contact: { name: '', relationship: '', phone: '' },
    hire_date: '', confirmation_date: '', termination_date: '', status: 'probation',
    dept_id: '', position_id: '', dept_head_id: '', employment_type: 'full_time',
    work_location_id: '', base_salary: '', salary_currency: 'INR',
    bank_details: { account_number: '', bank_name: '', ifsc_code: '' },
    skills: [], languages: [], education: [], work_experience: [], custom_fields: {},
  });

  useEffect(() => {
    if (!show) {
      setSelectedDepartment(null); setLoadingDepartment(false);
      setSelectedPosition(null); setSelectedDepartmentHead(null);
      setSelectedWorkLocation(null); setLoadingWorkLocation(false);
      setApiError(null);
      return;
    }

    if (employee?.emp_id) {
      const parsedSkills = safeParseJSONArray(employee.skills);
      const parsedLanguages = safeParseJSONArray(employee.languages);
      const parsedEducation = safeParseJSONArray(employee.education);
      const parsedWorkExp = safeParseJSONArray(employee.work_experience);
      const bank = employee.bank_details || {};

      const initialAge = employee.age ?? computeAge(employee.date_of_birth);
      const initialDisplayName = employee.display_name || buildDisplayName(employee);

      userEditedDisplayNameRef.current = Boolean(employee.display_name);

      setFormData({
        title: employee.title || '',
        age: initialAge === '' || initialAge === null || initialAge === undefined ? '' : String(initialAge),
        display_name: initialDisplayName || '',
        first_name: employee.first_name || '',
        middle_name: employee.middle_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        personal_email: employee.personal_email || '',
        phone: employee.phone || '',
        mobile: employee.mobile || '',
        date_of_birth: employee.date_of_birth || '',
        gender: employee.gender || '',
        marital_status: employee.marital_status || '',
        nationality: employee.nationality || '',
        passport_number: employee.passport_number || '',
        social_security_number: employee.social_security_number || '',
        address: employee.address || { line1: '', city: '', state: '', country: '', zip: '' },
        emergency_contact: employee.emergency_contact || { name: '', relationship: '', phone: '' },
        hire_date: employee.hire_date || '',
        confirmation_date: employee.confirmation_date || '',
        termination_date: employee.termination_date || '',
        status: employee.status || 'probation',
        dept_id: employee.dept_id || '',
        position_id: employee.position_id || '',
        dept_head_id: employee.dept_head_id || '',
        employment_type: employee.employment_type || 'full_time',
        work_location_id: employee.work_location_id || '',
        base_salary: employee.base_salary || '',
        salary_currency: employee.salary_currency || 'INR',
        bank_details: {
          account_number: bank.account_number || '',
          bank_name: bank.bank_name || '',
          ifsc_code: bank.ifsc_code || '',
        },
        skills: parsedSkills,
        languages: parsedLanguages,
        education: parsedEducation,
        work_experience: parsedWorkExp,
        custom_fields: employee.custom_fields || {},
      });

      let dept = departments.find(d => d.dept_id === employee.dept_id);
      if (dept) {
        setSelectedDepartment(dept); setLoadingDepartment(false);
      } else if (employee.dept_id) {
        setLoadingDepartment(true);
        const abortController = new AbortController();
        const fetchDept = async () => {
          try {
            const res = await hrAPI.getDepartment(employee.dept_id, { signal: abortController.signal });
            if (res.data) setSelectedDepartment(res.data);
            else setSelectedDepartment({ dept_id: employee.dept_id, code: '', name: 'Unknown' });
          } catch (err) {
            if (err.name !== 'AbortError') { }
          } finally { setLoadingDepartment(false); }
        };
        fetchDept();
        return () => abortController.abort();
      } else {
        setSelectedDepartment(null); setLoadingDepartment(false);
      }

      const pos = positions.find(p => p.position_id === employee.position_id);
      setSelectedPosition(pos || null);

      if (employee.dept_head_id) {
        const mgr = managers.find(m => m.emp_id === employee.dept_head_id);
        if (mgr) setSelectedDepartmentHead(mgr);
        else setSelectedDepartmentHead({ emp_id: employee.dept_head_id, first_name: 'Loading...', last_name: '' });
      } else setSelectedDepartmentHead(null);

      const wlId = employee.work_location_id;
      if (wlId) {
        const found = workLocations.find(wl => wl.work_location_id === wlId);
        if (found) {
          setSelectedWorkLocation(found); setLoadingWorkLocation(false);
        } else {
          setLoadingWorkLocation(true);
          (async () => {
            try {
              const res = await hrAPI.getWorklocation(wlId);
              if (res.data) setSelectedWorkLocation(res.data);
              else setSelectedWorkLocation({ work_location_id: wlId, name: 'Unknown', code: '' });
            } catch (err) {
              setSelectedWorkLocation({ work_location_id: wlId, name: 'Unknown', code: '' });
            } finally { setLoadingWorkLocation(false); }
          })();
        }
      } else {
        setSelectedWorkLocation(null); setLoadingWorkLocation(false);
      }

      setProfilePreview(employee.profile || null);
      setProfileFile(null);

      setSignaturePreview(employee.signature || null);
      setSignatureFile(null); setSignatureOriginalFile(null);
      setIsScanning(false);
    } else {
      userEditedDisplayNameRef.current = false;
      setFormData({
        title: '', age: '', display_name: '',
        first_name: '', middle_name: '', last_name: '', email: '', personal_email: '',
        phone: '', mobile: '', date_of_birth: '', gender: '', marital_status: '', nationality: '',
        passport_number: '', social_security_number: '',
        address: { line1: '', city: '', state: '', country: '', zip: '' },
        emergency_contact: { name: '', relationship: '', phone: '' },
        hire_date: '', confirmation_date: '', termination_date: '', status: 'probation',
        dept_id: '', position_id: '', dept_head_id: '', employment_type: 'full_time',
        work_location_id: '', base_salary: '', salary_currency: 'INR',
        bank_details: { account_number: '', bank_name: '', ifsc_code: '' },
        skills: [], languages: [], education: [], work_experience: [], custom_fields: {},
      });
      setSelectedDepartment(null); setLoadingDepartment(false); setSelectedPosition(null);
      setSelectedDepartmentHead(null);
      setSelectedWorkLocation(null); setLoadingWorkLocation(false);
      setProfilePreview(null); setProfileFile(null);
      setSignaturePreview(null); setSignatureFile(null); setSignatureOriginalFile(null);
      setIsScanning(false);
    }
    setValidationErrors({}); setApiError(null);
  }, [employee?.emp_id, show, departments, positions, managers]);

  useEffect(() => {
    return () => {
      if (profilePreview?.startsWith('blob:')) URL.revokeObjectURL(profilePreview);
      if (signaturePreview?.startsWith('blob:')) URL.revokeObjectURL(signaturePreview);
    };
  }, [profilePreview, signaturePreview]);

  const validateForm = useCallback(async () => {
    try {
      const dataToValidate = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        hire_date: formData.hire_date,
        title: formData.title || null,
        display_name: formData.display_name || null,
        age: formData.age === '' ? null : Number(formData.age),
        middle_name: formData.middle_name || null,
        personal_email: formData.personal_email || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        marital_status: formData.marital_status || null,
        nationality: formData.nationality || null,
        passport_number: formData.passport_number || null,
        social_security_number: formData.social_security_number || null,
        dept_id: formData.dept_id || null,
        position_id: formData.position_id || null,
        dept_head_id: formData.dept_head_id || null,
        employment_type: formData.employment_type || null,
        work_location_id: formData.work_location_id || null,
        base_salary: formData.base_salary || null,
        salary_currency: formData.salary_currency || null,
        confirmation_date: formData.confirmation_date || null,
        termination_date: formData.termination_date || null,
      };

      await employeeSchema.validate(dataToValidate, { abortEarly: false });
      setValidationErrors({});
      return true;
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        const errors = {};
        error.inner.forEach(err => { errors[err.path] = err.message; });
        setValidationErrors(errors);
        const firstError = Object.values(errors)[0];
        if (firstError) toast.error(firstError);
      } else {
        toast.error('An error occurred during validation');
      }
      return false;
    }
  }, [formData]);

  const isTerminationEnabled = useMemo(() => {
    if (!employee) return false;
    return formData.status === 'terminated';
  }, [employee, formData.status]);

  useEffect(() => {
    if (formData.status === 'terminated' && !formData.termination_date) {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, termination_date: today }));
    }
  }, [formData.status]);

  const handleInputChange = useCallback((field, value) => {
    if (readOnly) return;
    setFormData(prev => {
      const next = { ...prev, [field]: value };

      if (field === 'title') {
        const impliedGender = titleToGender(value);
        if (impliedGender) next.gender = impliedGender;
      }

      if (field === 'gender') {
        const currentTitle = prev.title;
        if (currentTitle === 'Mr.' || currentTitle === 'Ms.' || currentTitle === 'Mrs.') {
          const preferred = genderToTitle(value);
          if (preferred) next.title = preferred;
        }
      }

      if (
        field === 'first_name' ||
        field === 'middle_name' ||
        field === 'last_name' ||
        field === 'title'
      ) {
        if (!userEditedDisplayNameRef.current) {
          next.display_name = buildDisplayName({
            title: next.title,
            first_name: next.first_name,
            middle_name: next.middle_name,
            last_name: next.last_name,
          });
        }
      }

      return next;
    });

    if (validationErrors[field]) {
      setValidationErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError, readOnly]);

  const handleDisplayNameChange = useCallback((value) => {
    if (readOnly) return;
    userEditedDisplayNameRef.current = true;
    handleInputChange('display_name', value);
  }, [handleInputChange, readOnly]);

  const handleDobChange = useCallback((value) => {
    if (readOnly) return;
    setFormData(prev => {
      const derivedAge = computeAge(value);
      return { ...prev, date_of_birth: value, age: derivedAge === '' ? '' : String(derivedAge) };
    });
    if (validationErrors.date_of_birth) {
      setValidationErrors(prev => { const n = { ...prev }; delete n.date_of_birth; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError, readOnly]);

  const handleAgeChange = useCallback((value) => {
    if (readOnly) return;
    setFormData(prev => {
      const next = { ...prev, age: value };
      if (value !== '' && value !== null && value !== undefined) {
        const derivedDob = computeDobFromAge(value, prev.date_of_birth);
        if (derivedDob) next.date_of_birth = derivedDob;
      }
      return next;
    });
    if (validationErrors.age) {
      setValidationErrors(prev => { const n = { ...prev }; delete n.age; return n; });
    }
    if (apiError) setApiError(null);
  }, [validationErrors, apiError, readOnly]);

  const handleNestedChange = useCallback((parent, field, value) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
    if (apiError) setApiError(null);
  }, [apiError, readOnly]);

  const handleArrayChange = useCallback((field, value) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    if (apiError) setApiError(null);
  }, [apiError, readOnly]);

  const handleDepartmentSelect = useCallback((selectedDept) => {
    if (readOnly) return;
    if (selectedDept) { handleInputChange('dept_id', selectedDept.dept_id); setSelectedDepartment(selectedDept); }
    else { handleInputChange('dept_id', ''); setSelectedDepartment(null); }
    setShowDeptModal(false);
  }, [handleInputChange, readOnly]);

  const handlePositionSelect = useCallback((selectedPos) => {
    if (readOnly) return;
    if (selectedPos) { handleInputChange('position_id', selectedPos.position_id); setSelectedPosition(selectedPos); }
    else { handleInputChange('position_id', ''); setSelectedPosition(null); }
    setShowPositionModal(false);
  }, [handleInputChange, readOnly]);

  const handleDepartmentHeadSelect = useCallback((selectedEmp) => {
    if (readOnly) return;
    if (selectedEmp) { handleInputChange('dept_head_id', selectedEmp.emp_id); setSelectedDepartmentHead(selectedEmp); }
    else { handleInputChange('dept_head_id', ''); setSelectedDepartmentHead(null); }
    setShowEmployeeModal(false);
  }, [handleInputChange, readOnly]);

  const handleWorkLocationSelect = useCallback((selectedLoc) => {
    if (readOnly) return;
    if (selectedLoc) { handleInputChange('work_location_id', selectedLoc.work_location_id); setSelectedWorkLocation(selectedLoc); }
    else { handleInputChange('work_location_id', ''); setSelectedWorkLocation(null); }
    setShowWorkLocationModal(false);
  }, [handleInputChange, readOnly]);

  const handleProfileUpload = useCallback(e => {
    if (readOnly) return;
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image (JPG, PNG, WEBP)'); e.target.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Profile image must be <2MB'); e.target.value = ''; return; }
    if (profilePreview?.startsWith('blob:')) URL.revokeObjectURL(profilePreview);
    setProfileFile(file);
    setProfilePreview(URL.createObjectURL(file));
    toast.success('Profile image selected');
  }, [profilePreview, readOnly]);

  const removeProfileImage = useCallback(() => {
    if (readOnly) return;
    if (profilePreview?.startsWith('blob:')) URL.revokeObjectURL(profilePreview);
    setProfileFile(null); setProfilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast.success('Profile image removed');
  }, [profilePreview, readOnly]);

  const runSignatureScan = useCallback(async (sourceFile) => {
    if (readOnly) return;
    if (!sourceFile) return;
    setIsScanning(true);
    try {
      const blob = await scanSignatureImage(sourceFile);
      const scannedFile = new File([blob], `signature-scanned-${Date.now()}.png`, { type: 'image/png' });
      setSignatureFile(scannedFile);
      setSignaturePreview(prev => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      toast.success('Signature scanned');
    } catch (err) {
      toast.error('Scan failed — using uploaded image');
    } finally { setIsScanning(false); }
  }, [readOnly]);

  const handleSignatureUpload = useCallback(async (e) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) { toast.error('Signature: PNG, JPG, WEBP, SVG only'); e.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Signature must be <5MB'); e.target.value = ''; return; }

    setSignatureOriginalFile(file);
    setSignatureFile(file);
    setSignaturePreview(prev => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    e.target.value = '';
    await runSignatureScan(file);
  }, [runSignatureScan, readOnly]);

  const reScanSignature = useCallback(() => {
    if (readOnly) return;
    if (!signatureOriginalFile) { toast.error('No original to re-scan'); return; }
    runSignatureScan(signatureOriginalFile);
  }, [signatureOriginalFile, runSignatureScan, readOnly]);

  const removeSignature = useCallback(() => {
    if (readOnly) return;
    if (signaturePreview?.startsWith('blob:')) URL.revokeObjectURL(signaturePreview);
    setSignatureFile(null); setSignatureOriginalFile(null); setIsScanning(false);
    setSignaturePreview(null);
    if (signatureInputRef.current) signatureInputRef.current.value = '';
    toast.success('Signature removed');
  }, [signaturePreview, readOnly]);

  const handleSaveEmployee = useCallback(async () => {
    if (readOnly) return;
    const isValid = await validateForm();
    if (!isValid) return;

    const apiFormData = new FormData();

    if (formData.title) apiFormData.append('title', formData.title);
    if (formData.display_name) apiFormData.append('display_name', formData.display_name.trim());
    if (formData.age !== '' && formData.age !== null) apiFormData.append('age', String(formData.age));
    if (formData.first_name) apiFormData.append('first_name', formData.first_name.trim());
    if (formData.middle_name) apiFormData.append('middle_name', formData.middle_name.trim());
    if (formData.last_name) apiFormData.append('last_name', formData.last_name.trim());
    if (formData.email) apiFormData.append('email', formData.email.trim());
    if (formData.personal_email) apiFormData.append('personal_email', formData.personal_email.trim());
    if (formData.phone) apiFormData.append('phone', formData.phone.trim());
    if (formData.mobile) apiFormData.append('mobile', formData.mobile.trim());
    if (formData.date_of_birth) apiFormData.append('date_of_birth', formData.date_of_birth);
    if (formData.gender) apiFormData.append('gender', formData.gender);
    if (formData.marital_status) apiFormData.append('marital_status', formData.marital_status);
    if (formData.nationality) apiFormData.append('nationality', formData.nationality.trim());
    if (formData.passport_number) apiFormData.append('passport_number', formData.passport_number.trim());
    if (formData.social_security_number) apiFormData.append('social_security_number', formData.social_security_number.trim());

    apiFormData.append('address', JSON.stringify(formData.address || {}));
    apiFormData.append('emergency_contact', JSON.stringify(formData.emergency_contact || {}));
    apiFormData.append('bank_details', JSON.stringify(formData.bank_details || {}));
    apiFormData.append('skills', JSON.stringify(formData.skills || []));
    apiFormData.append('languages', JSON.stringify(formData.languages || []));
    apiFormData.append('education', JSON.stringify(formData.education || []));
    apiFormData.append('work_experience', JSON.stringify(formData.work_experience || []));
    apiFormData.append('custom_fields', JSON.stringify(formData.custom_fields || {}));

    apiFormData.append('hire_date', formData.hire_date || '');
    apiFormData.append('confirmation_date', formData.confirmation_date || '');
    apiFormData.append('termination_date', formData.termination_date || '');

    // Preserve existing status on edit; new employees always start as probation
    apiFormData.append('status', employee ? (formData.status || 'probation') : 'probation');

    apiFormData.append('dept_id', formData.dept_id || '');
    apiFormData.append('position_id', formData.position_id || '');
    apiFormData.append('dept_head_id', formData.dept_head_id || '');
    apiFormData.append('employment_type', formData.employment_type || 'full_time');
    apiFormData.append('work_location_id', formData.work_location_id || '');
    apiFormData.append('base_salary', String(parseFloat(formData.base_salary) || 0));
    apiFormData.append('salary_currency', formData.salary_currency || 'INR');

    if (profileFile) apiFormData.append('files', profileFile);
    if (signatureFile) apiFormData.append('files', signatureFile);

    setSaveLoading(true);
    setApiError(null);
    try {
      if (employee) await hrAPI.updateEmployee(employee.emp_id, apiFormData);
      else await hrAPI.createEmployee(apiFormData);
      toast.success(`Employee ${employee ? 'updated' : 'created'} successfully!`);
      onSaved();
    } catch (error) {
      const apiError = error.response?.data;
      let errorMessage = 'Failed to save employee';
      if (apiError) {
        if (apiError.message) errorMessage = apiError.message;
        else if (apiError.errors && Array.isArray(apiError.errors) && apiError.errors.length > 0) {
          errorMessage = apiError.errors.map(e => e.message || e.msg || e).join('; ');
        } else if (typeof apiError === 'string') errorMessage = apiError;
      } else if (error.message) errorMessage = error.message;
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  }, [formData, profileFile, signatureFile, employee, onSaved, validateForm, readOnly]);

  const displayDeptText = useMemo(() => {
    if (loadingDepartment) return 'Loading...';
    if (selectedDepartment) {
      const { dept_id, code, name } = selectedDepartment;
      return code ? `${dept_id} - ${code} - ${name}` : `${dept_id} - ${name}`;
    }
    if (formData.dept_id) {
      const dept = departments.find(d => d.dept_id === formData.dept_id);
      if (dept) return dept.code ? `${dept.dept_id} - ${dept.code} - ${dept.name}` : `${dept.dept_id} - ${dept.name}`;
      return `ID: ${formData.dept_id}`;
    }
    return 'None';
  }, [selectedDepartment, formData.dept_id, departments, loadingDepartment]);

  const displayPositionText = useMemo(() => {
    if (selectedPosition) return selectedPosition.title;
    if (formData.position_id) {
      const pos = positions.find(p => p.position_id === formData.position_id);
      if (pos) return pos.title;
      return `ID: ${formData.position_id}`;
    }
    return 'None';
  }, [selectedPosition, formData.position_id, positions]);

  const displayDeptHeadText = useMemo(() => {
    if (selectedDepartmentHead) {
      const name = [selectedDepartmentHead.first_name, selectedDepartmentHead.last_name].filter(Boolean).join(' ');
      const code = selectedDepartmentHead.employee_code ? `(${selectedDepartmentHead.employee_code})` : '';
      return name ? `${name} ${code}`.trim() : `ID: ${selectedDepartmentHead.emp_id}`;
    }
    if (formData.dept_head_id) {
      const mgr = managers.find(m => m.emp_id === formData.dept_head_id);
      if (mgr) return `${mgr.first_name} ${mgr.last_name}`;
      return `ID: ${formData.dept_head_id}`;
    }
    return 'None';
  }, [selectedDepartmentHead, formData.dept_head_id, managers]);

  const displayWorkLocationText = useMemo(() => {
    if (loadingWorkLocation) return 'Loading...';
    if (selectedWorkLocation) {
      const { name, code } = selectedWorkLocation;
      return code ? `${name} (${code})` : name;
    }
    if (formData.work_location_id) return `ID: ${formData.work_location_id}`;
    return 'None';
  }, [selectedWorkLocation, formData.work_location_id, loadingWorkLocation]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
      <div className="bg-white rounded-md max-w-[1750px] w-full h-[95vh] flex flex-col shadow-xl">

        {/* HEADER */}
        <div className="flex-shrink-0 flex items-center justify-between p-2.5 border-b">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              {readOnly
                ? <><Eye className="w-4 h-4 text-blue-600" /> View Employee</>
                : (employee ? 'Edit Employee' : 'Add Employee')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {employee ? `${employee.first_name} ${employee.last_name}` : 'Enter employee details'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!readOnly && (
              <button
                onClick={handleSaveEmployee}
                className="px-2.5 py-1 text-xs border rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1 disabled:opacity-60"
                disabled={saveLoading || isScanning}
                title={isScanning ? 'Waiting for signature scan...' : ''}
              >
                <Save className="w-3 h-3" /> {saveLoading ? 'Saving...' : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
              disabled={saveLoading}
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2.5 space-y-2.5">

            {apiError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm text-red-700">{apiError}</span>
                </div>
                <button onClick={() => setApiError(null)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* PERSONAL INFORMATION */}
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Personal Information</span>
              </div>
              <div className="p-2.5 flex gap-2.5">

                <div className="flex-1 min-w-0 space-y-2">

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Title</label>
                      <select
                        value={formData.title}
                        onChange={e => handleInputChange('title', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      >
                        {TITLE_OPTIONS.map(t => (
                          <option key={t} value={t}>{t || '— None —'}</option>
                        ))}
                      </select>
                      {validationErrors.title && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.title}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">First <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={e => handleInputChange('first_name', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                      {validationErrors.first_name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Middle</label>
                      <input
                        type="text"
                        value={formData.middle_name}
                        onChange={e => handleInputChange('middle_name', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Last <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={e => handleInputChange('last_name', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                      {validationErrors.last_name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.last_name}</p>}
                    </div>
                    <div className="xl:col-span-2">
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">
                        Display Name <span className="text-[9px] text-gray-400">(auto)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.display_name}
                        onChange={e => handleDisplayNameChange(e.target.value)}
                        placeholder="Auto-fills from title + name"
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                      {validationErrors.display_name && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.display_name}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                      {validationErrors.email && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.email}</p>}
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">P.Email</label>
                      <input
                        type="email"
                        value={formData.personal_email}
                        onChange={e => handleInputChange('personal_email', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                      {validationErrors.personal_email && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.personal_email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-1.5">
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={e => handleInputChange('gender', e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      >
                        <option value="">—</option>
                        <option value="male">male</option>
                        <option value="female">female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">DOB</label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={e => handleDobChange(e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">
                        Age <span className="text-[8px] text-gray-400">(↔)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="150"
                        value={formData.age}
                        onChange={e => handleAgeChange(e.target.value)}
                        placeholder="Auto"
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                      {validationErrors.age && <p className="text-[8px] text-red-600 mt-0.5">{validationErrors.age}</p>}
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Marital</label>
                      <select
                        value={formData.marital_status}
                        onChange={e => handleInputChange('marital_status', e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      >
                        <option value="">—</option>
                        <option value="single">single</option>
                        <option value="married">married</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Nation.</label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={e => handleInputChange('nationality', e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Passport</label>
                      <input
                        type="text"
                        value={formData.passport_number}
                        onChange={e => handleInputChange('passport_number', e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">SSN</label>
                      <input
                        type="text"
                        value={formData.social_security_number}
                        onChange={e => handleInputChange('social_security_number', e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Mobile</label>
                      <input
                        type="text"
                        value={formData.mobile}
                        onChange={e => handleInputChange('mobile', e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-gray-700 mb-0.5 block">Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        className="w-full px-1 py-0.5 border rounded text-[11px] disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8 gap-2">
                    <div className="xl:col-span-2">
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Address Line 1</label>
                      <input
                        type="text"
                        value={formData.address.line1}
                        onChange={e => handleNestedChange('address', 'line1', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">City</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={e => handleNestedChange('address', 'city', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">State</label>
                      <input
                        type="text"
                        value={formData.address.state}
                        onChange={e => handleNestedChange('address', 'state', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Country</label>
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={e => handleNestedChange('address', 'country', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">ZIP</label>
                      <input
                        type="text"
                        value={formData.address.zip}
                        onChange={e => handleNestedChange('address', 'zip', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
                    <div className="xl:col-span-3">
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Emergency Contact Name</label>
                      <input
                        type="text"
                        value={formData.emergency_contact.name}
                        onChange={e => handleNestedChange('emergency_contact', 'name', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div className="xl:col-span-2">
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Relationship</label>
                      <input
                        type="text"
                        value={formData.emergency_contact.relationship}
                        onChange={e => handleNestedChange('emergency_contact', 'relationship', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                    <div className="xl:col-span-3">
                      <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Emergency Phone</label>
                      <input
                        type="text"
                        value={formData.emergency_contact.phone}
                        onChange={e => handleNestedChange('emergency_contact', 'phone', e.target.value)}
                        className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                        disabled={isDisabled}
                      />
                    </div>
                  </div>

                </div>

                {/* PROFILE + SIGNATURE SIDE PANEL */}
                <div className="w-[200px] flex-shrink-0 space-y-2">

                  <div className="border rounded-md overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
                      <ImageIcon className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Profile</span>
                    </div>
                    <div className="p-1.5">
                      <input type="file" ref={fileInputRef} onChange={handleProfileUpload} accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" id="profile-upload" disabled={isDisabled} />
                      {profilePreview ? (
                        <div className="space-y-1">
                          <div className="flex justify-center">
                            <img src={profilePreview} alt="Profile" className="w-[80px] h-[100px] object-cover rounded border border-gray-200 bg-white" />
                          </div>
                          <p className="text-[9px] text-gray-500 text-center truncate">{profileFile ? `${(profileFile.size / 1024).toFixed(0)} KB` : 'Uploaded'}</p>
                          {!readOnly && (
                            <div className="flex gap-1">
                              <label htmlFor="profile-upload" className={`flex-1 px-1 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-medium rounded flex items-center justify-center gap-1 cursor-pointer hover:bg-blue-100 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <UploadIcon className="w-2.5 h-2.5" /> Change
                              </label>
                              <button onClick={removeProfileImage} disabled={isDisabled} className="px-1 py-0.5 bg-red-50 text-red-700 text-[9px] font-medium rounded flex items-center gap-1 disabled:opacity-50">
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : readOnly ? (
                        <div className="text-center text-[9px] text-gray-500 py-2">No profile image</div>
                      ) : (
                        <label htmlFor="profile-upload" className="block text-center cursor-pointer border border-dashed border-gray-300 rounded p-2 hover:border-primary-400">
                          <UploadIcon className="w-3.5 h-3.5 text-gray-400 mx-auto mb-0.5" />
                          <p className="text-[9px] text-gray-600">Upload</p>
                          <p className="text-[8px] text-gray-500">JPG/PNG ≤ 2MB</p>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border-b">
                      <PenTool className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Signature</span>
                      <span className="text-[8px] text-gray-500">(auto)</span>
                    </div>
                    <div className="p-1.5 relative">
                      <input type="file" ref={signatureInputRef} onChange={handleSignatureUpload} accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" className="hidden" id="signature-upload" disabled={isDisabled || isScanning} />
                      {signaturePreview ? (
                        <div className="space-y-1">
                          <div className="relative flex justify-center">
                            <img src={signaturePreview} alt="Signature" className="w-full h-10 object-contain bg-white border border-gray-200 rounded" />
                            {isScanning && (
                              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded">
                                <RefreshCw className="w-3 h-3 text-primary-600 animate-spin" />
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-500 text-center truncate">
                            {signatureFile ? `${(signatureFile.size / 1024).toFixed(0)} KB` : 'Uploaded'}
                            {signatureFile && !isScanning && signatureOriginalFile && <span className="ml-1 text-green-600">✓</span>}
                          </p>
                          {!readOnly && (
                            <div className="flex gap-1 flex-wrap">
                              <label htmlFor="signature-upload" className={`flex-1 min-w-0 px-1 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-medium rounded flex items-center justify-center gap-1 cursor-pointer hover:bg-blue-100 ${(isDisabled || isScanning) ? 'opacity-50 pointer-events-none' : ''}`}>
                                <UploadIcon className="w-2.5 h-2.5" /> Change
                              </label>
                              {signatureOriginalFile && (
                                <button onClick={reScanSignature} disabled={isDisabled || isScanning} className="px-1 py-0.5 bg-purple-50 text-purple-700 text-[9px] font-medium rounded flex items-center gap-1 disabled:opacity-50 hover:bg-purple-100" title="Re-scan">
                                  <RefreshCw className={`w-2.5 h-2.5 ${isScanning ? 'animate-spin' : ''}`} />
                                </button>
                              )}
                              <button onClick={removeSignature} disabled={isDisabled || isScanning} className="px-1 py-0.5 bg-red-50 text-red-700 text-[9px] font-medium rounded flex items-center gap-1 disabled:opacity-50">
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : isScanning ? (
                        <div className="text-center py-2 space-y-1">
                          <RefreshCw className="w-4 h-4 text-primary-600 mx-auto animate-spin" />
                          <p className="text-[9px] text-gray-600">Scanning...</p>
                        </div>
                      ) : readOnly ? (
                        <div className="text-center text-[9px] text-gray-500 py-2">No signature</div>
                      ) : (
                        <label htmlFor="signature-upload" className="block text-center cursor-pointer border border-dashed border-gray-300 rounded p-2 hover:border-primary-400">
                          <UploadIcon className="w-3.5 h-3.5 text-gray-400 mx-auto mb-0.5" />
                          <p className="text-[9px] text-gray-600">Upload</p>
                          <p className="text-[8px] text-gray-500">PNG/JPG ≤ 5MB</p>
                        </label>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* EMPLOYMENT DETAILS — Status field removed */}
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
                <Briefcase className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Employment Details</span>
              </div>
              <div className="p-2.5 space-y-2">

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Hire <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.hire_date} onChange={e => handleInputChange('hire_date', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={isDisabled} />
                    {validationErrors.hire_date && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.hire_date}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Confirm</label>
                    <input type="date" value={formData.confirmation_date} onChange={e => handleInputChange('confirmation_date', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={isDisabled} />
                    {validationErrors.confirmation_date && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.confirmation_date}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Term.</label>
                    <input type="date" value={formData.termination_date} onChange={e => handleInputChange('termination_date', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={!isTerminationEnabled || isDisabled} />
                    {validationErrors.termination_date && <p className="text-[9px] text-red-600 mt-0.5">{validationErrors.termination_date}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Type</label>
                    <select value={formData.employment_type} onChange={e => handleInputChange('employment_type', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={isDisabled}>
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Cur.</label>
                    <select value={formData.salary_currency} onChange={e => handleInputChange('salary_currency', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={isDisabled}>
                      <option value="INR">INR ₹</option>
                      <option value="USD">USD $</option>
                      <option value="EUR">EUR €</option>
                    </select>
                  </div>
                  <div className="xl:col-span-2">
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Base Salary</label>
                    <input type="number" min="0" step="0.01" value={formData.base_salary} onChange={e => handleInputChange('base_salary', e.target.value)} className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={isDisabled} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2">
                  <div className="xl:col-span-2">
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Department</label>
                    <div className="flex items-center gap-1">
                      <div
                        className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                        onClick={() => !isDisabled && setShowDeptModal(true)}
                      >
                        <span className={`truncate ${formData.dept_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayDeptText}</span>
                        {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                      </div>
                      {formData.dept_id && !isDisabled && (
                        <button onClick={() => { handleInputChange('dept_id', ''); setSelectedDepartment(null); }} className="p-0.5 text-gray-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="xl:col-span-2">
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Position</label>
                    <div className="flex items-center gap-1">
                      <div
                        className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                        onClick={() => !isDisabled && setShowPositionModal(true)}
                      >
                        <span className={`truncate ${formData.position_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayPositionText}</span>
                        {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                      </div>
                      {formData.position_id && !isDisabled && (
                        <button onClick={() => { handleInputChange('position_id', ''); setSelectedPosition(null); }} className="p-0.5 text-gray-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="xl:col-span-2">
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Dept Head</label>
                    <div className="flex items-center gap-1">
                      <div
                        className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                        onClick={() => !isDisabled && setShowEmployeeModal(true)}
                      >
                        <span className={`truncate ${formData.dept_head_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayDeptHeadText}</span>
                        {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                      </div>
                      {formData.dept_head_id && !isDisabled && (
                        <button onClick={() => { handleInputChange('dept_head_id', ''); setSelectedDepartmentHead(null); }} className="p-0.5 text-gray-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="xl:col-span-2">
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Location</label>
                    <div className="flex items-center gap-1">
                      <div
                        className={`flex-1 px-1.5 py-1 border rounded text-xs flex items-center justify-between ${isDisabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}`}
                        onClick={() => !isDisabled && setShowWorkLocationModal(true)}
                      >
                        <span className={`truncate ${formData.work_location_id ? 'text-gray-900' : 'text-gray-400'}`}>{displayWorkLocationText}</span>
                        {!isDisabled && <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 ml-1" />}
                      </div>
                      {formData.work_location_id && !isDisabled && (
                        <button onClick={() => { handleInputChange('work_location_id', ''); setSelectedWorkLocation(null); }} className="p-0.5 text-gray-400 hover:text-red-600 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bank_details.bank_name}
                      onChange={e => handleNestedChange('bank_details', 'bank_name', e.target.value)}
                      className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Bank A/C</label>
                    <input
                      type="text"
                      value={formData.bank_details.account_number}
                      onChange={e => handleNestedChange('bank_details', 'account_number', e.target.value)}
                      className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                      disabled={isDisabled}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">IFSC</label>
                    <input
                      type="text"
                      value={formData.bank_details.ifsc_code}
                      onChange={e => handleNestedChange('bank_details', 'ifsc_code', e.target.value)}
                      className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="xl:col-span-2">
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Skills (comma separated)</label>
                    <input
                      type="text"
                      value={formData.skills.join(', ')}
                      onChange={e => handleArrayChange('skills', e.target.value)}
                      placeholder="React, Node.js"
                      className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                      disabled={isDisabled}
                    />
                  </div>
                  <div className="xl:col-span-3">
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Languages (comma separated)</label>
                    <input
                      type="text"
                      value={formData.languages.join(', ')}
                      onChange={e => handleArrayChange('languages', e.target.value)}
                      placeholder="English, Hindi"
                      className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600"
                      disabled={isDisabled}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Custom Fields (JSON)</label>
                  <textarea
                    rows={2}
                    value={JSON.stringify(formData.custom_fields, null, 2)}
                    onChange={e => { try { handleInputChange('custom_fields', JSON.parse(e.target.value)); } catch {} }}
                    className="w-full px-1.5 py-1 border rounded text-xs font-mono disabled:bg-gray-50 disabled:text-gray-600"
                    disabled={isDisabled}
                  />
                </div>
              </div>
            </div>

            {/* SKILLS & LANGUAGES PREVIEW */}
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
                <Award className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Skills & Languages Preview</span>
              </div>
              <div className="p-2.5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Skills</label>
                    <input type="text" value={formData.skills.join(', ')} onChange={e => handleArrayChange('skills', e.target.value)} placeholder="React, Node.js, Python" className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={isDisabled} />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-gray-700 mb-0.5 block">Languages</label>
                    <input type="text" value={formData.languages.join(', ')} onChange={e => handleArrayChange('languages', e.target.value)} placeholder="English, Spanish, Hindi" className="w-full px-1.5 py-1 border rounded text-xs disabled:bg-gray-50 disabled:text-gray-600" disabled={isDisabled} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="flex-shrink-0 flex items-center justify-end px-2.5 py-1 border-t bg-gray-50">
          <p className="text-[10px] text-gray-500">
            {employee ? `Last updated: ${new Date(employee.updatedAt || employee.updated_at).toLocaleDateString()}` : 'New employee'}
          </p>
        </div>
      </div>

      {/* PICKERS */}
      <Suspense fallback={null}>
        <DepartmentSelectionModal
          show={showDeptModal && !readOnly}
          onClose={() => setShowDeptModal(false)}
          onSelect={handleDepartmentSelect}
          selectedDepartmentId={formData.dept_id || null}
        />
      </Suspense>
      <Suspense fallback={null}>
        <PositionSelectionModal
          show={showPositionModal && !readOnly}
          onClose={() => setShowPositionModal(false)}
          onSelect={handlePositionSelect}
          selectedPositionId={formData.position_id || null}
          departmentId={formData.dept_id || null}
        />
      </Suspense>
      <Suspense fallback={null}>
        <EmployeeSelectionModal
          show={showEmployeeModal && !readOnly}
          onClose={() => setShowEmployeeModal(false)}
          onSelect={handleDepartmentHeadSelect}
          selectedEmployeeId={formData.dept_head_id || null}
          excludeId={employee?.emp_id || null}
          deptId={formData.dept_id || null}
        />
      </Suspense>
      <Suspense fallback={null}>
        <WorkLocationSelectionModal
          show={showWorkLocationModal && !readOnly}
          onClose={() => setShowWorkLocationModal(false)}
          onSelect={handleWorkLocationSelect}
          selectedWorkLocationId={formData.work_location_id || null}
          statusFilter="active"
        />
      </Suspense>
    </div>
  );
};

export default React.memo(EmployeeModal);
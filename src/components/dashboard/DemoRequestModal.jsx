import React, { useState, useEffect, useCallback, useContext, lazy, Suspense } from 'react';
import {
  X, Save, Calendar, Mail, Phone, Building, MessageSquare,
  User, Clock, CheckCircle, AlertCircle, BookOpen, Lock, Sparkles,
} from 'lucide-react';
import { demoRequestAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CourseSelectionModal = lazy(() => import('../ui/CourseSelectionModal'));

const DemoRequestModal = ({ show, request, onClose, onSaved, isAdmin }) => {
  const { user } = useContext(AuthContext);
  const userData = user?.user;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    course_id: '',
    preferred_date: '',
    status: 'pending',
    metadata: '',
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCourseModal, setShowCourseModal] = useState(false);

  const isEditing = !!request;

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Calendar },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
  ];

  useEffect(() => {
    if (request) {
      if (request.demo_req_id) {
        setFormData({
          name: request.name || '',
          email: request.email || '',
          phone: request.phone || '',
          company: request.company || '',
          message: request.message || '',
          course_id: request.course_id || '',
          preferred_date: request.preferred_date
            ? new Date(request.preferred_date).toISOString().split('T')[0]
            : '',
          status: request.status || 'pending',
          metadata: request.metadata ? JSON.stringify(request.metadata, null, 2) : '',
        });

        if (request.course_id && request.Course) {
          setSelectedCourse({
            id: request.course_id,
            title: request.Course.title || `Course ${request.course_id}`,
          });
        }
      } else {
        // Enrollment flow (no demo_req_id)
        const defaultData = {
          name: userData?.name || '',
          email: userData?.email || '',
          phone: userData?.phone || '',
          company: '',
          message: '',
          course_id: request.course_id || '',
          preferred_date: '',
          status: 'pending',
          metadata: '',
        };

        if (!isAdmin && userData) {
          defaultData.name = userData.name || '';
          defaultData.email = userData.email || '';
          defaultData.phone = userData.phone || '';
        }

        setFormData(defaultData);

        if (request.course_id && request.Course) {
          setSelectedCourse({
            id: request.course_id,
            title: request.Course.title,
            instructor: request.Course.instructor,
            thumbnail_image: request.Course.thumbnail_image,
          });
        }
      }
    } else {
      // New request from dashboard
      const defaultData = {
        name: userData?.name || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        company: '',
        message: '',
        course_id: '',
        preferred_date: '',
        status: 'pending',
        metadata: '',
      };

      if (!isAdmin && userData) {
        defaultData.name = userData.name || '';
        defaultData.email = userData.email || '';
        defaultData.phone = userData.phone || '';
      }

      setFormData(defaultData);
      setSelectedCourse(null);
    }
    setErrors({});
  }, [request, userData, isAdmin]);

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    },
    [errors]
  );

  const handleCourseSelect = course => {
    setSelectedCourse(course);
    setFormData(prev => ({ ...prev, course_id: course.id }));
  };

  const handleClearCourse = () => {
    setSelectedCourse(null);
    setFormData(prev => ({ ...prev, course_id: '' }));
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (formData.phone && !/^[\d\s\+\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!formData.course_id) newErrors.course_id = 'Course is required';
    if (formData.preferred_date) {
      const selectedDate = new Date(formData.preferred_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) newErrors.preferred_date = 'Date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSaveRequest = useCallback(async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setSaveLoading(true);

    try {
      const data = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
        message: formData.message.trim() || null,
        course_id: formData.course_id,
        preferred_date: formData.preferred_date || null,
        ...(isAdmin && { status: formData.status }),
        ...(formData.metadata.trim() && { metadata: formData.metadata.trim() }),
      };

      let response;
      if (isEditing && request.demo_req_id) {
        response = await demoRequestAPI.update(request.demo_req_id, data);
      } else {
        response = await demoRequestAPI.create(data);
      }

      if (response.data?.success) {
        toast.success(isEditing ? 'Demo request updated successfully!' : 'Demo request submitted successfully!');
        onSaved();
      } else {
        throw new Error(response.data?.error || 'Failed to save demo request');
      }
    } catch (err) {
      console.error('Save demo request error:', err.response?.data || err);
      const errorMessage = err.response?.data?.error || 'Failed to save demo request';
      setErrors({ submit: errorMessage });
      toast.error(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  }, [validateForm, formData, request, isAdmin, isEditing, onSaved]);

  useEffect(() => {
    const handleEscapeKey = e => {
      if (e.key === 'Escape' && show && !saveLoading) onClose();
    };
    if (show) document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [show, saveLoading, onClose]);

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-1 z-50">
        <div className="bg-white rounded-md max-w-4xl w-full h-[95vh] flex flex-col shadow-xl">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-b">
            <div>
              <h2 className="text-base font-semibold">
                {isEditing ? 'Edit Demo Request' : 'Request Free Demo Sessions'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isEditing && request.demo_req_id
                  ? `Editing request #${request.demo_req_id}`
                  : 'Get 2 free demo classes + detailed syllabus + instructor intro'}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" disabled={saveLoading}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Special Offer Banner */}
          {!isEditing && (
            <div className="mx-3 mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded text-xs">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600 flex-shrink-0" />
                <p className="text-blue-800">
                  <span className="font-semibold">Special Offer:</span> Get 2 free demo classes with detailed syllabus and instructor introduction
                </p>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {errors.submit && (
            <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Personal Information
                </h3>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Enter your full name"
                    disabled={saveLoading || (!isAdmin && isEditing && request.demo_req_id)}
                    readOnly={!isAdmin && isEditing && request.demo_req_id}
                  />
                  {errors.name && <p className="text-red-600 text-xs mt-0.5">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        className={`w-full pl-7 pr-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="your@email.com"
                        disabled={saveLoading || (!isAdmin && isEditing && request.demo_req_id)}
                        readOnly={!isAdmin && isEditing && request.demo_req_id}
                      />
                    </div>
                    {errors.email && <p className="text-red-600 text-xs mt-0.5">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-7 pr-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${errors.phone ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="+91 9876543210"
                        disabled={saveLoading || (!isAdmin && isEditing && request.demo_req_id)}
                        readOnly={!isAdmin && isEditing && request.demo_req_id}
                      />
                    </div>
                    {errors.phone && <p className="text-red-600 text-xs mt-0.5">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Company</label>
                  <div className="relative">
                    <Building className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={e => handleInputChange('company', e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500"
                      placeholder="Company name"
                      disabled={saveLoading}
                    />
                  </div>
                </div>

                {/* Course Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Course <span className="text-red-500">*</span>
                    {isEditing && request.demo_req_id && (
                      <span className="ml-1 text-gray-400">
                        <Lock className="w-3 h-3 inline ml-0.5" />
                      </span>
                    )}
                  </label>

                  {isEditing && request.demo_req_id ? (
                    <div className={`w-full px-2.5 py-1.5 border rounded text-sm bg-gray-50 ${selectedCourse ? 'border-gray-300' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-700">
                            {selectedCourse ? selectedCourse.title : 'No course selected'}
                          </span>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {selectedCourse ? `ID: #${selectedCourse.id}` : 'Cannot be changed'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedCourse ? (
                        <div className="p-2 border border-gray-300 rounded bg-gray-50">
                          <div className="flex items-start gap-2">
                            {selectedCourse.thumbnail_image ? (
                              <img src={selectedCourse.thumbnail_image} alt={selectedCourse.title} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-primary-100 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-primary-500" />
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{selectedCourse.title}</h4>
                              {selectedCourse.instructor && <p className="text-xs text-gray-500">{selectedCourse.instructor}</p>}
                              <p className="text-xs text-gray-500">ID: #{selectedCourse.id}</p>
                            </div>
                            <button type="button" onClick={handleClearCourse} className="text-red-600 hover:text-red-800 text-xs" disabled={saveLoading}>
                              Change
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={formData.course_id}
                              className={`w-full px-2.5 py-1.5 pl-8 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${errors.course_id ? 'border-red-300' : 'border-gray-300'}`}
                              placeholder="Select course"
                              readOnly
                            />
                            <BookOpen className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowCourseModal(true)}
                            className="px-2.5 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded hover:bg-primary-100"
                            disabled={saveLoading}
                          >
                            Browse
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  {errors.course_id && <p className="text-red-600 text-xs mt-0.5">{errors.course_id}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Preferred Demo Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                      type="date"
                      value={formData.preferred_date}
                      onChange={e => handleInputChange('preferred_date', e.target.value)}
                      className={`w-full pl-7 pr-2.5 py-1.5 border rounded text-sm focus:ring-1 focus:ring-primary-500 ${errors.preferred_date ? 'border-red-300' : 'border-gray-300'}`}
                      min={new Date().toISOString().split('T')[0]}
                      disabled={saveLoading}
                    />
                  </div>
                  {errors.preferred_date && <p className="text-red-600 text-xs mt-0.5">{errors.preferred_date}</p>}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Additional Information
                </h3>

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Message / Requirements</label>
                  <textarea
                    rows="4"
                    value={formData.message}
                    onChange={e => handleInputChange('message', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-primary-500 resize-none"
                    placeholder="Any specific topics you'd like to cover or questions you have..."
                    disabled={saveLoading}
                  />
                </div>

                {isAdmin && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {statusOptions.map(option => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleInputChange('status', option.value)}
                            disabled={saveLoading}
                            className={`px-2 py-1.5 text-xs font-medium rounded flex items-center justify-center gap-1.5 ${
                              formData.status === option.value
                                ? option.color + ' border border-current'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-50`}
                          >
                            {formData.status === option.value && <Icon className="w-3 h-3" />}
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div className="border-t pt-3 mt-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">What You'll Get</h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span className="text-gray-700">2 Free Demo Classes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span className="text-gray-700">Detailed Course Syllabus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span className="text-gray-700">Instructor Introduction & Q&A</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span className="text-gray-700">Course Materials Preview</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 mt-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Request Summary</h3>
                  <div className="space-y-1.5 text-xs">
                    {request && request.demo_req_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Request ID:</span>
                        <span className="font-medium">#{request.demo_req_id}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Submitted:</span>
                      <span className="font-medium">
                        {request && request.demo_req_id
                          ? new Date(request.created_at).toLocaleDateString()
                          : 'New Request'}
                      </span>
                    </div>
                    {request?.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Updated:</span>
                        <span className="font-medium">
                          {new Date(request.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {request?.status && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium px-1.5 py-0.5 rounded-full text-xs ${
                          statusOptions.find(s => s.value === request.status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusOptions.find(s => s.value === request.status)?.label || request.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 border-t bg-gray-50">
            <p className="text-xs text-gray-500">
              {request && request.demo_req_id && request.updated_at
                ? `Updated: ${new Date(request.updated_at).toLocaleDateString()}`
                : 'New demo request'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRequest}
                className="px-3 py-1.5 text-xs border border-primary-600 rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center gap-1.5 disabled:opacity-50"
                disabled={saveLoading}
              >
                <Save className="w-3 h-3" />
                {saveLoading ? 'Saving...' : isEditing ? 'Update' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Selection Modal - Only show for new demo requests when not pre-selected */}
      {!isEditing && !selectedCourse && showCourseModal && (
        <Suspense fallback={null}>
          <CourseSelectionModal
            show={showCourseModal}
            onClose={() => setShowCourseModal(false)}
            onSelect={handleCourseSelect}
            selectedCourseId={formData.course_id}
          />
        </Suspense>
      )}
    </>
  );
};

export default React.memo(DemoRequestModal);
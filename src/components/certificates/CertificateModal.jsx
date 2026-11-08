import React from 'react'

// Sample Certificate Data
export const SAMPLE_CERTIFICATE = {
  id: 'CERT-SAMPLE-2024',
  course: {
    id: 1,
    title: 'Advanced ABAP Programming and SAP Development',
    instructor: 'Prof. Akshay Shirsat',
    duration: '12 weeks',
    completedDate: '2024-01-15',
    category: 'SAP Development',
    level: 'Advanced',
    description:
      'Comprehensive course covering advanced ABAP programming concepts and SAP development techniques.',
  },
  issueDate: '2024-01-15',
  expiryDate: '2026-01-15',
  grade: 'A+',
  score: 95,
  certificateUrl: '/certificates/sample.pdf',
  verificationCode: 'CERT-SAMPLE-2024-ABAP-001',
  status: 'issued',
  progress: 100,
  thumbnail: '/images/certificate-sample.jpg',
  skills: ['ABAP Objects', 'ALV Reporting', 'SAP Fiori Integration', 'Database Optimization'],
}

const CertificateModal = React.memo(({ certificate, onClose, isSample = false }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Certificate of Completion</h3>
          {isSample && (
            <p className="text-xs text-blue-600 mt-1">
              📋 Sample Certificate - For Demonstration Only
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
          ×
        </button>
      </div>

      <div className="p-4">
        {/* Professional Certificate Design - Compact Version */}
        <div className="border border-gold rounded-lg p-4 bg-gradient-to-br from-white to-blue-50 shadow-lg">
          {/* Certificate Header */}
          <div className="text-center mb-4">
            <div className="flex justify-between items-center mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-right">
                <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  {isSample ? 'Sample' : 'Verified'}
                </div>
                <p className="text-xs text-gray-600 mt-1">ID: {certificate.id}</p>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-1 tracking-wide">
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="w-16 h-0.5 bg-gradient-to-r from-primary-500 to-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 mb-3">This is to certify that</p>
          </div>

          {/* Student Name */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-primary-600 mb-1 border-b border-primary-200 pb-1 inline-block px-4">
              Manish Rajendra Yelam
            </h2>
            <p className="text-gray-600 text-sm mt-2">has successfully completed the course</p>
          </div>

          {/* Course Details */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
              {certificate.course.title}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
              <div className="text-left">
                <p className="font-semibold text-gray-700 mb-0.5">Instructor</p>
                <p className="text-gray-600">{certificate.course.instructor}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700 mb-0.5">Completed</p>
                <p className="text-gray-600">
                  {new Date(certificate.course.completedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-700 mb-0.5">Grade</p>
                <p className="text-gray-600">
                  {certificate.grade} ({certificate.score}%)
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-700 mb-0.5">Duration</p>
                <p className="text-gray-600">{certificate.course.duration}</p>
              </div>
            </div>

            {certificate.skills && (
              <div className="mb-3">
                <p className="font-semibold text-gray-700 mb-1 text-xs">Skills Certified</p>
                <div className="flex flex-wrap justify-center gap-1">
                  {certificate.skills.slice(0, 4).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                  {certificate.skills.length > 4 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                      +{certificate.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-3">
            <div className="text-center flex-1">
              <div className="w-20 h-0.5 bg-gray-300 mb-1 mx-auto"></div>
              <p className="text-xs text-gray-600 font-semibold">Instructor</p>
              <p className="text-xs text-gray-500 mt-0.5">{certificate.course.instructor}</p>
            </div>

            <div className="text-center flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-1 border border-primary-200">
                <span className="text-primary-600 font-bold text-xs">SEAL</span>
              </div>
              <p className="text-xs text-gray-600 font-semibold">Official Seal</p>
            </div>

            <div className="text-center flex-1">
              <div className="w-20 h-0.5 bg-gray-300 mb-1 mx-auto"></div>
              <p className="text-xs text-gray-600 font-semibold">Date Issued</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(certificate.issueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Verification Section */}
          {certificate.verificationCode && (
            <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">
                  Verify at: <span className="font-semibold">verify.learningplatform.com</span>
                </p>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-xs text-gray-500">Code:</span>
                  <code className="font-mono bg-white px-2 py-0.5 rounded border border-gray-300 text-xs font-bold">
                    {certificate.verificationCode}
                  </code>
                </div>
                {isSample && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Sample for demonstration only</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
))

export default CertificateModal

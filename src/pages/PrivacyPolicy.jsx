// src/pages/PrivacyPolicy.jsx
import React, { useMemo, useRef } from 'react'
import { Shield, Lock, Eye, UserCheck, ChevronRight, ArrowUp } from 'lucide-react'

// Smooth scroll component
const SmoothScrollLink = ({ href, children, onClick }) => {
  const handleClick = e => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    const element = document.getElementById(targetId)
    if (element) {
      const offset = 80
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      })
      onClick?.()
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="flex items-center justify-between text-sm text-gray-600 hover:text-primary-600 py-2 px-3 rounded-lg hover:bg-primary-50 transition-all duration-200 group"
    >
      <span>{children}</span>
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}

// Scroll to top component
const ScrollToTop = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  )
}

// Memoized section component
const PolicySection = React.memo(({ id, icon: Icon, title, children }) => (
  <div
    id={id}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 hover:shadow-md transition-shadow duration-300"
  >
    <div className="flex items-center mb-6">
      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4 shadow-md">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    </div>
    <div className="text-gray-700 leading-relaxed text-base whitespace-pre-line">{children}</div>
  </div>
))

PolicySection.displayName = 'PolicySection'

const PrivacyPolicy = () => {
  const policySections = useMemo(
    () => [
      {
        id: 'information-collected',
        icon: Shield,
        title: 'Information We Collect',
        content: `We collect information you provide directly to us, including:

• **Personal Information**: Name, email, phone number when you register for our SAP ABAP courses
• **Payment Details**: Secure payment information for course fees and transactions
• **Communication Data**: Messages, inquiries, and feedback when you contact us
• **Technical Data**: IP address, browser type, device information, and usage analytics
• **Learning Progress**: Course progress, assessment scores, and completion data`,
      },
      {
        id: 'information-usage',
        icon: Lock,
        title: 'How We Use Your Information',
        content: `Your information helps us provide and improve our services:

• **Service Delivery**: Providing access to SAP ABAP courses and learning materials
• **Payment Processing**: Secure handling of course fees and transactions
• **Communication**: Sending important updates, course notifications, and support responses
• **Improvement**: Enhancing our curriculum and learning experience based on analytics
• **Security**: Protecting your account and preventing unauthorized access
• **Compliance**: Meeting legal obligations and regulatory requirements`,
      },
      {
        id: 'data-protection',
        icon: Eye,
        title: 'Data Protection & Security',
        content: `We implement enterprise-grade security measures:

🔒 **Encryption**: All sensitive data is encrypted in transit and at rest
🛡️ **Access Control**: Strict role-based access to personal information
🔍 **Security Audits**: Regular security assessments and vulnerability testing
🌐 **Secure Infrastructure**: Protected servers with firewall and intrusion detection
📊 **Backup Systems**: Regular encrypted backups and disaster recovery plans
👨‍💻 **Team Training**: Security awareness training for all staff members`,
      },
      {
        id: 'your-rights',
        icon: UserCheck,
        title: 'Your Rights & Choices',
        content: `You have complete control over your data:

✅ **Access Rights**: Request a copy of all personal data we hold about you
✅ **Correction Rights**: Update or correct inaccurate information
✅ **Deletion Rights**: Request deletion of your personal data
✅ **Export Rights**: Receive your data in a portable, machine-readable format
✅ **Opt-out Rights**: Unsubscribe from marketing communications
✅ **Consent Management**: Withdraw consent for data processing activities`,
      },
    ],
    []
  )

  const additionalInfo = useMemo(
    () => [
      {
        icon: '🍪',
        title: 'Cookies & Tracking',
        content:
          'We use essential cookies for website functionality and analytics cookies to improve user experience. You can control cookie preferences through your browser settings.',
      },
      {
        icon: '🤝',
        title: 'Third-Party Sharing',
        content:
          'We do not sell your personal data. We may share information with trusted service providers (payment processors, email services) only for essential business purposes.',
      },
      {
        icon: '📊',
        title: 'Data Retention',
        content:
          'We retain your personal information only as long as necessary to provide our services, comply with legal obligations, and resolve disputes.',
      },
      {
        icon: '🔄',
        title: 'Policy Updates',
        content:
          'We may update this privacy policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.',
      },
    ],
    []
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold font-display mb-6">Privacy Policy</h1>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto leading-relaxed">
              Your privacy is our priority. Learn how we protect and manage your personal
              information with transparency and care.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-8">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                  <Lock className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Quick Navigation</h3>
              </div>
              <nav className="space-y-1">
                {policySections.map((section, index) => (
                  <SmoothScrollLink key={index} href={`#${section.id}`}>
                    {section.title}
                  </SmoothScrollLink>
                ))}
                <SmoothScrollLink href="#additional-info">Additional Information</SmoothScrollLink>
                <SmoothScrollLink href="#contact">Contact Us</SmoothScrollLink>
              </nav>

              {/* Last Updated */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-gray-900">December 2023</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Last Updated Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-blue-600 text-lg">📅</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 text-lg">Policy Version 2.1</h3>
                  <p className="text-blue-700">Last updated on December 15, 2023</p>
                </div>
              </div>
            </div>

            {/* Policy Sections */}
            {policySections.map((section, index) => (
              <PolicySection key={index} id={section.id} icon={section.icon} title={section.title}>
                {section.content}
              </PolicySection>
            ))}

            {/* Additional Information */}
            <div id="additional-info" className="mt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Additional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {additionalInfo.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow duration-300 group"
                  >
                    <div className="text-2xl mb-3">{item.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-primary-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div
              id="contact"
              className="mt-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white"
            >
              <h3 className="text-2xl font-bold mb-4">Have Questions About Privacy?</h3>
              <p className="text-primary-100 mb-6 text-lg">
                We're here to help you understand how we protect your data.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Contact Our Privacy Team</h4>
                  <div className="space-y-2 text-primary-100">
                    <p>📧 support@shirsattechhub.cloud</p>
                    <p>📞 +91 9876543210</p>
                    <p>📍 Pune, India</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Response Time</h4>
                  <p className="text-primary-100">
                    We typically respond to privacy-related inquiries within 24-48 hours during
                    business days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScrollToTop />
    </div>
  )
}

export default React.memo(PrivacyPolicy)

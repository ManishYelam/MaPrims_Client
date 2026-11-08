import {
  Users as UsersIcon,
  TrendingUp as TrendingUpIcon,
  Clock,
  ShieldCheck,
  Trophy,
  ChartLine,
  Database,
  Brain,
  CodeXml,
  CloudRain,
  ChartBar,
  Shield,
  BookMarked,
  Briefcase as BriefcaseIcon,
  Calendar,
  Cpu,
  Server,
  GraduationCap,
  Target,
  Rocket,
  Heart,
  Network,
  Award,
  Video,
  Terminal,
  MessageSquare,
  FileText,
  // Services page icons
  Briefcase,
  Code,
  Users,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Building,
  GitBranch,
  Zap,
  Layers,
  Globe,
  Sparkles,
  Paperclip,
  X,
  Linkedin,
  AlertCircle,
  CheckCircle,
  BarChart3,
} from 'lucide-react'

export const STATS = [
  {
    label: 'Students Trained',
    value: '1500+',
    icon: UsersIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Across all technologies',
    trend: '+25% MoM',
  },
  {
    label: 'Success Rate',
    value: '95%',
    icon: TrendingUpIcon,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    description: 'Placement success',
    trend: '+5% YoY',
  },
  {
    label: 'Job Readiness',
    value: '3-4 Months',
    icon: Clock,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Average time to placement',
    trend: 'Fastest: 45 days',
  },
  {
    label: 'Placement Support',
    value: '100%',
    icon: ShieldCheck,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Guaranteed assistance',
    trend: '500+ companies',
  },
  {
    label: 'Course Completion',
    value: '92%',
    icon: Trophy,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Students complete courses',
    trend: '+8% above industry',
  },
  {
    label: 'Salary Hike',
    value: '80%',
    icon: ChartLine,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    description: 'Average salary increase',
    trend: 'Up to 300% recorded',
  },
]

export const COURSES_BY_CATEGORY = [
  {
    id: 1,
    category: 'SAP Technologies',
    icon: Database,
    color: 'from-blue-600 to-blue-800',
    courses: [
      'SAP ABAP (Core & Advanced)',
      'SAP Fiori & UI5 Development',
      'SAP BTP (Business Technology Platform)',
      'SAP S/4HANA',
      'SAP MM (Materials Management)',
      'SAP SD (Sales & Distribution)',
      'SAP PP (Production Planning)',
      'SAP FI/CO (Finance & Controlling)',
      'SAP Security & Authorization',
      'SAP Basis Administration',
    ],
    duration: '3-4 months',
    projects: '5+ real projects',
    certification: 'Yes',
  },
  {
    id: 2,
    category: 'AI & Machine Learning',
    icon: Brain,
    color: 'from-purple-600 to-pink-600',
    courses: [
      'Generative AI & ChatGPT',
      'Machine Learning Fundamentals',
      'Deep Learning with TensorFlow',
      'Natural Language Processing',
      'Computer Vision',
      'Prompt Engineering Mastery',
      'AI Model Deployment',
      'Reinforcement Learning',
    ],
    duration: '4-5 months',
    projects: '8+ AI projects',
    certification: 'Yes',
  },
  {
    id: 3,
    category: 'Web & Full Stack',
    icon: CodeXml,
    color: 'from-green-600 to-emerald-600',
    courses: [
      '.NET Full Stack Development',
      'MERN Stack (MongoDB, Express, React, Node)',
      'MEAN Stack Development',
      'React.js with TypeScript',
      'Angular Framework',
      'Vue.js Development',
      'Next.js & Server Components',
      'GraphQL & Apollo',
    ],
    duration: '3-4 months',
    projects: '10+ full projects',
    certification: 'Yes',
  },
  {
    id: 4,
    category: 'Cloud & DevOps',
    icon: CloudRain,
    color: 'from-orange-600 to-red-600',
    courses: [
      'Microsoft Azure Fundamentals',
      'AWS Cloud Practitioner',
      'Google Cloud Platform',
      'Docker & Containerization',
      'Kubernetes Orchestration',
      'Terraform Infrastructure',
      'Jenkins CI/CD Pipeline',
      'Ansible Automation',
    ],
    duration: '3-4 months',
    projects: '6+ cloud projects',
    certification: 'Yes',
  },
  {
    id: 5,
    category: 'Data Science',
    icon: ChartBar,
    color: 'from-indigo-600 to-purple-600',
    courses: [
      'Data Science with Python',
      'Big Data & Hadoop',
      'Apache Spark Analytics',
      'Tableau & Power BI',
      'SQL & NoSQL Databases',
      'Data Warehousing',
      'Predictive Analytics',
      'Business Intelligence',
    ],
    duration: '4-5 months',
    projects: '7+ data projects',
    certification: 'Yes',
  },
  {
    id: 6,
    category: 'Cybersecurity',
    icon: Shield,
    color: 'from-red-600 to-pink-600',
    courses: [
      'Ethical Hacking',
      'Network Security',
      'Cryptography',
      'Security Operations',
      'Vulnerability Assessment',
      'Penetration Testing',
      'Security Compliance',
      'Incident Response',
    ],
    duration: '4-5 months',
    projects: '6+ security labs',
    certification: 'Yes',
  },
]

export const FEATURES = [
  {
    id: 1,
    name: 'Industry-Curated Curriculum',
    description: 'Content updated quarterly based on industry trends and employer requirements',
    icon: BookMarked,
    color: 'from-blue-500 to-cyan-500',
    points: ['Real-time projects', 'Industry case studies', 'Latest tools & technologies'],
  },
  {
    id: 2,
    name: 'Expert Trainers with 10+ Years',
    description: 'Learn from certified professionals with extensive industry experience',
    icon: UsersIcon,
    color: 'from-green-500 to-emerald-500',
    points: ['Industry veterans', 'Multiple certifications', 'Active consultants'],
  },
  {
    id: 3,
    name: '360° Career Support',
    description: 'End-to-end career guidance from resume to interview to placement',
    icon: BriefcaseIcon,
    color: 'from-purple-500 to-pink-500',
    points: ['Resume building', 'Mock interviews', 'LinkedIn optimization'],
  },
  {
    id: 4,
    name: 'Flexible Learning Modes',
    description: 'Choose what works best for you - online, offline, or hybrid',
    icon: Calendar,
    color: 'from-orange-500 to-red-500',
    points: ['Live online classes', 'Classroom training', 'Self-paced videos'],
  },
  {
    id: 5,
    name: 'Hands-On Project Experience',
    description: 'Work on actual industry scenarios and build a strong portfolio',
    icon: Cpu,
    color: 'from-teal-500 to-green-500',
    points: ['Live projects', 'Industry scenarios', 'Portfolio development'],
  },
  {
    id: 6,
    name: '24/7 Lab Access',
    description: 'Round-the-clock access to labs and learning resources',
    icon: Server,
    color: 'from-cyan-500 to-blue-500',
    points: ['Virtual labs', 'Practice environments', 'Cloud access'],
  },
]

export const CAREER_POINTS = [
  {
    id: 1,
    title: 'Expert-Led Training',
    description:
      'Learn directly from Akshay Shirsat (5+ years SAP ABAP experience) and a team of certified professionals with 7+ years collective experience across SAP, AI, Web, and Cloud technologies',
    icon: GraduationCap,
    color: 'text-blue-500',
    stats: ['5+ years experience', '50+ certifications', '1000+ students trained'],
  },
  {
    id: 2,
    title: 'Flexible Learning Options',
    description:
      'Live online sessions with recorded videos accessible 24/7. Choose between weekday/weekend batches, fast-track or regular pace. Learn from anywhere, at your convenience',
    icon: Calendar,
    color: 'text-green-500',
    stats: ['24/7 access', 'Flexible schedules', 'Multiple batch options'],
  },
  {
    id: 3,
    title: 'Career Acceleration Program',
    description:
      'Comprehensive 1:1 mentorship, professional resume building, LinkedIn profile optimization, mock interviews with HR panels, and direct placement assistance',
    icon: TrendingUpIcon,
    color: 'text-purple-500',
    stats: ['1:1 mentorship', 'Mock interviews', 'Resume building'],
  },
  {
    id: 4,
    title: 'Real Industry Projects',
    description:
      'Hands-on experience with actual industry scenarios across SAP ABAP, SAP BTP, GenAI, .NET, Cloud, and more. Build a professional portfolio that impresses employers',
    icon: Cpu,
    color: 'text-orange-500',
    stats: ['Live projects', 'Industry scenarios', 'Portfolio development'],
  },
  {
    id: 5,
    title: 'Certification & Recognition',
    description:
      'Industry-recognized certifications, project certificates, and completion Global certification that add value to your resume and LinkedIn profile',
    icon: Award,
    color: 'text-yellow-500',
    stats: ['Industry certificates', 'Project certificates', 'Global certification'],
  },
  {
    id: 6,
    title: 'Placement Network',
    description:
      'Access to our network of 500+ hiring partners including MNCs, startups, and consulting firms with guaranteed interview calls and placement assistance',
    icon: Network,
    color: 'text-red-500',
    stats: ['500+ companies', 'Guaranteed interviews', 'Placement assistance'],
  },
]

export const LEARNING_METHODS = [
  {
    id: 1,
    title: 'Interactive Live Sessions',
    description: 'Real-time interaction with trainers, Q&A sessions, and collaborative learning',
    icon: Video,
    color: 'text-blue-500',
  },
  {
    id: 2,
    title: 'Hands-On Labs',
    description: '24/7 access to virtual labs with real industry scenarios and projects',
    icon: Terminal,
    color: 'text-green-500',
  },
  {
    id: 3,
    title: 'Project-Based Learning',
    description: 'Learn by building real projects that solve actual industry problems',
    icon: Cpu,
    color: 'text-purple-500',
  },
  {
    id: 4,
    title: 'Peer Learning',
    description: 'Collaborate with fellow students through group projects and discussions',
    icon: UsersIcon,
    color: 'text-orange-500',
  },
  {
    id: 5,
    title: 'Mentorship Sessions',
    description: 'Regular 1:1 sessions with mentors for personalized guidance',
    icon: MessageSquare,
    color: 'text-pink-500',
  },
  {
    id: 6,
    title: 'Assessment & Feedback',
    description: 'Regular assessments with detailed feedback and improvement plans',
    icon: FileText,
    color: 'text-cyan-500',
  },
]

export const serviceCategories = [
  {
    id: 1,
    title: 'Corporate Training',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
    description:
      'Upskill your workforce with customized training programs in SAP, AI, Cloud, and Web technologies. On-site, online, or hybrid delivery.',
    features: [
      'Customized curriculum',
      'Flexible scheduling',
      'Hands-on labs',
      'Certification preparation',
    ],
    price: 'Custom Quote',
  },
  {
    id: 2,
    title: 'IT Consulting',
    icon: Briefcase,
    color: 'from-purple-500 to-pink-500',
    description:
      'Expert guidance on technology adoption, digital transformation, and system optimization. Reduce costs and improve efficiency.',
    features: [
      'Technology assessment',
      'Solution architecture',
      'Implementation roadmap',
      'Post-deployment support',
    ],
    price: 'Project-based',
  },
  {
    id: 3,
    title: 'Custom Development',
    icon: Code,
    color: 'from-green-500 to-emerald-500',
    description:
      'Build scalable web applications, SAP extensions, AI models, and cloud-native solutions tailored to your business needs.',
    features: [
      'Full-stack development',
      'SAP Fiori/UI5 apps',
      'AI/ML integration',
      'Cloud migration',
    ],
    price: 'Fixed / Hourly',
  },
  {
    id: 4,
    title: 'Staffing Solutions',
    icon: Users,
    color: 'from-orange-500 to-red-500',
    description:
      'Find pre-vetted tech talent for contract, contract-to-hire, or permanent positions. Rapid onboarding with quality assurance.',
    features: [
      'Technical screening',
      'Skill assessment',
      'Onboarding support',
      'Payroll management',
    ],
    price: 'Success Fee',
  },
  {
    id: 5,
    title: 'Resume & Interview Prep',
    icon: FileText,
    color: 'from-teal-500 to-green-500',
    description:
      'Professional resume writing, LinkedIn optimization, and mock interviews with industry experts to help candidates land jobs.',
    features: [
      'ATS-friendly resume',
      'LinkedIn profile makeover',
      'Mock interviews',
      'Job search strategy',
    ],
    price: '₹2,999+',
  },
  {
    id: 6,
    title: '24/7 Technical Support',
    icon: Headphones,
    color: 'from-cyan-500 to-blue-500',
    description:
      'Round-the-clock support for your IT infrastructure, applications, and cloud systems. SLA-based guaranteed response times.',
    features: [
      'Helpdesk services',
      'System monitoring',
      'Incident management',
      'Root cause analysis',
    ],
    price: 'Monthly Retainer',
  },
]

export const whyUs = [
  {
    id: 1,
    title: '10+ Years Industry Experience',
    description: 'Proven track record with 1500+ professionals trained and 100+ clients served.',
    icon: Award,
    color: 'text-blue-500',
  },
  {
    id: 2,
    title: 'Certified Experts',
    description:
      'Team of certified SAP, Cloud, AI, and Web professionals with active industry roles.',
    icon: ShieldCheck,
    color: 'text-green-500',
  },
  {
    id: 3,
    title: 'Tailored Solutions',
    description: 'Every engagement is customized to your specific business challenges and goals.',
    icon: Target,
    color: 'text-purple-500',
  },
  {
    id: 4,
    title: 'Fast Turnaround',
    description:
      'Rapid delivery without compromising quality – typical projects delivered in 2-4 weeks.',
    icon: Rocket,
    color: 'text-orange-500',
  },
  {
    id: 5,
    title: 'Transparent Pricing',
    description: 'No hidden costs – clear, upfront pricing with flexible payment options.',
    icon: BarChart3,
    color: 'text-teal-500',
  },
  {
    id: 6,
    title: 'Post-Delivery Support',
    description: 'Free support for 30 days after project completion and ongoing maintenance plans.',
    icon: Headphones,
    color: 'text-cyan-500',
  },
]

export const processSteps = [
  {
    step: '01',
    title: 'Discovery Call',
    description: 'We understand your requirements, timeline, and budget in a free consultation.',
    icon: Phone,
  },
  {
    step: '02',
    title: 'Proposal & Quote',
    description: 'We provide a detailed proposal with scope, deliverables, timeline, and pricing.',
    icon: FileText,
  },
  {
    step: '03',
    title: 'Kickoff & Planning',
    description: 'Project kickoff with assigned team, tools setup, and sprint planning.',
    icon: Calendar,
  },
  {
    step: '04',
    title: 'Execution & QA',
    description: 'Agile development with regular demos, feedback loops, and quality assurance.',
    icon: Code,
  },
  {
    step: '05',
    title: 'Delivery & Training',
    description: 'Final delivery, user training, documentation, and handover.',
    icon: GraduationCap,
  },
  {
    step: '06',
    title: 'Support & Maintenance',
    description: 'Post-launch support, bug fixes, and continuous improvement.',
    icon: Headphones,
  },
]

export const companyAddress = {
  street: 'Office No. 302, 3rd Floor, City Vista, Fountain Road',
  area: 'Kharadi, Pune - 411014',
  city: 'Maharashtra, India',
  phone: '+91 12345 67890',
  email: 'contact@shirsattechhub.com',
  mapLink: 'https://maps.google.com/?q=Kharadi+Pune+411014',
}

const SERVICE_STATS = [
  {
    label: 'Projects Delivered',
    value: '100+',
    icon: BriefcaseIcon,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    description: 'Across all domains',
  },
  {
    label: 'Client Satisfaction',
    value: '98%',
    icon: Heart,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    description: 'Consistently rated',
  },
  {
    label: 'Support',
    value: '24/7',
    icon: Headphones,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    description: 'Round‑the‑clock help',
  },
]

// Updated image pool: IT Hub, Innovation, Training, Development, Servers
const TECH_IMAGES = [
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop', // Server room
  'https://images.unsplash.com/photo-1581092921461-39b9d66b1c62?w=600&h=400&fit=crop', // Developer working on code
  'https://images.unsplash.com/photo-1531482615717-5c6e3b1b8f0f?w=600&h=400&fit=crop', // IT training session
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop', // Team collaboration
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop', // Innovation concept
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop', // People working on laptops
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', // Data analytics
  'https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=600&h=400&fit=crop', // Cloud server technology
]
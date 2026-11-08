import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu,
  X,
  User,
  ChevronDown,
  BookOpen,
  Home,
  GraduationCap,
  Info,
  Mail,
  LayoutDashboard,
  Settings,
  LogOut,
  Sparkles,
  Briefcase,
  Newspaper,
} from 'lucide-react'
import logo from '../assets/logo-tech1.svg'
import { useAuth } from '../context/AuthContext'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuth()
  const profileRef = useRef(null)

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Base navigation items (always shown)
  const baseNavigation = [
    {
      name: 'Home',
      href: '/',
      current: location.pathname === '/',
      icon: Home,
    },
    {
      name: 'Courses',
      href: '/courses',
      current: location.pathname.startsWith('/courses'),
      icon: GraduationCap,
    },
    {
      name: 'Services',
      href: '/services',
      current: location.pathname === '/services',
      icon: Briefcase,
    },
    {
      name: 'Blog',
      href: '/blogs',
      current: location.pathname.startsWith('/blogs'),
      icon: Newspaper,
    },
    {
      name: 'About',
      href: '/about',
      current: location.pathname === '/about',
      icon: Info,
    },
    {
      name: 'Contact',
      href: '/contact',
      current: location.pathname === '/contact',
      icon: Mail,
    },
  ]

  // Dashboard navigation item (only for authenticated users)
  const dashboardNavigationItem = {
    name: 'Dashboard',
    href: '/dashboard',
    current: location.pathname.startsWith('/dashboard'),
    icon: LayoutDashboard,
  }

  // Combine navigation items based on authentication
  const navigation = isAuthenticated
    ? [baseNavigation[0], dashboardNavigationItem, ...baseNavigation.slice(1)]
    : baseNavigation

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsProfileOpen(false)
    setIsMenuOpen(false)
  }

  const userNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Manage your learning',
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
      description: 'Edit your profile',
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Account settings',
    },
  ]

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      {/* Full‑width container with responsive padding — same as other pages */}
      <nav className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-20">
        <div className="flex justify-between items-center h-14">
          {/* Logo - Compact */}
          <div className="flex items-center">
            <Link
              to="/"
              aria-label="Shirsat Tech Hub - Return to homepage"
              className="flex items-center space-x-2 p-1"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all duration-200 shadow-sm group-hover:shadow-md overflow-hidden">
                <img src={logo} alt="Shirsat Tech Hub Logo" className="w-10 h-10 object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <h1 className="text-sm font-bold text-primary-900 md:text-base">
                  Shirsat Tech Hub
                </h1>
                <p className="text-[10px] text-accent-600 md:text-xs">
                  Innovation • Technology • Future
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Compact */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map(item => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    item.current
                      ? 'text-primary-600 bg-primary-50 border border-primary-100 shadow-xs'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Desktop Actions - Compact */}
          <div className="hidden md:flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg border border-gray-200 bg-white hover:border-gray-300 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 max-w-24 truncate">
                    {user?.name}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-in fade-in-80 zoom-in-95">
                    {/* User Info */}
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-900 truncate">{user?.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-1">
                      {userNavigation.map(item => {
                        const IconComponent = item.icon
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors group"
                          >
                            <IconComponent className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500" />
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-[10px] text-gray-500">{item.description}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-1 border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors group"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-primary-600 transition-colors rounded-lg border border-transparent hover:border-gray-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-xs hover:shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button - Compact */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Enhanced */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 bg-white/95 backdrop-blur-md">
            <div className="flex flex-col space-y-1">
              {navigation.map(item => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      item.current
                        ? 'text-primary-600 bg-primary-50 border border-primary-100'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              <div className="pt-3 mt-2 border-t border-gray-100">
                {isAuthenticated ? (
                  <div className="space-y-1">
                    {/* User Info in Mobile */}
                    <div className="px-3 py-2 bg-gray-50 rounded-lg mb-2">
                      <p className="text-xs font-medium text-gray-900">{user?.name}</p>
                      <p className="text-[10px] text-gray-500">{user?.email}</p>
                    </div>

                    {userNavigation.map(item => {
                      const IconComponent = item.icon
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      )
                    })}

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-primary-600 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center space-x-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all duration-200 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Get Started</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
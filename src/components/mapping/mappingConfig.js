import { BookOpen, Building, MapPin, Calendar } from 'lucide-react'

export const MANAGER_MAPPING_CONFIG = {
  course: {
    label: 'Course',
    icon: BookOpen,
    userRole: 'manager', // only users with role = manager will be fetched
    endpoints: {
      list: '/api/manager-course-mappings',
      create: '/api/manager-course-mappings',
      update: '/api/manager-course-mappings/:id',
      delete: '/api/manager-course-mappings/:id',
    },
    tableColumns: [
      { key: 'manager_name', label: 'Manager' },
      { key: 'course_title', label: 'Course' },
      { key: 'assigned_date', label: 'Assigned Date' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { name: 'user_id', label: 'Manager', type: 'select', options: 'users' },
      { name: 'course_id', label: 'Course', type: 'select', options: 'courses' },
      { name: 'assigned_date', label: 'Assigned Date', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    itemTitleField: 'title',
  },
  branch: {
    label: 'Branch',
    icon: Building,
    userRole: 'manager',
    endpoints: {
      list: '/api/manager-branch-mappings',
      create: '/api/manager-branch-mappings',
      update: '/api/manager-branch-mappings/:id',
      delete: '/api/manager-branch-mappings/:id',
    },
    tableColumns: [
      { key: 'manager_name', label: 'Manager' },
      { key: 'branch_name', label: 'Branch' },
      { key: 'assigned_date', label: 'Assigned Date' },
      { key: 'role', label: 'Role in Branch' },
    ],
    formFields: [
      { name: 'user_id', label: 'Manager', type: 'select', options: 'users' },
      { name: 'branch_id', label: 'Branch', type: 'select', options: 'branches' },
      { name: 'assigned_date', label: 'Assigned Date', type: 'date' },
      { name: 'role', label: 'Role', type: 'text' },
    ],
    itemTitleField: 'name',
  },
  location: {
    label: 'Location',
    icon: MapPin,
    userRole: 'manager',
    endpoints: {
      list: '/api/manager-location-mappings',
      create: '/api/manager-location-mappings',
      update: '/api/manager-location-mappings/:id',
      delete: '/api/manager-location-mappings/:id',
    },
    tableColumns: [
      { key: 'manager_name', label: 'Manager' },
      { key: 'locations', label: 'Locations' }, // will show comma-separated
      { key: 'assigned_date', label: 'Assigned Date' },
    ],
    formFields: [
      { name: 'user_id', label: 'Manager', type: 'select', options: 'users' },
      {
        name: 'location_ids',
        label: 'Locations',
        type: 'select',
        options: 'locations',
        multi: true,
      },
      { name: 'assigned_date', label: 'Assigned Date', type: 'date' },
    ],
    itemTitleField: 'name',
  },
  // Add more mapping types as needed (batch, department, etc.)
}

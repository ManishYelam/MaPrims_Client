import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coursesAPI, assignmentAPI } from '../../services/api';
import {
  TbBook,
  TbCircleCheck,
  TbChevronRight,
  TbDownload,
  TbFileDescription,
  TbClock,
  TbUser,
  TbChartBar,
  TbCalendar,
  TbCode,
  TbAward,
  TbFlag,
} from 'react-icons/tb';
import { MessageCircle } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const VideoPlayer = ({ title }) => {
  return (
    <div className="bg-black rounded-xl overflow-hidden shadow-lg">
      <div className="relative pt-[56.25%]">
        <div className="absolute inset-0">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/watch?v=_Q1GHkADadc"
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <div className="p-4 bg-gray-900">
        <h3 className="text-white text-lg font-medium">{title}</h3>
        <p className="text-gray-400 text-sm mt-1">
          Sample video from YouTube - Web Development Basics
        </p>
      </div>
    </div>
  );
};

const AssignmentCard = ({ assignment, onStart, index }) => {
  const getDifficultyColor = (level) => {
    if (!level) return 'bg-gray-100 text-gray-800 border border-gray-200';
    switch (level.toLowerCase()) {
      case 'beginner':
      case 'easy':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'intermediate':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'advanced':
      case 'hard':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getAssignmentType = (type) => {
    if (!type) return 'Assignment';
    switch (type) {
      case 'coding_exercise':
      case 'coding':
        return 'Coding Exercise';
      case 'quiz':
        return 'Quiz';
      case 'project':
        return 'Project';
      case 'written':
        return 'Written Assignment';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const getStatus = (progress) => {
    if (!progress) return 'Not Started';
    if (progress.completed) return 'Completed';
    if (progress.attempts > 0) return 'In Progress';
    return 'Not Started';
  };

  const getStatusColor = (progress) => {
    if (!progress) return 'bg-gray-100 text-gray-800';
    if (progress.completed) return 'bg-green-100 text-green-800';
    if (progress.attempts > 0) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getTechnologyDisplay = (assignment) => {
    if (assignment.technology_display) return assignment.technology_display;
    if (assignment.technology_specific?.programming_language) {
      const language = assignment.technology_specific.programming_language;
      const framework = assignment.technology_specific.framework;
      return framework ? `${language} (${framework})` : language;
    }
    return 'Programming';
  };

  const getLearningObjectives = () => assignment.metadata?.learning_objectives || [];
  const getTags = () => assignment.metadata?.tags || [];
  const getEvaluationCriteria = () => assignment.evaluation_criteria?.rubric || [];
  const getInstructionsTasks = () => assignment.instructions?.tasks || [];

  const getResources = () => {
    if (assignment.resources) {
      const resources = [];
      if (assignment.resources.video_links?.length > 0)
        resources.push(`${assignment.resources.video_links.length} video(s)`);
      if (assignment.resources.reading_materials?.length > 0)
        resources.push(`${assignment.resources.reading_materials.length} reading(s)`);
      if (assignment.resources.documentation?.length > 0)
        resources.push(`${assignment.resources.documentation.length} doc(s)`);
      return resources.join(', ');
    }
    return 'No resources';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow hover:border-primary-300">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className="text-xs font-medium bg-primary-100 text-primary-800 px-2 py-0.5 rounded mr-2">
              #{assignment.sequence_order || index + 1}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                assignment.is_mandatory ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {assignment.is_mandatory ? 'Mandatory' : 'Optional'}
            </span>
            {assignment.has_prerequisites && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                Has Prerequisites
              </span>
            )}
          </div>
          <h4 className="font-bold text-gray-900 text-sm mt-2">{assignment.title}</h4>
          <p className="text-xs text-gray-600 mt-1">
            {assignment.short_description ||
              assignment.description ||
              'Complete this assignment to test your understanding of the concepts.'}
          </p>
          {assignment.module_topic && (
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <TbBook className="w-3 h-3 mr-1" />
              <span className="font-medium">Module:</span> {assignment.module_topic}
            </div>
          )}
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
            assignment.difficulty_level
          )}`}
        >
          {assignment.difficulty_level || 'Beginner'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center text-xs text-gray-500">
          <TbClock className="w-3 h-3 mr-1" />
          <span>{formatTime(assignment.estimated_time)}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <TbAward className="w-3 h-3 mr-1" />
          <span>{assignment.points || assignment.total_points || 100} points</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <TbCode className="w-3 h-3 mr-1" />
          <span>{getTechnologyDisplay(assignment)}</span>
        </div>
        <div className="flex items-center text-xs text-gray-500">
          <TbFileDescription className="w-3 h-3 mr-1" />
          <span>{getAssignmentType(assignment.assignment_type)}</span>
        </div>
      </div>

      {getLearningObjectives().length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</h5>
          <div className="flex flex-wrap gap-1">
            {getLearningObjectives()
              .slice(0, 3)
              .map((obj, idx) => (
                <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                  {obj}
                </span>
              ))}
            {getLearningObjectives().length > 3 && (
              <span className="text-xs text-gray-500">
                +{getLearningObjectives().length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {getTags().length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {getTags()
              .slice(0, 5)
              .map((tag, idx) => (
                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
          </div>
        </div>
      )}

      {getInstructionsTasks().length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Tasks:</h5>
          <ul className="text-xs text-gray-600 list-disc pl-4">
            {getInstructionsTasks()
              .slice(0, 2)
              .map((task, idx) => (
                <li key={idx} className="mb-1">
                  {task}
                </li>
              ))}
            {getInstructionsTasks().length > 2 && (
              <li className="text-gray-500">... and {getInstructionsTasks().length - 2} more tasks</li>
            )}
          </ul>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center text-xs text-gray-600">
          <TbBook className="w-3 h-3 mr-1" />
          <span>{getResources()}</span>
        </div>
      </div>

      {getEvaluationCriteria().length > 0 && (
        <div className="mb-3">
          <h5 className="text-xs font-medium text-gray-700 mb-1">Grading Rubric:</h5>
          <div className="grid grid-cols-2 gap-1">
            {getEvaluationCriteria()
              .slice(0, 2)
              .map((criteria, idx) => (
                <div key={idx} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                  {criteria.criteria} ({criteria.weight}%)
                </div>
              ))}
            {getEvaluationCriteria().length > 2 && (
              <div className="text-xs text-gray-500 col-span-2">
                +{getEvaluationCriteria().length - 2} more criteria
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-xs">
          <span className={`px-2 py-1 rounded ${getStatusColor(assignment.user_progress)}`}>
            {getStatus(assignment.user_progress)}
          </span>
          {assignment.user_progress?.best_score > 0 && (
            <span className="ml-2 text-gray-600">
              Best Score: {assignment.user_progress.best_score}%
            </span>
          )}
          {assignment.user_progress?.attempts > 0 && (
            <span className="ml-2 text-gray-600">
              Attempts: {assignment.user_progress.attempts}
            </span>
          )}
          {assignment.evaluation_criteria?.max_attempts && (
            <span className="ml-2 text-gray-600">
              Max Attempts: {assignment.evaluation_criteria.max_attempts}
            </span>
          )}
        </div>
        <button
          onClick={() => onStart(assignment.assignment_id)}
          className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
            assignment.user_progress?.completed
              ? 'bg-green-600 text-white hover:bg-green-700'
              : assignment.user_progress?.attempts > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {assignment.user_progress?.completed
            ? 'Review'
            : assignment.user_progress?.attempts > 0
            ? 'Continue'
            : 'Start Assignment'}
        </button>
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        {assignment.end_date && (
          <div className="flex items-center">
            <TbCalendar className="w-3 h-3 mr-1" />
            <span>Due: {formatDate(assignment.end_date)}</span>
          </div>
        )}
        {assignment.submission_format && (
          <div>
            <span>Format: {assignment.submission_format.replace('_', ' ')}</span>
          </div>
        )}
      </div>

      {assignment.completion_stats && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Views: {assignment.completion_stats.view_count || 0}</span>
            <span>Submissions: {assignment.completion_stats.submission_count || 0}</span>
            <span>Avg Score: {assignment.completion_stats.average_score || '0.00'}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Course Content Sidebar ----------
const CourseContentSidebar = ({
  modules,
  currentLessonId,
  onSelectLesson,
  onToggleModule,
  expandedModule,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Course Content</h3>
          <div className="animate-pulse mt-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Course Content</h3>
          <p className="text-sm text-gray-600 mt-1">No modules available</p>
        </div>
      </div>
    );
  }

  const totalTopics = modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0);
  const totalDuration = modules.reduce((sum, m) => sum + (m.topics?.length || 0) * 15, 0);

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remain = mins % 60;
    return remain > 0 ? `${hrs}h ${remain}m` : `${hrs}h`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-900">Course Content</h3>
        <div className="flex items-center text-sm text-gray-600 mt-1">
          <TbBook className="w-4 h-4 mr-1" />
          <span>{modules.length} modules</span>
          <span className="mx-2">•</span>
          <TbClock className="w-4 h-4 mr-1" />
          <span>{formatDuration(totalDuration)}</span>
          <span className="mx-2">•</span>
          <span>{totalTopics} topics</span>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {modules.map((module, moduleIndex) => {
          const topicCount = module.topics?.length || 0;
          const isExpanded = expandedModule === module.id || expandedModule === moduleIndex;

          return (
            <div key={module.id || moduleIndex} className="border-b border-gray-100 last:border-0">
              <button
                onClick={() => onToggleModule(module.id || moduleIndex)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      module.isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {module.isCompleted ? '✓' : moduleIndex + 1}
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{module.module}</h4>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <span>{topicCount} topic{topicCount !== 1 ? 's' : ''}</span>
                      <span className="mx-1">•</span>
                      <TbClock className="w-3 h-3 mr-0.5" />
                      <span>{formatDuration(topicCount * 15)}</span>
                    </div>
                  </div>
                </div>
                <TbChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {isExpanded && module.topics && (
                <div className="pb-3 px-4">
                  {module.topics.map((topic, topicIndex) => {
                    const lessonId = `${moduleIndex}-${topicIndex}`;
                    const isCurrent = currentLessonId === lessonId;

                    return (
                      <button
                        key={lessonId}
                        onClick={() => onSelectLesson(lessonId, moduleIndex, topicIndex)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg mb-1 transition-all hover:bg-gray-50 ${
                          isCurrent ? 'bg-primary-50 border border-primary-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              module.isCompleted || isCurrent
                                ? isCurrent
                                  ? 'bg-primary-100 text-primary-800'
                                  : 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {topicIndex + 1}
                          </div>
                          <div className="text-left flex-1">
                            <h5 className="font-medium text-gray-900 text-sm">{topic}</h5>
                            <div className="flex items-center text-xs text-gray-500 mt-0.5">
                              <TbClock className="w-3 h-3 mr-0.5" />
                              <span>15 mins</span>
                            </div>
                          </div>
                        </div>
                        {(module.isCompleted || isCurrent) && (
                          <TbCircleCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Main CourseLearning Component ----------
const CourseLearning = () => {
  const { course_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const userData = user?.user;

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lesson');
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [modules, setModules] = useState([]);
  const [currentLesson, setCurrentLesson] = useState({
    id: '0-0',
    title: 'Introduction to the Course',
    description: 'Welcome to the course!',
    moduleIndex: 0,
    topicIndex: 0,
    completed: false,
  });
  const [expandedModule, setExpandedModule] = useState(0);

  const transformCurriculumToModules = (curriculum) => {
    if (!curriculum || !Array.isArray(curriculum)) return [];
    return curriculum.map((item, index) => ({
      id: index,
      module: item.module,
      topics: item.topics || [],
      isCompleted: false,
      duration: `${(item.topics?.length || 0) * 15} mins`,
    }));
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        const courseResponse = await coursesAPI.getById(course_id);
        if (courseResponse.data?.success) {
          const courseData = courseResponse.data.data;
          setCourse(courseData);

          if (courseData.metadata?.curriculum) {
            const transformedModules = transformCurriculumToModules(courseData.metadata.curriculum);
            setModules(transformedModules);
            if (transformedModules.length > 0 && transformedModules[0].topics?.length > 0) {
              setCurrentLesson({
                id: '0-0',
                title: transformedModules[0].topics[0],
                description: `Starting with ${transformedModules[0].topics[0]}`,
                moduleIndex: 0,
                topicIndex: 0,
                completed: false,
              });
              setExpandedModule(0);
            }
          }

          setResources([
            { id: 1, title: 'Course Syllabus PDF', type: 'pdf', size: '2.4 MB', url: courseData.syllabus_pdf },
            { id: 2, title: 'Course Materials', type: 'zip', size: '5.2 MB', url: '#' },
            ...(courseData.metadata?.prerequisites
              ? [{ id: 3, title: 'Course Prerequisites', type: 'pdf', size: '0.5 MB', content: courseData.metadata.prerequisites.join('\n') }]
              : []),
            ...(courseData.metadata?.learning_objectives
              ? [{ id: 4, title: 'Learning Objectives', type: 'pdf', size: '0.5 MB', content: courseData.metadata.learning_objectives.join('\n') }]
              : []),
          ]);
        } else {
          throw new Error('Failed to fetch course details');
        }

        const assignmentsResponse = await assignmentAPI.getCourseAssignments(course_id);
        if (assignmentsResponse.data?.success) {
          setAssignments(assignmentsResponse.data.data || []);
        }

        if (userData?.id) {
          try {
            const enrollmentResponse = await coursesAPI.getEnrolled(userData.id, course_id);
            if (enrollmentResponse.data?.success) {
              setEnrollment(enrollmentResponse.data.data);
            }
          } catch (e) { /* no enrollment */ }
        }
      } catch (err) {
        setError('Failed to load course. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [course_id, userData?.id]);

  const handleSelectLesson = (lessonId, moduleIndex, topicIndex) => {
    if (modules[moduleIndex]?.topics?.[topicIndex]) {
      setCurrentLesson({
        id: lessonId,
        title: modules[moduleIndex].topics[topicIndex],
        description: `This topic covers ${modules[moduleIndex].topics[topicIndex]}.`,
        moduleIndex,
        topicIndex,
        moduleTitle: modules[moduleIndex].module,
        completed: false,
      });
    }
  };

  const handleToggleModule = (moduleId) => setExpandedModule(expandedModule === moduleId ? null : moduleId);
  const handleStartAssignment = (assignmentId) => navigate(`/dashboard/courses/${course_id}/assignments/${assignmentId}`);

  const handleDownloadResource = (resource) => {
    if (resource.url && resource.url !== '#') {
      window.open(resource.url, '_blank');
    } else if (resource.content) {
      const blob = new Blob([resource.content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resource.title}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      alert(`Download for ${resource.title} is not available at the moment.`);
    }
  };

  const handleMarkComplete = () => {
    setCurrentLesson((prev) => ({ ...prev, completed: true }));
    const updatedModules = [...modules];
    const currentModule = updatedModules[currentLesson.moduleIndex];
    if (currentModule && !currentModule.isCompleted) {
      currentModule.isCompleted = true;
      setModules(updatedModules);
    }
  };

  const handleNextLesson = () => {
    const currentModule = modules[currentLesson.moduleIndex];
    const nextTopicIndex = currentLesson.topicIndex + 1;
    if (nextTopicIndex < (currentModule?.topics?.length || 0)) {
      handleSelectLesson(`${currentLesson.moduleIndex}-${nextTopicIndex}`, currentLesson.moduleIndex, nextTopicIndex);
    } else if (currentLesson.moduleIndex + 1 < modules.length) {
      const nextModuleIndex = currentLesson.moduleIndex + 1;
      handleSelectLesson(`${nextModuleIndex}-0`, nextModuleIndex, 0);
      setExpandedModule(nextModuleIndex);
    }
  };

  const getCourseProgress = () => {
    if (enrollment?.progress) return enrollment.progress;
    if (modules.length > 0) {
      const completedModules = modules.filter((m) => m.isCompleted).length;
      return Math.round((completedModules / modules.length) * 100);
    }
    return 0;
  };

  const getCourseStats = () => {
    const stats = {
      progress: getCourseProgress(),
      assignments: assignments.length,
      completed: assignments.filter((a) => a.user_progress?.completed).length,
      modules: modules.length,
      topics: modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0),
      averageScore: 0,
      totalPoints: 0,
      earnedPoints: 0,
      inProgress: assignments.filter((a) => a.user_progress?.attempts > 0 && !a.user_progress?.completed).length,
      notStarted: assignments.filter((a) => !a.user_progress?.completed && a.user_progress?.attempts === 0).length,
    };

    const completedAssignments = assignments.filter((a) => a.user_progress?.completed);
    if (completedAssignments.length > 0) {
      const totalScore = completedAssignments.reduce((sum, a) => sum + (a.user_progress?.best_score || 0), 0);
      stats.averageScore = Math.round(totalScore / completedAssignments.length);
      stats.totalPoints = assignments.reduce((sum, a) => sum + (a.points || a.total_points || 0), 0);
      stats.earnedPoints = completedAssignments.reduce((sum, a) => {
        const points = a.points || a.total_points || 0;
        const score = a.user_progress?.best_score || 0;
        return sum + Math.round((points * score) / 100);
      }, 0);
    }
    return stats;
  };

  const getAssignmentsByDifficulty = () => {
    const counts = { beginner: 0, intermediate: 0, advanced: 0, other: 0 };
    assignments.forEach((a) => {
      const level = a.difficulty_level?.toLowerCase();
      if (['beginner', 'easy'].includes(level)) counts.beginner++;
      else if (['intermediate', 'medium'].includes(level)) counts.intermediate++;
      else if (['advanced', 'hard'].includes(level)) counts.advanced++;
      else counts.other++;
    });
    return counts;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TbFlag className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Course</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/dashboard/courses" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Back to Courses</Link>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TbBook className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Course Not Found</h3>
          <p className="text-gray-600 mb-4">The requested course could not be found.</p>
          <Link to="/dashboard/courses" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Browse Courses</Link>
        </div>
      </div>
    );
  }

  const courseStats = getCourseStats();
  const difficultyStats = getAssignmentsByDifficulty();
  const currentModule = modules[currentLesson.moduleIndex];

  return (
    <div className="py-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <Link to="/dashboard/courses" className="hover:text-primary-600 transition-colors">Courses</Link>
        <TbChevronRight className="w-4 h-4 mx-2" />
        <span className="font-medium text-gray-900">{course.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.short_description || course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                  <TbUser className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium">Instructor</p>
                  <p>User {course.user_id}</p>
                </div>
              </div>
              <div className="flex items-center"><TbClock className="w-4 h-4 text-gray-400 mr-1" /><span>{course.duration}</span></div>
              <div className="flex items-center"><TbCalendar className="w-4 h-4 text-gray-400 mr-1" /><span>Started {formatDate(enrollment?.enrolled_at || course.createdAt)}</span></div>
              <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{course.level}</div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">{course.mode.replace('_', ' ')}</div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1"><span className="font-medium">Your Progress</span><span>{courseStats.progress}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-primary-600 h-2 rounded-full transition-all duration-500" style={{ width: `${courseStats.progress}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{courseStats.modules} modules • {courseStats.topics} topics</span>
                <span>{courseStats.completed} of {courseStats.assignments} assignments</span>
              </div>
            </div>
          </div>

          {/* Video Player */}
          <div className="mb-6">
            <VideoPlayer
              title={`${currentModule?.module || 'Course Introduction'}: ${currentLesson.title}`}
            />
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-1 px-4" aria-label="Tabs">
                {['lesson', 'assignments', 'resources', 'notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === 'assignments' && assignments.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">{assignments.length}</span>
                    )}
                    {tab === 'resources' && resources.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">{resources.length}</span>
                    )}
                    {tab === 'lesson' && modules.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">{courseStats.topics}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4">
              {activeTab === 'lesson' && (
                <div>
                  <div className="mb-3">
                    <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                      {currentModule?.module || 'Module'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{currentLesson.title}</h3>
                  <p className="text-gray-600 mb-4">{currentLesson.description}</p>

                  {course.metadata?.learning_objectives && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-900 mb-2">Learning Objectives</h4>
                      <ul className="text-gray-700 list-disc pl-5 space-y-1">
                        {course.metadata.learning_objectives.map((obj, idx) => <li key={idx}>{obj}</li>)}
                      </ul>
                    </div>
                  )}

                  {course.metadata?.prerequisites && currentLesson.moduleIndex === 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                      <h4 className="font-bold text-gray-900 mb-2">Prerequisites</h4>
                      <ul className="text-gray-700 list-disc pl-5 space-y-1">
                        {course.metadata.prerequisites.map((pre, idx) => <li key={idx}>{pre}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 mb-2">Topic Content</h4>
                    <p className="text-gray-700">
                      This topic covers important concepts related to {currentLesson.title}. Watch the video above and refer to the course materials for detailed information.
                    </p>
                    {currentModule?.topics && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Other topics in this module:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {currentModule.topics
                            .filter((_, idx) => idx !== currentLesson.topicIndex)
                            .slice(0, 3)
                            .map((topic, idx) => <li key={idx}>• {topic}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={handleMarkComplete}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        currentLesson.completed
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {currentLesson.completed ? (
                        <><TbCircleCheck className="w-4 h-4 inline mr-2" />Topic Completed</>
                      ) : (
                        'Mark as Complete'
                      )}
                    </button>

                    <button
                      onClick={handleNextLesson}
                      disabled={
                        currentLesson.moduleIndex === modules.length - 1 &&
                        currentLesson.topicIndex === (modules[modules.length - 1]?.topics?.length || 0) - 1
                      }
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                        currentLesson.moduleIndex === modules.length - 1 &&
                        currentLesson.topicIndex === (modules[modules.length - 1]?.topics?.length || 0) - 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      Next Topic <TbChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'assignments' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Course Assignments</h3>
                    <div className="text-sm text-gray-600">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''} • {courseStats.completed} completed</div>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TbFileDescription className="w-8 h-8 text-gray-600" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h4>
                      <p className="text-gray-600">Assignments will be added to this course soon.</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg"><div className="text-sm text-blue-700 mb-1">Total Assignments</div><div className="text-2xl font-bold text-blue-900">{courseStats.assignments}</div></div>
                        <div className="bg-green-50 p-3 rounded-lg"><div className="text-sm text-green-700 mb-1">Completed</div><div className="text-2xl font-bold text-green-900">{courseStats.completed}</div></div>
                        <div className="bg-yellow-50 p-3 rounded-lg"><div className="text-sm text-yellow-700 mb-1">In Progress</div><div className="text-2xl font-bold text-yellow-900">{courseStats.inProgress}</div></div>
                        <div className="bg-purple-50 p-3 rounded-lg"><div className="text-sm text-purple-700 mb-1">Not Started</div><div className="text-2xl font-bold text-purple-900">{courseStats.notStarted}</div></div>
                      </div>

                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Difficulty Distribution</h4>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${(difficultyStats.beginner / assignments.length) * 100}%` }}></div></div>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-yellow-500" style={{ width: `${(difficultyStats.intermediate / assignments.length) * 100}%` }}></div></div>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${(difficultyStats.advanced / assignments.length) * 100}%` }}></div></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1"><span>Beginner: {difficultyStats.beginner}</span><span>Intermediate: {difficultyStats.intermediate}</span><span>Advanced: {difficultyStats.advanced}</span></div>
                      </div>

                      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
                        <button className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded whitespace-nowrap">All Assignments</button>
                        <button className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 whitespace-nowrap">Not Started ({courseStats.notStarted})</button>
                        <button className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 whitespace-nowrap">In Progress ({courseStats.inProgress})</button>
                        <button className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 whitespace-nowrap">Completed ({courseStats.completed})</button>
                        <button className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 whitespace-nowrap">Mandatory ({assignments.filter(a => a.is_mandatory).length})</button>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-gray-600">Showing {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</div>
                        <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                          <option>Sort by: Sequence</option><option>Sort by: Difficulty</option><option>Sort by: Due Date</option><option>Sort by: Points</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        {assignments.map((assignment, index) => (
                          <AssignmentCard
                            key={assignment.assignment_id}
                            assignment={assignment}
                            onStart={handleStartAssignment}
                            index={index}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'resources' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Learning Resources</h3>
                  <div className="space-y-3">
                    {resources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <TbFileDescription className="w-5 h-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{resource.title}</h4>
                            <p className="text-sm text-gray-500">{resource.size}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDownloadResource(resource)} className="p-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors" title="Download">
                          <TbDownload className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Your Notes</h3>
                  <textarea
                    className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add your personal notes for this lesson..."
                    defaultValue=""
                  />
                  <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">Save Notes</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Right Column */}
        <div className="lg:col-span-1 space-y-6">
          <CourseContentSidebar
            modules={modules}
            currentLessonId={currentLesson.id}
            onSelectLesson={handleSelectLesson}
            onToggleModule={handleToggleModule}
            expandedModule={expandedModule}
            isLoading={loading}
          />

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => setActiveTab('assignments')} className="flex items-center w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                <TbFileDescription className="w-4 h-4 mr-3 text-gray-400" /> View Assignments ({assignments.length})
              </button>
              <Link to={`/dashboard/courses/${course_id}`} className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <TbBook className="w-4 h-4 mr-3 text-gray-400" /> Course Details
              </Link>
              <Link to="/dashboard/progress" className="flex items-center p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <TbChartBar className="w-4 h-4 mr-3 text-gray-400" /> View Progress
              </Link>
              <button onClick={() => navigate('/dashboard/support')} className="flex items-center w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                <MessageCircle className="w-4 h-4 mr-3 text-gray-400" /> Get Help
              </button>
            </div>
          </div>

          {/* Course Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-900 mb-3">Course Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Progress</span><span className="font-medium">{courseStats.progress}%</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Modules</span><span className="font-medium">{courseStats.modules}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Topics</span><span className="font-medium">{courseStats.topics}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Assignments</span><span className="font-medium">{courseStats.assignments}</span></div>
              <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Completed</span><span className="font-medium">{courseStats.completed}/{courseStats.assignments}</span></div>
              {courseStats.averageScore > 0 && (
                <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Average Score</span><span className="font-medium">{courseStats.averageScore}%</span></div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          {assignments.filter(a => !a.user_progress?.completed && a.end_date).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">Upcoming Deadlines</h3>
              <div className="space-y-3">
                {assignments
                  .filter(a => !a.user_progress?.completed && a.end_date)
                  .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
                  .slice(0, 3)
                  .map(assignment => (
                    <div key={assignment.assignment_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{assignment.title}</h4>
                        <p className="text-xs text-gray-500">{formatDate(assignment.end_date)}</p>
                      </div>
                      <button onClick={() => handleStartAssignment(assignment.assignment_id)} className="ml-2 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 whitespace-nowrap">
                        {assignment.user_progress?.attempts > 0 ? 'Continue' : 'Start'}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Assignment Types */}
          {assignments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-bold text-gray-900 mb-3">Assignment Types</h3>
              <div className="space-y-2">
                {Array.from(new Set(assignments.map(a => a.assignment_type))).map(type => {
                  const count = assignments.filter(a => a.assignment_type === type).length;
                  const getTypeName = (t) => {
                    switch (t) {
                      case 'coding_exercise': return 'Coding Exercises';
                      case 'quiz': return 'Quizzes';
                      case 'project': return 'Projects';
                      default: return t?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Assignments';
                    }
                  };
                  return (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{getTypeName(type)}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLearning;
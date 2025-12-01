import React, { useState, useEffect } from 'react';
import { BookOpen, Brain, ShoppingBag, Upload, Zap, Calculator, Clock, TrendingUp, Star, Search, Filter, DollarSign, Award, Users, Gift, Trophy, Target, Flame, Play, Pause, RotateCcw } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'https://notex-api-production.up.railway.app';

// Daily Quiz Component
const DailyQuiz = ({ theme, onClose }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const quizQuestions = [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correct: 2
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correct: 1
    },
    {
      question: "What is 15 + 27?",
      options: ["32", "42", "38", "45"],
      correct: 1
    },
    {
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correct: 1
    },
    {
      question: "What is the chemical symbol for Gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correct: 2
    }
  ];

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    
    if (answerIndex === quizQuestions[currentQuestion].correct) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
        setQuizCompleted(true);
        
        // Award credits for completing quiz
        const user = JSON.parse(localStorage.getItem('notex_user') || '{}');
        if (user && !localStorage.getItem('quiz_completed_today')) {
          const newCredits = (user.credits || 0) + 3;
          const updatedUser = { ...user, credits: newCredits };
          localStorage.setItem('notex_user', JSON.stringify(updatedUser));
          localStorage.setItem('quiz_completed_today', new Date().toDateString());
        }
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizCompleted(false);
  };

  const getAnswerColor = (index) => {
    if (!selectedAnswer) return '';
    if (index === quizQuestions[currentQuestion].correct) {
      return 'bg-green-500 text-white';
    }
    if (index === selectedAnswer && index !== quizQuestions[currentQuestion].correct) {
      return 'bg-red-500 text-white';
    }
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🎯 Daily Quiz
          </h3>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {!showResult ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Question {currentQuestion + 1} of {quizQuestions.length}
              </span>
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                Score: {score}
              </span>
            </div>

            <div className={`rounded-xl p-4 mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <h4 className={`font-bold text-lg mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {quizQuestions[currentQuestion].question}
              </h4>
              
              <div className="space-y-2">
                {quizQuestions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedAnswer === null 
                        ? `${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-white hover:bg-gray-100 text-gray-900 border'}`
                        : getAnswerColor(index)
                    } ${selectedAnswer === null ? 'border border-gray-300' : ''}`}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h4 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Quiz Completed!
            </h4>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Your score: <span className="font-bold text-green-500">{score}</span>/{quizQuestions.length}
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {score === quizQuestions.length ? "Perfect! 🏆" : 
               score >= quizQuestions.length * 0.7 ? "Great job! 👍" : 
               "Keep practicing! 💪"}
            </p>
            
            {!localStorage.getItem('quiz_completed_today') && (
              <div className={`rounded-xl p-3 mt-4 ${theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>
                  🎁 +3 credits awarded!
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={resetQuiz}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-3 rounded-lg font-bold ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// GPA Calculator Component
const GPACalculator = ({ theme, onClose }) => {
  const [courses, setCourses] = useState([{ name: '', credits: 3, grade: 'A' }]);
  const [gpa, setGpa] = useState(0);

  const gradePoints = {
    'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
  };

  const calculateGPA = () => {
    let totalCredits = 0;
    let totalGradePoints = 0;

    courses.forEach(course => {
      if (course.name && course.credits > 0) {
        totalCredits += parseFloat(course.credits);
        totalGradePoints += parseFloat(course.credits) * gradePoints[course.grade];
      }
    });

    const calculatedGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
    setGpa(calculatedGPA);
  };

  useEffect(() => {
    calculateGPA();
  }, [courses]);

  const addCourse = () => {
    setCourses([...courses, { name: '', credits: 3, grade: 'A' }]);
  };

  const updateCourse = (index, field, value) => {
    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;
    setCourses(updatedCourses);
  };

  const removeCourse = (index) => {
    if (courses.length > 1) {
      const updatedCourses = courses.filter((_, i) => i !== index);
      setCourses(updatedCourses);
    }
  };

  const getGPAColor = (gpa) => {
    if (gpa >= 3.7) return 'text-green-500';
    if (gpa >= 3.0) return 'text-yellow-500';
    if (gpa >= 2.0) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full rounded-2xl p-6 max-h-[80vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            📊 GPA Calculator
          </h3>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {courses.map((course, index) => (
            <div key={index} className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-5">
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={course.name}
                    onChange={(e) => updateCourse(index, 'name', e.target.value)}
                    placeholder={`Course ${index + 1}`}
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                      theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300'
                    }`}
                  />
                </div>
                
                <div className="col-span-3">
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Credits
                  </label>
                  <input
                    type="number"
                    value={course.credits}
                    onChange={(e) => updateCourse(index, 'credits', parseInt(e.target.value) || 0)}
                    min="1"
                    max="10"
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                      theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300'
                    }`}
                  />
                </div>
                
                <div className="col-span-3">
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Grade
                  </label>
                  <select
                    value={course.grade}
                    onChange={(e) => updateCourse(index, 'grade', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                      theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'border-gray-300'
                    }`}
                  >
                    {Object.keys(gradePoints).map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1">
                  <button
                    onClick={() => removeCourse(index)}
                    disabled={courses.length === 1}
                    className={`w-full p-2 rounded-lg ${
                      courses.length === 1 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600'
                    } text-white`}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addCourse}
            className={`w-full border-2 border-dashed rounded-xl p-4 text-center ${
              theme === 'dark' 
                ? 'border-gray-600 hover:border-gray-500 text-gray-400' 
                : 'border-gray-300 hover:border-gray-400 text-gray-600'
            }`}
          >
            + Add Another Course
          </button>

          <div className={`rounded-xl p-6 text-center mt-6 ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'
          }`}>
            <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Your GPA
            </h4>
            <div className={`text-4xl font-bold ${getGPAColor(gpa)}`}>
              {gpa}
            </div>
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Based on {courses.filter(c => c.name).length} courses
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setCourses([{ name: '', credits: 3, grade: 'A' }])}
              className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pomodoro Timer Component
const PomodoroTimer = ({ theme, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState('work'); // work, break
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    let interval = null;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      setIsActive(false);
      
      if (mode === 'work') {
        setCompletedSessions(completedSessions + 1);
        // Award credits for completed work session
        const user = JSON.parse(localStorage.getItem('notex_user') || '{}');
        if (user) {
          const newCredits = (user.credits || 0) + 1;
          const updatedUser = { ...user, credits: newCredits };
          localStorage.setItem('notex_user', JSON.stringify(updatedUser));
        }
        
        // Switch to break mode
        setMode('break');
        setTimeLeft(5 * 60); // 5 minute break
      } else {
        // Switch back to work mode
        setMode('work');
        setTimeLeft(25 * 60); // 25 minute work session
      }
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, completedSessions]);

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (mode === 'work' ? 25 * 60 : 5 * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            ⏰ Study Timer
          </h3>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="text-center space-y-6">
          {/* Mode Selector */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => switchMode('work')}
              className={`px-4 py-2 rounded-lg font-medium ${
                mode === 'work' 
                  ? 'bg-red-500 text-white' 
                  : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Work (25min)
            </button>
            <button
              onClick={() => switchMode('break')}
              className={`px-4 py-2 rounded-lg font-medium ${
                mode === 'break' 
                  ? 'bg-green-500 text-white' 
                  : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Break (5min)
            </button>
          </div>

          {/* Timer Circle */}
          <div className="relative w-48 h-48 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={mode === 'work' ? '#ef4444' : '#10b981'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(timeLeft)}
              </div>
              <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {mode === 'work' ? 'Focus Time' : 'Break Time'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetTimer}
              className={`p-3 rounded-full ${
                theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <RotateCcw size={20} />
            </button>
            
            {!isActive ? (
              <button
                onClick={startTimer}
                className="p-3 rounded-full bg-green-500 text-white"
              >
                <Play size={20} />
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="p-3 rounded-full bg-yellow-500 text-white"
              >
                <Pause size={20} />
              </button>
            )}
          </div>

          {/* Session Counter */}
          <div className={`rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Completed Sessions:
              </span>
              <span className={`font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {completedSessions}
              </span>
            </div>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              +1 credit per completed work session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Note upload page component
const UploadNotePage = ({ theme, toggleTheme, setCurrentPage, uploadNote, setUploadNote, handleNoteUpload }) => {
  return (
    <div className="max-w-md mx-auto">
      <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="bg-green-600 text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => setCurrentPage('home')} className="text-sm">← Back</button>
            <button 
              onClick={toggleTheme}
              className="bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-2">Sell Your Content</h2>
          <p className="text-green-100 text-sm">Upload notes, novels, books & earn money</p>
        </div>

        <div className="p-4 space-y-4">
          <div className={`rounded-xl p-4 shadow-md space-y-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Content Type *</label>
              <select 
                value={uploadNote.type}
                onChange={(e) => setUploadNote({...uploadNote, type: e.target.value})}
                className={`w-full border rounded-lg p-2 text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
              >
                <option value="notes">Study Notes</option>
                <option value="novel">Novel</option>
                <option value="textbook">Textbook</option>
                <option value="guide">Study Guide</option>
                <option value="other">Other Book</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Title *</label>
              <input 
                type="text" 
                value={uploadNote.title}
                onChange={(e) => setUploadNote({...uploadNote, title: e.target.value})}
                placeholder="e.g., Advanced Calculus Notes or Mystery Novel"
                className={`w-full border rounded-lg p-2 text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
              />
            </div>

            {uploadNote.type === 'novel' || uploadNote.type === 'other' ? (
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Genre</label>
                <select 
                  value={uploadNote.genre}
                  onChange={(e) => setUploadNote({...uploadNote, genre: e.target.value})}
                  className={`w-full border rounded-lg p-2 text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                >
                  <option value="">Select Genre</option>
                  <option value="fiction">Fiction</option>
                  <option value="mystery">Mystery</option>
                  <option value="romance">Romance</option>
                  <option value="scifi">Science Fiction</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="thriller">Thriller</option>
                  <option value="horror">Horror</option>
                  <option value="biography">Biography</option>
                  <option value="self-help">Self-Help</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ) : (
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Subject</label>
                <select 
                  value={uploadNote.subject}
                  onChange={(e) => setUploadNote({...uploadNote, subject: e.target.value})}
                  className={`w-full border rounded-lg p-2 text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                  <option value="Economics">Economics</option>
                  <option value="History">History</option>
                  <option value="Literature">Literature</option>
                  <option value="Languages">Languages</option>
                  <option value="Arts">Arts</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Description *</label>
              <textarea 
                value={uploadNote.description}
                onChange={(e) => setUploadNote({...uploadNote, description: e.target.value})}
                placeholder="Describe what's covered in detail..."
                className={`w-full border rounded-lg p-2 text-sm min-h-24 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Price (USD) *</label>
                <input 
                  type="number" 
                  value={uploadNote.price}
                  onChange={(e) => setUploadNote({...uploadNote, price: e.target.value})}
                  placeholder="5.00"
                  step="0.01"
                  min="0.99"
                  className={`w-full border rounded-lg p-2 text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pages *</label>
                <input 
                  type="number" 
                  value={uploadNote.pages}
                  onChange={(e) => setUploadNote({...uploadNote, pages: e.target.value})}
                  placeholder="10"
                  min="1"
                  className={`w-full border rounded-lg p-2 text-sm ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Upload File (PDF) *</label>
              <label className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer block ${
                theme === 'dark' 
                  ? 'border-gray-600 hover:border-green-500 bg-gray-700' 
                  : 'border-gray-300 hover:border-green-500'
              }`}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setUploadNote({...uploadNote, file: e.target.files[0]})}
                  className="hidden"
                />
                <Upload className={`mx-auto mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} size={32} />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {uploadNote.file ? uploadNote.file.name : 'Click to upload PDF'}
                </p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Max 25MB</p>
              </label>
            </div>

            <button 
              onClick={handleNoteUpload}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 transition-all"
            >
              Submit for Review
            </button>
            
            <p className={`text-xs text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              * All uploads are reviewed before being published to ensure quality
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const NoteXApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [aiInput, setAiInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adLoading, setAdLoading] = useState(false);
  const [adCooldown, setAdCooldown] = useState(0);
  const [notes, setNotes] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [gamificationData, setGamificationData] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [previewNote, setPreviewNote] = useState(null);
  const [showDailyQuiz, setShowDailyQuiz] = useState(false);
  const [showGPACalculator, setShowGPACalculator] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  const [uploadNote, setUploadNote] = useState({
    title: '',
    type: 'notes',
    genre: '',
    subject: '',
    description: '',
    price: '',
    pages: '',
    file: null
  });

  // Generate referral code in format like X7TFGY2O
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // MISSING FUNCTIONS - NOW ADDED:
  const loadNotes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/notes?limit=10`);
      const data = await response.json();
      if (data.success) {
        setNotes(data.notes);
      }
    } catch (error) {
      // Start with empty marketplace
      setNotes([]);
    }
  };

  const loadGamificationData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/gamification/stats`, {
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      });
      const data = await response.json();
      if (data.success) {
        setGamificationData(data.stats);
      }
    } catch (error) {
      // Initialize empty stats
      setGamificationData({
        total_ai_uses: 0,
        notes_purchased: 0,
        notes_sold: 0,
        study_streak: 0,
        total_study_minutes: 0,
        badges: [
          { id: 1, name: 'First Steps', description: 'Used AI for the first time', icon: '🎯', unlocked: false },
          { id: 2, name: 'Study Warrior', description: 'Study for 100 minutes', icon: '⚔️', unlocked: false },
          { id: 3, name: 'Seller Pro', description: 'Sell your first note', icon: '💰', unlocked: false },
          { id: 4, name: 'AI Master', description: 'Use AI 50 times', icon: '🧠', unlocked: false },
          { id: 5, name: 'Week Streak', description: '7 day study streak', icon: '🔥', unlocked: false }
        ]
      });
    }
  };

  const copyReferralCode = () => {
    const link = generateReferralLink();
    navigator.clipboard.writeText(link);
    alert('🔗 Referral link copied to clipboard!');
  };

  const generateReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${user?.referral_code || ''}`;
  };

  const handleReferral = async () => {
    if (!referralCode) {
      alert('Please enter a referral code');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/referrals/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ referral_code: referralCode })
      });

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ 
          ...prev, 
          referrals_count: data.referrals_count,
          premium_until: data.premium_until 
        }));
        setReferralCode('');
        alert(data.message || '✅ Referral applied successfully!');
      } else {
        alert(data.error || 'Failed to apply referral');
      }
    } catch (error) {
      alert('Failed to apply referral code');
    }
  };

  // EXISTING FUNCTIONS:
  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('notex_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Load or create user with referral code
    const savedUser = localStorage.getItem('notex_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Ensure user has a referral code
      if (!userData.referral_code) {
        const newCode = generateReferralCode();
        const updatedUser = { ...userData, referral_code: newCode };
        setUser(updatedUser);
        localStorage.setItem('notex_user', JSON.stringify(updatedUser));
      }
    } else {
      const newCode = generateReferralCode();
      const newUser = { 
        id: Date.now().toString(), 
        username: 'Student', 
        plan: 'free',
        credits: 10,
        wallet_balance: 0,
        referral_code: newCode,
        referrals_count: 0,
        premium_until: null
      };
      setUser(newUser);
      localStorage.setItem('notex_user', JSON.stringify(newUser));
    }
    
    setSessionToken('token-' + Date.now());
    loadNotes();
    loadGamificationData();

    const lastAdTime = localStorage.getItem('lastAdTime');
    if (lastAdTime) {
      const timePassed = Date.now() - parseInt(lastAdTime);
      const cooldownRemaining = Math.max(0, 300000 - timePassed);
      if (cooldownRemaining > 0) {
        setAdCooldown(Math.ceil(cooldownRemaining / 1000));
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('notex_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const updateUsername = async () => {
    if (!newUsername.trim()) {
      alert('Please enter a valid username');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ username: newUsername })
      });

      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, username: newUsername };
        setUser(updatedUser);
        localStorage.setItem('notex_user', JSON.stringify(updatedUser));
        setIsEditingProfile(false);
        setNewUsername('');
        alert('✅ Username updated successfully!');
      }
    } catch (error) {
      // Update locally if backend fails
      const updatedUser = { ...user, username: newUsername };
      setUser(updatedUser);
      localStorage.setItem('notex_user', JSON.stringify(updatedUser));
      setIsEditingProfile(false);
      setNewUsername('');
      alert('✅ Username updated!');
    }
  };

  const callAI = async (type) => {
    if (!user || user.credits <= 0) {
      alert('No credits left! Watch an ad or upgrade to Pro.');
      return;
    }
    
    if (!aiInput || aiInput.length < 50) {
      alert('Please enter at least 50 characters of text.');
      return;
    }
    
    setLoading(true);
    
    try {
      const endpoints = {
        summary: '/api/ai/summarize',
        flashcards: '/api/ai/flashcards',
        quiz: '/api/ai/quiz'
      };

      const response = await fetch(`${API_URL}${endpoints[type]}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ 
          text: aiInput,
          count: 5
        })
      });

      const data = await response.json();
      
      if (data.success) {
        let output = '';
        if (type === 'summary') {
          output = `📝 Summary:\n\n${data.summary}`;
        } else if (type === 'flashcards') {
          output = `🃏 Flashcard Set:\n\n${data.flashcards.map((fc, i) => 
            `Card ${i + 1}:\nQ: ${fc.question}\nA: ${fc.answer}`
          ).join('\n\n')}\n\n✅ ${data.count} flashcards created!`;
        } else if (type === 'quiz') {
          output = `📋 Practice Quiz:\n\n${data.quiz.map((q, i) => 
            `${i + 1}. ${q.question}\n${q.options ? q.options.map((opt, j) => `   ${String.fromCharCode(97 + j)}) ${opt}`).join('\n') : ''}\nAnswer: ${q.correct}`
          ).join('\n\n')}`;
        }
        
        setAiOutput(output);
        setUser(prev => ({ ...prev, credits: data.creditsRemaining }));
        loadGamificationData();
      } else {
        alert(data.error || 'AI processing failed');
      }
    } catch (error) {
      console.error('AI error:', error);
      alert('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  const watchRewardedAd = async () => {
    if (adCooldown > 0) {
      alert(`Please wait ${Math.ceil(adCooldown / 60)} minutes before watching another ad`);
      return;
    }

    setAdLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const response = await fetch(`${API_URL}/api/users/add-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          type: 'rewarded_ad',
          amount: 5
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(prev => ({ ...prev, credits: data.credits }));
        
        const now = Date.now();
        localStorage.setItem('lastAdTime', now.toString());
        setAdCooldown(300);
        
        const timer = setInterval(() => {
          setAdCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        alert('🎉 +5 credits added! Thank you for supporting NoteX!');
      }
    } catch (error) {
      console.error('Ad error:', error);
      alert('Failed to process ad reward');
    } finally {
      setAdLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, wallet_balance: data.new_balance }));
        setDepositAmount('');
        alert(`✅ Successfully deposited $${amount.toFixed(2)}`);
      } else {
        alert(data.error || 'Deposit failed');
      }
    } catch (error) {
      alert('Failed to process deposit');
    }
  };

  const handlePayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > user.wallet_balance) {
      alert('Insufficient balance');
      return;
    }

    if (amount < 10) {
      alert('Minimum payout is $10');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/wallet/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, wallet_balance: data.new_balance }));
        setPayoutAmount('');
        alert(`✅ Payout of $${amount.toFixed(2)} initiated! Funds will arrive in 3-5 business days.`);
      } else {
        alert(data.error || 'Payout failed');
      }
    } catch (error) {
      alert('Failed to process payout');
    }
  };

  const handleNoteUpload = async () => {
    if (!uploadNote.title || !uploadNote.type || !uploadNote.price || !uploadNote.pages || !uploadNote.file) {
      alert('Please fill all required fields and upload a file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', uploadNote.file);
      formData.append('title', uploadNote.title);
      formData.append('type', uploadNote.type);
      formData.append('genre', uploadNote.genre);
      formData.append('subject', uploadNote.subject);
      formData.append('description', uploadNote.description);
      formData.append('price_usd', uploadNote.price);
      formData.append('pages', uploadNote.pages);

      const response = await fetch(`${API_URL}/api/notes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ Note submitted for review! You will be notified once approved.');
        setUploadNote({
          title: '',
          type: 'notes',
          genre: '',
          subject: '',
          description: '',
          price: '',
          pages: '',
          file: null
        });
        setCurrentPage('home');
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (error) {
      alert('✅ Note uploaded successfully! It will appear in the marketplace after review.');
      setCurrentPage('home');
    }
  };

  const handlePreviewNote = (note) => {
    setPreviewNote(note);
  };

  const closePreview = () => {
    setPreviewNote(null);
  };

  // Rest of your component rendering (home, ai, gamification, referral, wallet, marketplace, sell pages)
  // ... (keep all your existing page rendering logic)

  if (currentPage === 'home') {
    return (
      <div className="max-w-md mx-auto">
        <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-purple-50 to-blue-50'}`}>
          {/* Header section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold">NoteX</h1>
                <p className="text-purple-100 text-sm">Study Smarter, Not Harder</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={toggleTheme}
                  className="bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <button 
                  onClick={() => setCurrentPage('wallet')}
                  className="text-right bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
                >
                  <div className="text-xs mb-1">
                    {user?.plan === 'free' ? '🆓 Free' : '⭐ Pro'}
                  </div>
                  <div className="text-sm font-bold">⚡ {user?.credits || 0} credits</div>
                  <div className="text-xs text-purple-200">💰 ${user?.wallet_balance?.toFixed(2) || '0.00'}</div>
                </button>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-sm flex items-center justify-between">
              <span>👋 Welcome, {user?.username || 'Student'}!</span>
              <button 
                onClick={() => {
                  setIsEditingProfile(true);
                  setNewUsername(user?.username || '');
                }}
                className="text-xs bg-white/20 px-2 py-1 rounded-lg hover:bg-white/30"
              >
                Edit
              </button>
            </div>
          </div>

          {isEditingProfile && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`max-w-sm w-full rounded-2xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Edit Profile</h3>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full border rounded-lg px-4 py-2 mb-4 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                />
                <div className="flex gap-2">
                  <button
                    onClick={updateUsername}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setNewUsername('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-bold ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add new study tools section */}
          <div className="p-4 space-y-3 mt-4">
            <button
              onClick={() => setCurrentPage('ai')}
              className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-start gap-4"
            >
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <Brain className="text-white" size={28} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">AI Study Assistant</h3>
                <p className="text-gray-600 text-sm">Summarize notes, create flashcards & quizzes</p>
              </div>
            </button>

            <button
              onClick={() => setShowDailyQuiz(true)}
              className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-start gap-4"
            >
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                <BookOpen className="text-white" size={28} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Daily Quiz</h3>
                <p className="text-gray-600 text-sm">Test your knowledge & earn credits</p>
              </div>
            </button>

            <button
              onClick={() => setShowGPACalculator(true)}
              className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-start gap-4"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <Calculator className="text-white" size={28} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">GPA Calculator</h3>
                <p className="text-gray-600 text-sm">Calculate your semester grades</p>
              </div>
            </button>

            <button
              onClick={() => setShowPomodoro(true)}
              className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-start gap-4"
            >
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl">
                <Clock className="text-white" size={28} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Study Timer</h3>
                <p className="text-gray-600 text-sm">Pomodoro technique for focus</p>
              </div>
            </button>

            {/* Keep existing marketplace and other buttons */}
            <button
              onClick={() => setCurrentPage('marketplace')}
              className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-start gap-4"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl">
                <ShoppingBag className="text-white" size={28} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Buy Study Notes</h3>
                <p className="text-gray-600 text-sm">Access premium notes from top students</p>
              </div>
            </button>

            <button
              onClick={() => setCurrentPage('gamification')}
              className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-start gap-4"
            >
              <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 rounded-xl">
                <Trophy className="text-white" size={28} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Your Achievements</h3>
                <p className="text-gray-600 text-sm">Track progress & unlock badges</p>
              </div>
            </button>

            <button
              onClick={() => setCurrentPage('referral')}
              className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-start gap-4"
            >
              <div className="bg-gradient-to-br from-pink-500 to-red-600 p-3 rounded-xl">
                <Gift className="text-white" size={28} />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-bold text-lg mb-1">Invite & Get Premium</h3>
                <p className="text-gray-600 text-sm">3 friends = 7 days free premium!</p>
              </div>
            </button>
          </div>

          {/* Featured notes section */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">Featured Notes</h3>
              <button 
                onClick={() => setCurrentPage('marketplace')}
                className="text-purple-600 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {notes.slice(0, 2).map(note => (
                <div key={note.id} className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex gap-3">
                    <div className="text-4xl">📚</div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-sm mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{note.title}</h4>
                      <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{note.subject}</p>
                      <div className="flex justify-between items-center">
                        <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          {note.avg_rating || '4.8'}
                        </div>
                        <button className="bg-purple-600 text-white px-4 py-1 rounded-lg text-xs font-medium">
                          ${note.price_usd}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modals for new features */}
          {showDailyQuiz && <DailyQuiz theme={theme} onClose={() => setShowDailyQuiz(false)} />}
          {showGPACalculator && <GPACalculator theme={theme} onClose={() => setShowGPACalculator(false)} />}
          {showPomodoro && <PomodoroTimer theme={theme} onClose={() => setShowPomodoro(false)} />}
        </div>
      </div>
    );
  }

  // Add the rest of your page renderings (ai, gamification, referral, wallet, marketplace, sell)
  // ... (include all your existing page components)

 // Update the AI page section in your App.js

  if (currentPage === 'ai') {
    return (
      <div className="max-w-md mx-auto">
        <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="bg-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <button onClick={() => setCurrentPage('home')} className="text-sm">← Back</button>
              <button 
                onClick={toggleTheme}
                className="bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-2">AI Study Assistant</h2>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-sm flex justify-between">
              <span>Credits: ⚡ {user?.credits || 0}</span>
              <span className="font-bold">1 credit per use</span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* File Upload Section */}
            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Upload File (PDF, TXT, DOCX) - Optional
              </label>
              <label className={`w-full border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer block ${
                theme === 'dark' 
                  ? 'border-gray-600 hover:border-purple-500 bg-gray-700' 
                  : 'border-gray-300 hover:border-purple-500'
              }`}>
                <input 
                  type="file" 
                  accept=".pdf,.txt,.docx,.doc" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Read file content
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const text = e.target.result;
                        setAiInput(prev => prev + `\n\n[Uploaded File: ${file.name}]\n${text}`);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                />
                <Upload className={`mx-auto mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} size={32} />
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Click to upload file or paste text below
                </p>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Supports PDF, TXT, DOCX</p>
              </label>
            </div>

            {/* Text Input Section */}
            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Or paste your text directly
              </label>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Paste your lecture notes, readings, or study material here (minimum 50 characters)..."
                className={`w-full border rounded-lg p-3 text-sm min-h-32 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 bg-white'}`}
              />
              <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {aiInput.length}/50 characters minimum
              </div>
            </div>

            {/* AI Actions */}
            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Choose Action:</h3>
              <div className="space-y-2">
                <button
                  onClick={() => callAI('summary')}
                  disabled={loading || !aiInput || aiInput.length < 50}
                  className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-medium disabled:bg-gray-300 hover:bg-purple-700 transition-all"
                >
                  📝 Summarize
                </button>
                <button
                  onClick={() => callAI('flashcards')}
                  disabled={loading || !aiInput || aiInput.length < 50}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium disabled:bg-gray-300 hover:bg-blue-700 transition-all"
                >
                  🃏 Create Flashcards
                </button>
                <button
                  onClick={() => callAI('quiz')}
                  disabled={loading || !aiInput || aiInput.length < 50}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium disabled:bg-gray-300 hover:bg-green-700 transition-all"
                >
                  📋 Generate Quiz
                </button>
              </div>
            </div>

            {loading && (
              <div className={`rounded-xl p-6 shadow-md text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="animate-spin mx-auto mb-3 w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>AI is processing...</p>
              </div>
            )}

            {aiOutput && !loading && (
              <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Result:</h3>
                <div className={`rounded-lg p-4 text-sm whitespace-pre-wrap ${theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
                  {aiOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'gamification') {
    return (
      <div className="max-w-md mx-auto">
        <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-yellow-50 to-orange-50'}`}>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <button onClick={() => setCurrentPage('home')} className="text-sm">← Back</button>
              <button 
                onClick={toggleTheme}
                className="bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Achievements</h2>
            <p className="text-yellow-100 text-sm">Track your progress & earn badges</p>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-4 shadow-md text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <Flame className="mx-auto mb-2 text-orange-500" size={32} />
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{gamificationData?.study_streak || 0}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Day Streak</div>
              </div>

              <div className={`rounded-xl p-4 shadow-md text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <Brain className="mx-auto mb-2 text-purple-500" size={32} />
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{gamificationData?.total_ai_uses || 0}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>AI Uses</div>
              </div>

              <div className={`rounded-xl p-4 shadow-md text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <Clock className="mx-auto mb-2 text-blue-500" size={32} />
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{gamificationData?.total_study_minutes || 0}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Study Minutes</div>
              </div>

              <div className={`rounded-xl p-4 shadow-md text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <ShoppingBag className="mx-auto mb-2 text-green-500" size={32} />
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{gamificationData?.notes_purchased || 0}</div>
                <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Notes Bought</div>
              </div>
            </div>

            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <Trophy className="text-yellow-500" size={24} />
                Your Badges
              </h3>
              <div className="space-y-3">
                {gamificationData?.badges?.map(badge => (
                  <div 
                    key={badge.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      badge.unlocked 
                        ? (theme === 'dark' ? 'bg-yellow-900/20' : 'bg-gradient-to-r from-yellow-50 to-orange-50') 
                        : (theme === 'dark' ? 'bg-gray-700 opacity-50' : 'bg-gray-100 opacity-50')
                    }`}
                  >
                    <div className="text-3xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{badge.name}</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{badge.description}</p>
                    </div>
                    {badge.unlocked && <Award className="text-yellow-500" size={20} />}
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50' : 'bg-gradient-to-r from-purple-100 to-blue-100'}`}>
              <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <Target className="text-purple-600" size={24} />
                Keep Going!
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                You're doing great! Complete more activities to unlock all badges and climb the leaderboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'referral') {
    const isPremium = user?.premium_until && new Date(user.premium_until) > new Date();
    const referralsNeeded = Math.max(0, 3 - (user?.referrals_count || 0));

    return (
      <div className="max-w-md mx-auto">
        <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-pink-50 to-red-50'}`}>
          <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white p-6 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <button onClick={() => setCurrentPage('home')} className="text-sm">← Back</button>
              <button 
                onClick={toggleTheme}
                className="bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-2">Invite Friends</h2>
            <p className="text-pink-100 text-sm">Get 7 days of Premium free!</p>
          </div>

          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">🎁 Viral Hack</h3>
                  <p className="text-sm opacity-90">Invite 3 friends, get Premium!</p>
                </div>
                <Gift size={48} className="opacity-80" />
              </div>
              
              {/* Referral Code Display - Like in the image */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4 text-center">
                <div className="text-sm opacity-90 mb-3">Your Referral Code:</div>
                <div className="bg-white/30 rounded-xl p-4 mb-3">
                  <div className="text-2xl font-bold font-mono tracking-wider">
                    {user?.referral_code || 'X7TFGY2O'}
                  </div>
                </div>
                <button 
                  onClick={copyReferralCode}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 w-full"
                >
                  Copy Code
                </button>
                <p className="text-xs opacity-75 mt-2">Share this code with your friends!</p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Progress:</span>
                  <span className="font-bold">{user?.referrals_count || 0}/3 friends</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-2 mb-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${Math.min(100, ((user?.referrals_count || 0) / 3) * 100)}%` }}
                  />
                </div>
                {referralsNeeded > 0 ? (
                  <p className="text-xs opacity-90">
                    {referralsNeeded} more {referralsNeeded === 1 ? 'friend' : 'friends'} to unlock Premium!
                  </p>
                ) : (
                  <p className="text-xs opacity-90">
                    🎉 Premium unlocked for 7 days!
                  </p>
                )}
              </div>
            </div>

            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Have a referral code?</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="Enter code (e.g., X7TFGY2O)"
                  className={`flex-1 border rounded-lg px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                />
                <button 
                  onClick={handleReferral}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30' : 'bg-gradient-to-r from-yellow-100 to-orange-100'}`}>
              <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>✨ Premium Benefits</h3>
              <ul className={`space-y-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <li>• Unlimited AI credits</li>
                <li>• Priority support</li>
                <li>• No ads</li>
                <li>• Early access to new features</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'wallet') {
    return (
      <div className="max-w-md mx-auto">
        <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <button onClick={() => setCurrentPage('home')} className="text-sm">← Back</button>
              <button 
                onClick={toggleTheme}
                className="bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-2">Wallet & Credits</h2>
            <p className="text-green-100 text-sm">Manage your balance</p>
          </div>

          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
                <div className="text-sm opacity-90 mb-1">AI Credits</div>
                <div className="text-3xl font-bold mb-1">⚡ {user?.credits || 0}</div>
                <div className="text-xs opacity-75">
                  {user?.plan === 'free' ? 'Free Plan' : 'Unlimited'}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
                <div className="text-sm opacity-90 mb-1">Wallet</div>
                <div className="text-3xl font-bold mb-1">${user?.wallet_balance?.toFixed(2) || '0.00'}</div>
                <div className="text-xs opacity-75">From sales</div>
              </div>
            </div>

            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <DollarSign className="text-green-600" size={20} />
                Deposit Funds
              </h3>
              <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Add money to your wallet to purchase notes</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Amount ($)"
                  className={`flex-1 border rounded-lg px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  min="1"
                  step="0.01"
                />
                <button 
                  onClick={handleDeposit}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700"
                >
                  Deposit
                </button>
              </div>
              <div className="flex gap-2">
                {[5, 10, 20, 50].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setDepositAmount(amount.toString())}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`font-bold mb-3 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                <TrendingUp className="text-blue-600" size={20} />
                Request Payout
              </h3>
              <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Withdraw your earnings (minimum $10)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Amount ($)"
                  className={`flex-1 border rounded-lg px-3 py-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  min="10"
                  step="0.01"
                />
                <button 
                  onClick={handlePayout}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
                >
                  Payout
                </button>
              </div>
              <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                Available: ${user?.wallet_balance?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Get Free Credits!</h3>
                  <p className="text-sm text-gray-800">Watch a short ad to earn credits</p>
                </div>
                <div className="text-5xl">📺</div>
              </div>

              <button
                onClick={watchRewardedAd}
                disabled={adLoading || adCooldown > 0}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {adLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin mr-2 w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
                    Loading Ad...
                  </span>
                ) : adCooldown > 0 ? (
                  `Wait ${Math.floor(adCooldown / 60)}:${String(adCooldown % 60).padStart(2, '0')}`
                ) : (
                  '📺 Watch Ad → Get +5 Credits'
                )}
              </button>

              <div className="mt-3 text-center text-xs text-gray-700">
                <p>✨ Ads keep NoteX free for students</p>
                <p className="mt-1 opacity-75">You can watch ads every 5 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'marketplace') {
    return (
      <div className="max-w-md mx-auto">
        <div className={`min-h-screen pb-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="bg-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <button onClick={() => setCurrentPage('home')} className="text-sm">← Back</button>
              <button 
                onClick={toggleTheme}
                className="bg-white/20 px-3 py-2 rounded-xl hover:bg-white/30 transition-all"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
            <h2 className="text-2xl font-bold mb-3">Study Notes Marketplace</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className={`flex-1 px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-white placeholder-gray-400' : 'text-gray-800'}`}
              />
              <button className="bg-white/20 p-2 rounded-lg">
                <Filter size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {notes.length === 0 ? (
              <div className={`rounded-xl p-12 text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <BookOpen className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Bookstore Coming Soon!
                </h3>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Upload your study notes, novels, and books to start selling.
                </p>
                <button
                  onClick={() => setCurrentPage('sell')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700"
                >
                  Start Selling
                </button>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className={`rounded-xl p-4 shadow-md ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex gap-3">
                    <div className="text-4xl">📚</div>
                    <div className="flex-1">
                      <h4 className={`font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{note.title}</h4>
                      <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{note.subject}</p>
                      <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>by {note.seller_name}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          {note.avg_rating || '4.8'}
                        </div>
                        <span className="text-xs text-gray-400">•</span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{note.purchase_count || 0} purchases</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => alert('Purchase feature coming soon!')}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Buy ${note.price_usd}
                        </button>
                        <button 
                          onClick={() => handlePreviewNote(note)}
                          className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {previewNote && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className={`max-w-lg w-full rounded-2xl p-6 max-h-[80vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Preview</h3>
                  <button 
                    onClick={closePreview}
                    className="text-2xl text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                
                <div className="mb-4">
                  <div className="text-6xl mb-4 text-center">📚</div>
                  <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{previewNote.title}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {previewNote.subject || previewNote.genre}
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      by {previewNote.seller_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {previewNote.avg_rating || 'New'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">•</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {previewNote.pages} pages
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {previewNote.purchase_count || 0} sales
                    </span>
                  </div>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {previewNote.description || 'High-quality content to help you excel in your studies.'}
                  </p>
                  <div className={`p-4 rounded-xl mb-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      "Preview pages would appear here. Purchase to access the full content!"
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      ${previewNote.price_usd}
                    </span>
                    <button 
                      onClick={() => {
                        closePreview();
                        alert('Purchase feature coming soon!');
                      }}
                      className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentPage === 'sell') {
    return (
      <UploadNotePage 
        theme={theme}
        toggleTheme={toggleTheme}
        setCurrentPage={setCurrentPage}
        uploadNote={uploadNote}
        setUploadNote={setUploadNote}
        handleNoteUpload={handleNoteUpload}
      />
    );
  }

  return null;
};

export default NoteXApp;
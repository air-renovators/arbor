import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  Target, 
  BookOpen, 
  MessageCircle, 
  Users, 
  Compass, 
  LayoutDashboard, 
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckSquare,
  ThumbsUp,
  Activity,
  UserCog,
  ClipboardCheck,
  Heart,
  Briefcase,
  User,
  Mic2,
  Dumbbell,
  ChevronLeft,
  Award,
  Sprout,
  ArrowRight,
  Loader2,
  Edit2,
  Bell,
  Repeat,
  Camera,
  Mail,
  Cake,
  Bookmark
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { getDailyQuote, getBibleVerse, getMentorshipAdvice, analyzeDecision } from './services/geminiService';
import VoiceInput from './components/VoiceInput';
import { Goal, BibleNote, ChatMessage, Decision, LifePlanSection, View, ActionStep, EvaluationLog, EvaluationDetails, MentorMeeting, UserProfile, UserRole, SavedQuote } from './types';

// --- Helper Components ---

const LatinCross = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 2v20" />
    <path d="M7 8h10" />
  </svg>
);

// --- Sign In Component ---
const SignIn = ({ onSignIn }: { onSignIn: (role: UserRole, name: string) => void }) => {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen bg-earth-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-nature-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-earth-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md border border-earth-100 relative z-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-earth-800 p-4 rounded-2xl text-white shadow-lg">
             <Leaf size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-serif font-bold text-earth-900 mb-2">Arbor</h1>
        <p className="text-earth-600 mb-8 font-light">Rooted in Purpose. Growing in Leadership.</p>

        <div className="space-y-4 mb-8 text-left">
           <label className="text-xs font-bold uppercase text-earth-500 ml-1">Your Name</label>
           <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-4 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-nature-500 outline-none transition-all"
           />
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => name && onSignIn('MENTEE', name)}
            disabled={!name}
            className="w-full group relative overflow-hidden bg-nature-600 text-white p-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <div className="relative z-10 flex items-center justify-center gap-2">
                <Sprout size={20} /> Sign in as Planter
             </div>
             <div className="absolute inset-0 bg-nature-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
          </button>

          <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-earth-200"></div>
              <span className="flex-shrink-0 mx-4 text-earth-400 text-xs uppercase tracking-wider">Or</span>
              <div className="flex-grow border-t border-earth-200"></div>
          </div>

          <button 
            onClick={() => name && onSignIn('MENTOR', name)}
            disabled={!name}
            className="w-full border-2 border-earth-800 text-earth-800 p-4 rounded-xl font-bold hover:bg-earth-800 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             <UserCog size={20} /> Sign in as Mentor
          </button>
        </div>
      </div>
      <p className="mt-8 text-earth-500 text-xs">© 2024 Arbor Development. All rights reserved.</p>
    </div>
  );
};

const EvaluationModal = ({ 
  goal, 
  type, 
  onSave, 
  onClose 
}: { 
  goal: Goal, 
  type: 'SELF' | 'MENTOR', 
  onSave: (log: EvaluationLog, targetScore?: number) => void, 
  onClose: () => void 
}) => {
  const [feedback, setFeedback] = useState('');
  const [details, setDetails] = useState<EvaluationDetails>({
    specific: { who: !!goal.specific.who, what: !!goal.specific.what, where: !!goal.specific.where, when: !!goal.specific.when, why: !!goal.specific.why, requirements: !!goal.specific.requirements, constraints: !!goal.specific.constraints },
    measurable: { amount: !!goal.measurable.amount, indicator: !!goal.measurable.indicator },
    actionable: { clearSteps: goal.actionable.steps.length > 0, immediateAction: false },
    realistic: { able: goal.realistic.able, willing: goal.realistic.willing },
    timeBound: { deadline: !!goal.timeBound.dueDate, todayAction: false, routine: !!goal.timeBound.routine }
  });

  const [localTargetScore, setLocalTargetScore] = useState<string>(goal.evaluation.targetScore ? goal.evaluation.targetScore.toString() : '');

  const calculateScore = () => {
    let score = 0;
    const countTrue = (obj: any) => Object.values(obj).filter(Boolean).length;
    score += countTrue(details.specific); // 7 points
    score += countTrue(details.measurable); // 2 points
    score += countTrue(details.actionable); // 2 points
    score += countTrue(details.realistic); // 2 points
    score += countTrue(details.timeBound); // 3 points
    // Total 16 points possible
    return Math.round((score / 16) * 100); 
  };

  const handleToggle = (category: keyof EvaluationDetails, field: string) => {
    setDetails(prev => {
      const section = prev[category] as Record<string, boolean>;
      return {
        ...prev,
        [category]: {
          ...section,
          [field]: !section[field]
        }
      };
    });
  };

  const handleSave = () => {
    const log: EvaluationLog = {
      id: Date.now().toString(),
      date: Date.now(),
      type,
      score: calculateScore(),
      details,
      feedback
    };
    const finalTarget = localTargetScore ? parseInt(localTargetScore) : undefined;
    onSave(log, finalTarget);
  };

  const currentScore = calculateScore();
  const targetScoreVal = parseInt(localTargetScore) || 0;
  const hasTarget = !!localTargetScore;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className={`p-6 border-b ${type === 'MENTOR' ? 'bg-earth-800 text-white' : 'bg-nature-600 text-white'} flex justify-between items-center sticky top-0 z-10`}>
          <div>
             <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                <ClipboardCheck /> {type === 'MENTOR' ? 'Mentor Evaluation' : 'Self Assessment'}
             </h3>
             <p className="text-xs opacity-80">Evaluating: {goal.title}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">S - Specific</h4>
                <div className="space-y-2 text-sm text-earth-800">
                   {Object.keys(details.specific).map(key => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                         <input type="checkbox" checked={(details.specific as any)[key]} onChange={() => handleToggle('specific', key)} className="accent-blue-600 w-4 h-4"/>
                         <span className="capitalize">{key} is clearly defined?</span>
                      </label>
                   ))}
                </div>
             </div>
             
             {/* Measurable */}
             <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">M - Measurable</h4>
                <div className="space-y-2 text-sm text-earth-800">
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.measurable.amount} onChange={() => handleToggle('measurable', 'amount')} className="accent-green-600 w-4 h-4"/>
                      <span>Quantity defined (How much)?</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.measurable.indicator} onChange={() => handleToggle('measurable', 'indicator')} className="accent-green-600 w-4 h-4"/>
                      <span>Success indicator clear?</span>
                   </label>
                </div>
             </div>

             {/* Actionable */}
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">A - Actionable</h4>
                <div className="space-y-2 text-sm text-earth-800">
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.actionable.clearSteps} onChange={() => handleToggle('actionable', 'clearSteps')} className="accent-purple-600 w-4 h-4"/>
                      <span>Clear action steps listed?</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.actionable.immediateAction} onChange={() => handleToggle('actionable', 'immediateAction')} className="accent-purple-600 w-4 h-4"/>
                      <span>Can act on this TODAY?</span>
                   </label>
                </div>
             </div>

             {/* Realistic */}
             <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">R - Realistic</h4>
                <div className="space-y-2 text-sm text-earth-800">
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.realistic.able} onChange={() => handleToggle('realistic', 'able')} className="accent-amber-600 w-4 h-4"/>
                      <span>Able (Skills/Resources)?</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.realistic.willing} onChange={() => handleToggle('realistic', 'willing')} className="accent-amber-600 w-4 h-4"/>
                      <span>Willing (Motivation)?</span>
                   </label>
                </div>
             </div>

             <div className="bg-red-50 p-4 rounded-xl border border-red-100 md:col-span-2">
                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">T - Time-bound</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-earth-800">
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.timeBound.deadline} onChange={() => handleToggle('timeBound', 'deadline')} className="accent-red-600 w-4 h-4"/>
                      <span>Deadlines set?</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.timeBound.todayAction} onChange={() => handleToggle('timeBound', 'todayAction')} className="accent-red-600 w-4 h-4"/>
                      <span>Immediate start date?</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer hover:opacity-70">
                      <input type="checkbox" checked={details.timeBound.routine} onChange={() => handleToggle('timeBound', 'routine')} className="accent-red-600 w-4 h-4"/>
                      <span>Daily/Weekly routine defined?</span>
                   </label>
                </div>
             </div>
          </div>

          <div>
             <h4 className="font-bold text-earth-800 mb-2">
                {type === 'MENTOR' ? 'Mentor Feedback & Notes' : 'Personal Reflection Notes'}
             </h4>
             <textarea
                className="w-full p-4 rounded-xl bg-earth-50 border border-earth-200 outline-none focus:ring-2 focus:ring-nature-400 h-24"
                placeholder={type === 'MENTOR' ? "Provide constructive feedback to the planter..." : "Reflect on your progress..."}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
             />
          </div>
          
          <div className="pt-4 border-t border-earth-100 flex flex-col gap-4">
             <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                    <div className="text-xl font-bold text-earth-800 flex items-center gap-3">
                        <span>Score: <span className={`${currentScore > 80 ? 'text-green-600' : 'text-amber-600'}`}>{currentScore}%</span></span>
                        
                        {hasTarget && (
                            <span className="text-sm text-earth-400 font-normal">
                                / Target: <span className="text-earth-700 font-bold">{targetScoreVal}%</span>
                            </span>
                        )}
                    </div>
                    {type === 'MENTOR' && (
                        <div className="flex items-center gap-2 text-sm text-earth-600 mt-1">
                            <label className="font-bold">Set Target:</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                placeholder="100"
                                className="w-16 p-1 border border-earth-300 rounded text-center"
                                value={localTargetScore}
                                onChange={e => setLocalTargetScore(e.target.value)}
                            />
                            <span>%</span>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleSave} 
                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${type === 'MENTOR' ? 'bg-earth-800 hover:bg-earth-900' : 'bg-nature-600 hover:bg-nature-700'}`}
                >
                    Submit Evaluation
                </button>
             </div>

             {hasTarget && (
                 <div className="w-full h-3 bg-earth-100 rounded-full overflow-hidden relative">
                     <div className="absolute top-0 bottom-0 bg-nature-500 transition-all duration-500" style={{ width: `${currentScore}%` }}></div>
                     <div className="absolute top-0 bottom-0 w-1 bg-red-400 z-10" style={{ left: `${Math.min(targetScoreVal, 100)}%` }} title="Target Score"></div>
                 </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- NEW Detailed Goals Component ---
const Goals = ({ goals, setGoals, isMentorMode }: { goals: Goal[], setGoals: React.Dispatch<React.SetStateAction<Goal[]>>, isMentorMode: boolean }) => {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [showEvaluation, setShowEvaluation] = useState<Goal | null>(null);

  // New Goal State
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const addGoal = () => {
     if (!newGoalTitle) return;
     const newGoal: Goal = {
         id: Date.now().toString(),
         title: newGoalTitle,
         category: 'Personal',
         specific: { what: '', who: '', where: '', when: '', why: '', requirements: '', constraints: '' },
         measurable: { amount: '', indicator: '' },
         actionable: { steps: [] },
         realistic: { willing: true, able: true, notes: '' },
         timeBound: { startDate: new Date().toISOString().split('T')[0], dueDate: '', routine: '' },
         evaluation: { frequency: 'Monthly', history: [] },
         progress: 0,
         createdAt: Date.now()
     };
     setGoals(prev => [...prev, newGoal]);
     setNewGoalTitle('');
     setShowAdd(false);
     setEditingGoal(newGoal); // Immediately open for editing
  };

  const deleteGoal = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("Are you sure you want to delete this goal?")) {
        setGoals(prev => prev.filter(g => g.id !== id));
      }
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
    setEditingGoal(updatedGoal);
  };

  const handleEvaluationSave = (log: EvaluationLog, targetScore?: number) => {
      if (showEvaluation) {
          const updatedGoal = {
              ...showEvaluation,
              evaluation: {
                  ...showEvaluation.evaluation,
                  history: [log, ...showEvaluation.evaluation.history],
                  targetScore: targetScore !== undefined ? targetScore : showEvaluation.evaluation.targetScore
              }
          };
          setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
          setShowEvaluation(null);
      }
  };

  // Helper for safe input change
  const handleNestedChange = (section: keyof Goal, field: string, value: any) => {
      if (!editingGoal) return;
      
      const updated = { ...editingGoal };
      if (typeof updated[section] === 'object' && updated[section] !== null) {
          (updated[section] as any)[field] = value;
      }
      updateGoal(updated);
  };

  // Action Steps Helpers
  const addActionStep = () => {
      if (!editingGoal) return;
      const newStep: ActionStep = {
          id: Date.now().toString(),
          text: '',
          completed: false,
          date: new Date().toISOString().split('T')[0]
      };
      updateGoal({
          ...editingGoal,
          actionable: {
              ...editingGoal.actionable,
              steps: [...editingGoal.actionable.steps, newStep]
          }
      });
  };

  const updateActionStep = (id: string, field: keyof ActionStep, value: any) => {
      if (!editingGoal) return;
      const updatedSteps = editingGoal.actionable.steps.map(s => 
          s.id === id ? { ...s, [field]: value } : s
      );
      updateGoal({
          ...editingGoal,
          actionable: { ...editingGoal.actionable, steps: updatedSteps }
      });
  };

  const removeActionStep = (id: string) => {
      if (!editingGoal) return;
      const updatedSteps = editingGoal.actionable.steps.filter(s => s.id !== id);
      updateGoal({
          ...editingGoal,
          actionable: { ...editingGoal.actionable, steps: updatedSteps }
      });
  };

  if (editingGoal) {
      return (
          <div className="max-w-4xl mx-auto pb-32 animate-fade-in">
              <button onClick={() => setEditingGoal(null)} className="mb-4 flex items-center text-earth-600 hover:text-earth-900 font-bold">
                  <ChevronLeft size={20}/> Back to Goals
              </button>

              <div className="bg-white rounded-3xl shadow-lg border border-earth-100 overflow-hidden">
                  <div className="bg-nature-600 p-6 text-white">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <p className="text-xs uppercase font-bold text-nature-200 mb-1">Editing Goal</p>
                              <input 
                                  className="text-3xl font-serif font-bold bg-transparent border-b border-white/30 focus:border-white outline-none w-full placeholder-nature-200/50"
                                  value={editingGoal.title}
                                  onChange={e => updateGoal({...editingGoal, title: e.target.value})}
                              />
                          </div>
                          <select 
                              className="bg-nature-700 text-white text-xs font-bold uppercase rounded-lg p-2 border border-nature-500"
                              value={editingGoal.category}
                              onChange={e => updateGoal({...editingGoal, category: e.target.value as any})}
                          >
                              <option>Personal</option>
                              <option>Spiritual</option>
                              <option>Career</option>
                              <option>Health</option>
                              <option>Life Skills</option>
                          </select>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm font-medium opacity-90">
                          <div className="flex items-center gap-1"><CalendarIcon size={14}/> Due: <input type="date" className="bg-transparent border-none p-0 w-24 focus:ring-0" value={editingGoal.timeBound.dueDate} onChange={e => handleNestedChange('timeBound', 'dueDate', e.target.value)} /></div>
                          <div className="flex items-center gap-1"><Activity size={14}/> Progress: 
                              <input 
                                  type="range" min="0" max="100" 
                                  className="mx-2 w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                                  value={editingGoal.progress} 
                                  onChange={e => updateGoal({...editingGoal, progress: parseInt(e.target.value)})}
                              />
                              {editingGoal.progress}%
                          </div>
                      </div>
                  </div>

                  <div className="p-6 space-y-8">
                      {/* SMARTER Sections */}
                      
                      {/* Specific */}
                      <section className="space-y-4">
                          <h3 className="text-xl font-bold text-earth-800 flex items-center gap-2 border-b border-earth-100 pb-2">
                              <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">S</span> Specific
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {['what', 'who', 'where', 'when', 'why'].map((key) => (
                                  <div key={key}>
                                      <label className="text-xs font-bold text-earth-500 uppercase mb-1 block capitalize">{key}</label>
                                      <input 
                                          className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                          value={(editingGoal.specific as any)[key]}
                                          onChange={e => {
                                              const newSpecific = { ...editingGoal.specific, [key]: e.target.value };
                                              updateGoal({ ...editingGoal, specific: newSpecific });
                                          }}
                                          placeholder={`Define ${key}...`}
                                      />
                                  </div>
                              ))}
                              <div>
                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1 block">Which? (Requirements)</label>
                                  <input 
                                      className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                      value={editingGoal.specific.requirements}
                                      onChange={e => handleNestedChange('specific', 'requirements', e.target.value)}
                                      placeholder="What do you require?"
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1 block">Which? (Constraints)</label>
                                  <input 
                                      className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                      value={editingGoal.specific.constraints}
                                      onChange={e => handleNestedChange('specific', 'constraints', e.target.value)}
                                      placeholder="What are the constraints?"
                                  />
                              </div>
                          </div>
                      </section>

                      {/* Measurable */}
                      <section className="space-y-4">
                          <h3 className="text-xl font-bold text-earth-800 flex items-center gap-2 border-b border-earth-100 pb-2">
                              <span className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">M</span> Measurable
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1 block">Amount / Quantity</label>
                                  <input 
                                      className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                      value={editingGoal.measurable.amount}
                                      onChange={e => handleNestedChange('measurable', 'amount', e.target.value)}
                                      placeholder="e.g. 10kgs, $5000"
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1 block">Success Indicator</label>
                                  <input 
                                      className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                      value={editingGoal.measurable.indicator}
                                      onChange={e => handleNestedChange('measurable', 'indicator', e.target.value)}
                                      placeholder="How will you know it is done?"
                                  />
                              </div>
                          </div>
                      </section>

                      {/* Actionable */}
                      <section className="space-y-4">
                          <div className="flex justify-between items-center border-b border-earth-100 pb-2">
                              <h3 className="text-xl font-bold text-earth-800 flex items-center gap-2">
                                  <span className="bg-purple-100 text-purple-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">A</span> Actionable
                              </h3>
                              <button onClick={addActionStep} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold hover:bg-purple-200">+ Add Step</button>
                          </div>
                          
                          <div className="space-y-3">
                              {editingGoal.actionable.steps.map((step, index) => (
                                  <div key={step.id} className="p-4 bg-earth-50 rounded-xl border border-earth-200 relative">
                                      <button onClick={() => removeActionStep(step.id)} className="absolute top-2 right-2 text-earth-300 hover:text-red-500 p-1"><X size={16}/></button>
                                      <div className="grid gap-3">
                                          <div>
                                              <label className="text-xs font-bold text-purple-600 uppercase mb-1">Action Step {index + 1}</label>
                                              <input 
                                                  className="w-full bg-white border border-earth-200 p-2 rounded-lg focus:border-purple-400 outline-none font-medium"
                                                  placeholder="Describe the action..."
                                                  value={step.text}
                                                  onChange={e => updateActionStep(step.id, 'text', e.target.value)}
                                              />
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                               <div>
                                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1">Days & Times</label>
                                                  <div className="flex gap-2">
                                                      <input 
                                                          className="w-full bg-white border border-earth-200 p-2 rounded-lg text-sm"
                                                          placeholder="e.g. Mon, Wed"
                                                          value={step.days || ''}
                                                          onChange={e => updateActionStep(step.id, 'days', e.target.value)}
                                                      />
                                                      <input 
                                                          type="time"
                                                          className="bg-white border border-earth-200 p-2 rounded-lg text-sm"
                                                          value={step.time || ''}
                                                          onChange={e => updateActionStep(step.id, 'time', e.target.value)}
                                                      />
                                                  </div>
                                               </div>
                                               <div>
                                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1">Due Date</label>
                                                  <input 
                                                      type="date"
                                                      className="w-full bg-white border border-earth-200 p-2 rounded-lg text-sm"
                                                      value={step.date || ''}
                                                      onChange={e => updateActionStep(step.id, 'date', e.target.value)}
                                                  />
                                               </div>
                                          </div>
                                          <div>
                                              <label className="text-xs font-bold text-earth-500 uppercase mb-1">This step has been accomplished when...</label>
                                              <input 
                                                  className="w-full bg-white border border-earth-200 p-2 rounded-lg text-sm italic text-earth-600"
                                                  placeholder="Success criteria..."
                                                  value={step.successCriteria || ''}
                                                  onChange={e => updateActionStep(step.id, 'successCriteria', e.target.value)}
                                              />
                                          </div>
                                      </div>
                                  </div>
                              ))}
                              {editingGoal.actionable.steps.length === 0 && (
                                  <p className="text-earth-400 text-sm italic">No action steps yet. Break it down!</p>
                              )}
                          </div>
                      </section>

                      {/* Realistic */}
                      <section className="space-y-4">
                          <h3 className="text-xl font-bold text-earth-800 flex items-center gap-2 border-b border-earth-100 pb-2">
                              <span className="bg-amber-100 text-amber-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">R</span> Realistic
                          </h3>
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                              <div className="flex gap-6 mb-4">
                                  <label className="flex items-center gap-2 font-bold text-earth-700 cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          checked={editingGoal.realistic.able} 
                                          onChange={e => handleNestedChange('realistic', 'able', e.target.checked)}
                                          className="w-5 h-5 accent-amber-600"
                                      />
                                      Able (Have skills/resources)
                                  </label>
                                  <label className="flex items-center gap-2 font-bold text-earth-700 cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          checked={editingGoal.realistic.willing} 
                                          onChange={e => handleNestedChange('realistic', 'willing', e.target.checked)}
                                          className="w-5 h-5 accent-amber-600"
                                      />
                                      Willing (Motivated)
                                  </label>
                              </div>
                              <textarea 
                                  className="w-full bg-white border border-amber-200 rounded-xl p-3 h-24"
                                  placeholder="Notes on constraints, resources needed, or mindset..."
                                  value={editingGoal.realistic.notes}
                                  onChange={e => handleNestedChange('realistic', 'notes', e.target.value)}
                              />
                          </div>
                      </section>

                      {/* Time-bound */}
                      <section className="space-y-4">
                          <h3 className="text-xl font-bold text-earth-800 flex items-center gap-2 border-b border-earth-100 pb-2">
                              <span className="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">T</span> Time-bound
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1 block">Start Date</label>
                                  <input 
                                      type="date"
                                      className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                      value={editingGoal.timeBound.startDate}
                                      onChange={e => handleNestedChange('timeBound', 'startDate', e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1 block">Due Date</label>
                                  <input 
                                      type="date"
                                      className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                      value={editingGoal.timeBound.dueDate}
                                      onChange={e => handleNestedChange('timeBound', 'dueDate', e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1 block">Routine</label>
                                  <input 
                                      className="w-full p-3 bg-earth-50 border border-earth-200 rounded-xl"
                                      placeholder="e.g. Daily at 6am"
                                      value={editingGoal.timeBound.routine}
                                      onChange={e => handleNestedChange('timeBound', 'routine', e.target.value)}
                                  />
                              </div>
                          </div>
                      </section>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-32">
       <div className="flex justify-between items-center">
          <h2 className="text-3xl font-serif font-bold text-earth-900">Goals (S.M.A.R.T.E.R.)</h2>
          {!isMentorMode && <button onClick={() => setShowAdd(true)} className="bg-nature-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><Plus size={20}/> New Goal</button>}
       </div>

       {showAdd && (
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100 animate-slide-down">
               <h3 className="font-bold text-earth-800 mb-4">Start a New Goal</h3>
               <input 
                 className="w-full p-3 border rounded-xl bg-earth-50 mb-4"
                 placeholder="Goal Title (e.g. Run a Marathon)"
                 value={newGoalTitle}
                 onChange={e => setNewGoalTitle(e.target.value)}
               />
               <div className="flex gap-2">
                   <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-earth-500 font-bold">Cancel</button>
                   <button onClick={addGoal} className="px-4 py-2 bg-nature-600 text-white rounded-xl font-bold">Create & Edit</button>
               </div>
           </div>
       )}

       <div className="grid gap-6">
          {goals.map(goal => (
             <div key={goal.id} className="bg-white rounded-2xl shadow-sm border border-earth-100 relative group overflow-hidden transition-all duration-300">
                 <div 
                    className="p-6 cursor-pointer hover:bg-earth-50"
                    onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                 >
                     <div className="flex justify-between items-start mb-4">
                         <div>
                             <span className="inline-block px-2 py-1 bg-nature-100 text-nature-700 text-[10px] font-bold uppercase rounded-full mb-2">{goal.category}</span>
                             <h3 className="text-xl font-bold text-earth-800">{goal.title}</h3>
                         </div>
                         <div className="flex items-center gap-2">
                            <div className="text-right">
                                <span className="text-2xl font-bold text-nature-600">{goal.progress}%</span>
                            </div>
                         </div>
                     </div>
                     
                     <div className="h-2 bg-earth-100 rounded-full overflow-hidden mb-4">
                         <div className="h-full bg-nature-500" style={{ width: `${goal.progress}%` }}></div>
                     </div>

                     <div className="flex justify-between items-center text-sm text-earth-500">
                         <span>Next: {goal.actionable.steps.find(s => !s.completed)?.text || "Completed!"}</span>
                         {expandedGoalId === goal.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                     </div>
                 </div>

                 {/* Expanded Actions */}
                 {expandedGoalId === goal.id && (
                     <div className="px-6 pb-6 bg-earth-50 border-t border-earth-100 animate-slide-down">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setEditingGoal(goal); }}
                                className="p-3 bg-white border border-earth-200 rounded-xl font-bold text-earth-700 hover:bg-nature-50 hover:text-nature-700 hover:border-nature-200 flex flex-col items-center gap-2"
                             >
                                 <Edit2 size={20}/> Edit Details
                             </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); setShowEvaluation(goal); }}
                                className="p-3 bg-white border border-earth-200 rounded-xl font-bold text-earth-700 hover:bg-gold-50 hover:text-gold-700 hover:border-gold-200 flex flex-col items-center gap-2"
                             >
                                 <ClipboardCheck size={20}/> Evaluate
                             </button>
                             <div className="p-3 bg-white border border-earth-200 rounded-xl flex flex-col items-center justify-center text-center">
                                 <span className="text-xs font-bold text-earth-400 uppercase">Due Date</span>
                                 <span className="font-medium text-earth-900">{goal.timeBound.dueDate || '-'}</span>
                             </div>
                             {!isMentorMode && (
                                 <button 
                                    onClick={(e) => deleteGoal(goal.id, e)}
                                    className="p-3 bg-white border border-earth-200 rounded-xl font-bold text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex flex-col items-center gap-2"
                                 >
                                     <Trash2 size={20}/> Delete
                                 </button>
                             )}
                         </div>

                         {/* Evaluation History Preview */}
                         {goal.evaluation.history.length > 0 && (
                             <div className="mt-4 pt-4 border-t border-earth-200">
                                 <p className="text-xs font-bold text-earth-400 uppercase mb-2">Evaluation History</p>
                                 <div className="flex gap-2 overflow-x-auto pb-2">
                                     {goal.evaluation.history.slice(0, 5).map(log => (
                                         <div key={log.id} className="flex-shrink-0 p-2 bg-white rounded-lg border border-earth-200 text-xs w-24">
                                             <div className="font-bold text-earth-800">{new Date(log.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</div>
                                             <div className="flex justify-between mt-1">
                                                 <span className="text-earth-500">{log.type === 'MENTOR' ? 'Mentor' : 'Self'}</span>
                                                 <span className="font-bold text-nature-600">{log.score}%</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}
                     </div>
                 )}
             </div>
          ))}
          {goals.length === 0 && !showAdd && (
              <div className="text-center py-12 text-earth-400">
                  <Target size={48} className="mx-auto mb-4 opacity-20"/>
                  <p>No goals yet. Start planting seeds!</p>
              </div>
          )}
       </div>

       {showEvaluation && (
           <EvaluationModal 
               goal={showEvaluation} 
               type={isMentorMode ? 'MENTOR' : 'SELF'} 
               onSave={handleEvaluationSave}
               onClose={() => setShowEvaluation(null)}
           />
       )}
    </div>
  );
};

// --- NEW Decision Tool Component ---
const DecisionTool = () => {
    const [context, setContext] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!context) return;
        setLoading(true);
        // Fix: Explicitly pass a stringified JSON to ensure type safety.
        // Even if analyzeDecision accepts `any`, explicit string conversion avoids `unknown` type issues in strict environments.
        const result = await analyzeDecision(JSON.stringify({ description: context }));
        setAnalysis(result);
        setLoading(false);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-32">
             <div className="bg-earth-800 p-8 rounded-3xl text-white shadow-lg">
                <h2 className="text-3xl font-serif font-bold">Decision Assistant</h2>
                <p className="opacity-90 mt-2">Wisdom for the crossroads.</p>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100">
                 <h3 className="font-bold text-earth-800 mb-4">What's on your mind?</h3>
                 <textarea 
                     className="w-full p-4 bg-earth-50 rounded-xl border border-earth-200 min-h-[150px] mb-4"
                     placeholder="Describe the decision you need to make, options you are considering, and your main concerns..."
                     value={context}
                     onChange={e => setContext(e.target.value)}
                 />
                 <button 
                    onClick={handleAnalyze}
                    disabled={loading || !context}
                    className="w-full bg-nature-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="animate-spin"/> : <><Compass size={20}/> Analyze with AI</>}
                 </button>
             </div>

             {analysis && (
                 <div className="bg-gold-50 p-6 rounded-2xl border border-gold-200 animate-slide-down">
                     <h3 className="font-bold text-earth-900 mb-2 flex items-center gap-2"><Leaf size={16}/> Insight</h3>
                     <p className="text-earth-800 leading-relaxed whitespace-pre-wrap">{analysis}</p>
                 </div>
             )}
        </div>
    );
};

// --- NEW Mentorship Component ---
const Mentorship = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: "Hello. I'm your AI mentor. How is your leadership journey going today?", timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const history = messages.map(m => ({ role: m.role, content: m.content }));
        const advice = await getMentorshipAdvice(history, userMsg.content);

        const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: advice, timestamp: Date.now() };
        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);
    };

    return (
        <div className="max-w-2xl mx-auto h-[calc(100vh-140px)] flex flex-col animate-fade-in bg-white rounded-3xl shadow-sm border border-earth-100 overflow-hidden">
             <div className="bg-earth-100 p-4 border-b border-earth-200 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-earth-800 flex items-center justify-center text-white"><UserCog size={20}/></div>
                 <div>
                     <h3 className="font-bold text-earth-900">Mentor Chat</h3>
                     <p className="text-xs text-earth-500">Always here to listen.</p>
                 </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-earth-50/50">
                 {messages.map(m => (
                     <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                             m.role === 'user' 
                             ? 'bg-nature-600 text-white rounded-br-none' 
                             : 'bg-white border border-earth-100 text-earth-800 rounded-bl-none shadow-sm'
                         }`}>
                             {m.content}
                         </div>
                     </div>
                 ))}
                 {loading && (
                     <div className="flex justify-start">
                         <div className="bg-white border border-earth-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                             <span className="w-2 h-2 bg-earth-400 rounded-full animate-bounce"></span>
                             <span className="w-2 h-2 bg-earth-400 rounded-full animate-bounce delay-100"></span>
                             <span className="w-2 h-2 bg-earth-400 rounded-full animate-bounce delay-200"></span>
                         </div>
                     </div>
                 )}
                 <div ref={messagesEndRef} />
             </div>

             <div className="p-4 bg-white border-t border-earth-200 flex gap-2">
                 <input 
                    className="flex-1 bg-earth-50 border border-earth-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-nature-500"
                    placeholder="Ask for advice..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                 />
                 <VoiceInput onTranscript={(text: string) => setInput(prev => prev + ' ' + text)} className="bg-earth-100 hover:bg-earth-200 text-earth-600" />
                 <button 
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className="p-2 bg-nature-600 text-white rounded-full hover:bg-nature-700 disabled:opacity-50 transition-colors"
                 >
                     <Send size={20}/>
                 </button>
             </div>
        </div>
    );
};

// 8. Community
const Community = () => {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-32">
             <div className="bg-gradient-to-r from-nature-600 to-nature-800 p-8 rounded-3xl text-white shadow-lg">
                <h2 className="text-3xl font-serif font-bold">Community Growth</h2>
                <p className="opacity-90 mt-2">Connect, share feedback, and grow together.</p>
             </div>
             <div className="grid md:grid-cols-2 gap-6">
                 {[1, 2, 3, 4].map(i => (
                     <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-earth-100">
                         <div className="flex items-center gap-3 mb-4">
                             <div className={`w-10 h-10 rounded-full bg-nature-${i*100 + 200} flex items-center justify-center font-bold text-nature-900`}>{String.fromCharCode(64+i)}</div>
                             <div><h4 className="font-bold text-earth-900">User {String.fromCharCode(64+i)}</h4><p className="text-xs text-earth-500">2 hours ago</p></div>
                         </div>
                         <p className="text-earth-700 text-sm mb-4">Just completed my quarterly goal review! The S.M.A.R.T.E.R framework really helped me pivot when I got stuck on the 'Realistic' part. Anyone else struggling with the 'Evaluate' step?</p>
                         <div className="flex gap-4 text-xs text-earth-500 font-bold"><span className="cursor-pointer hover:text-nature-600">Like (12)</span><span className="cursor-pointer hover:text-nature-600">Reply (3)</span></div>
                     </div>
                 ))}
             </div>
        </div>
    )
}

const Dashboard = ({ 
  quote, 
  goals, 
  bibleNotes, 
  setView, 
  isMentorMode, 
  userRole, 
  onUpgrade, 
  setGoals, 
  onSaveQuote 
}: {
  quote: { text: string; author: string } | null,
  goals: Goal[],
  bibleNotes: BibleNote[],
  setView: (v: View) => void,
  isMentorMode: boolean,
  userRole: UserRole,
  onUpgrade: () => void,
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>,
  onSaveQuote: (q: { text: string, author: string }) => void
}) => {
  const completedGoals = goals.filter(g => g.progress === 100).length;
  const inProgressGoals = goals.length - completedGoals;
  
  const chartData = [
    { name: 'Completed', value: completedGoals, color: '#166534' }, // nature-800
    { name: 'In Progress', value: inProgressGoals, color: '#ca8a04' }, // yellow-600
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-32">
      {/* Welcome & Quote */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-earth-800 to-earth-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
               <Leaf size={120} />
            </div>
            <h2 className="text-3xl font-serif font-bold mb-2">Welcome Back</h2>
            <p className="text-earth-200 mb-6">"He is like a tree planted by streams of water..."</p>
            
            {quote && (
               <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 relative">
                  <p className="font-serif italic text-lg mb-2">"{quote.text}"</p>
                  <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gold-300">— {quote.author}</span>
                      <button onClick={() => onSaveQuote(quote)} className="text-white/60 hover:text-gold-300 transition-colors"><Bookmark size={18}/></button>
                  </div>
               </div>
            )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-earth-100 shadow-sm flex flex-col justify-between">
            <div>
               <h3 className="font-bold text-earth-800 mb-4 flex items-center gap-2"><Activity size={20}/> Pulse Check</h3>
               <div className="h-40 relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie 
                            data={chartData} 
                            innerRadius={40} 
                            outerRadius={60} 
                            paddingAngle={5} 
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                       <span className="text-2xl font-bold text-earth-800">{goals.length}</span>
                       <span className="text-[10px] text-earth-400 font-bold uppercase">Goals</span>
                  </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="bg-earth-50 p-3 rounded-xl text-center">
                    <div className="text-xl font-bold text-earth-800">{goals.length}</div>
                    <div className="text-[10px] uppercase text-earth-400 font-bold">Active Goals</div>
                </div>
                <div className="bg-earth-50 p-3 rounded-xl text-center">
                    <div className="text-xl font-bold text-earth-800">{bibleNotes.length}</div>
                    <div className="text-[10px] uppercase text-earth-400 font-bold">Notes</div>
                </div>
            </div>
        </div>
      </section>

      {/* Quick Actions */}
      <h3 className="font-bold text-earth-800 text-lg">Quick Actions</h3>
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => setView(View.GOALS)} className="p-4 bg-white border border-earth-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
              <div className="bg-nature-100 text-nature-700 p-3 rounded-full group-hover:scale-110 transition-transform"><Target size={24}/></div>
              <span className="font-bold text-earth-700">Track Goal</span>
          </button>
          <button onClick={() => setView(View.BIBLE)} className="p-4 bg-white border border-earth-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-full group-hover:scale-110 transition-transform"><BookOpen size={24}/></div>
              <span className="font-bold text-earth-700">Bible Study</span>
          </button>
          <button onClick={() => setView(View.DECISIONS)} className="p-4 bg-white border border-earth-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
              <div className="bg-gold-100 text-gold-700 p-3 rounded-full group-hover:scale-110 transition-transform"><Compass size={24}/></div>
              <span className="font-bold text-earth-700">Decision Tool</span>
          </button>
          <button onClick={() => setView(View.MENTORSHIP)} className="p-4 bg-white border border-earth-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 group">
              <div className="bg-purple-100 text-purple-700 p-3 rounded-full group-hover:scale-110 transition-transform"><MessageCircle size={24}/></div>
              <span className="font-bold text-earth-700">Chat Mentor</span>
          </button>
      </section>

      {/* Conditional: Become a Mentor */}
      {userRole === 'MENTEE' && !isMentorMode && (
          <section className="bg-gradient-to-r from-gold-400 to-gold-600 rounded-3xl p-8 text-earth-900 shadow-lg relative overflow-hidden flex items-center justify-between">
              <div className="relative z-10 max-w-lg">
                  <h3 className="text-2xl font-serif font-bold mb-2">Ready to Guide Others?</h3>
                  <p className="mb-6 font-medium opacity-80">Your journey can inspire others. Unlock mentor features to help younger planters grow.</p>
                  <button onClick={onUpgrade} className="bg-earth-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-earth-800 transition-colors">Become a Mentor</button>
              </div>
              <div className="hidden md:block opacity-20"><UserCog size={120} /></div>
          </section>
      )}
    </div>
  );
};

const LifePlan = () => {
    const [activeTab, setActiveTab] = useState('Purpose');
    const [sections, setSections] = useState<Record<string, string>>({
        Purpose: "To glorify God by...",
        Vision: "I see a future where...",
        Mission: "I will achieve this by...",
        Values: "Integrity, Compassion, ..."
    });

    const handleUpdate = (val: string) => {
        setSections(prev => ({ ...prev, [activeTab]: val }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-32">
             <div className="bg-earth-100 p-8 rounded-3xl text-earth-800 shadow-sm border border-earth-200">
                <h2 className="text-3xl font-serif font-bold">Life Plan</h2>
                <p className="opacity-80 mt-2">Defined by your roots.</p>
             </div>

             <div className="bg-white rounded-3xl shadow-sm border border-earth-100 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
                 <div className="w-full md:w-64 bg-earth-50 p-4 border-r border-earth-100 flex flex-row md:flex-col gap-2 overflow-x-auto">
                     {Object.keys(sections).map(key => (
                         <button 
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`p-4 rounded-xl font-bold text-left transition-all ${activeTab === key ? 'bg-white shadow-md text-nature-700 border border-earth-100' : 'text-earth-500 hover:bg-earth-100'}`}
                         >
                             {key}
                         </button>
                     ))}
                 </div>
                 <div className="flex-1 p-8">
                     <h3 className="text-2xl font-bold text-earth-800 mb-4">{activeTab}</h3>
                     <textarea 
                        className="w-full h-[400px] p-6 bg-earth-50 rounded-2xl border border-earth-200 outline-none focus:ring-2 focus:ring-nature-200 resize-none font-serif text-lg leading-relaxed text-earth-700"
                        value={sections[activeTab]}
                        onChange={e => handleUpdate(e.target.value)}
                     />
                 </div>
             </div>
        </div>
    );
};

const Bible = ({ notes, setNotes }: { notes: BibleNote[], setNotes: React.Dispatch<React.SetStateAction<BibleNote[]>> }) => {
    const [reference, setReference] = useState('');
    const [verseText, setVerseText] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!reference) return;
        setLoading(true);
        const text = await getBibleVerse(reference);
        setVerseText(text);
        setLoading(false);
    };

    const handleSave = () => {
        if (!reference || !verseText) return;
        const newNote: BibleNote = {
            id: Date.now().toString(),
            reference,
            text: verseText,
            note,
            date: new Date().toISOString()
        };
        setNotes(prev => [newNote, ...prev]);
        setNote('');
        setReference('');
        setVerseText('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-32">
            <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-serif font-bold text-earth-900">Scripture & Notes</h2>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-lg border border-earth-100">
                <div className="flex gap-2 mb-4">
                    <input 
                        className="flex-1 p-3 bg-earth-50 border border-earth-200 rounded-xl font-bold"
                        placeholder="Enter Reference (e.g. Psalm 23:1)"
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button 
                        onClick={handleSearch}
                        disabled={loading}
                        className="bg-earth-800 text-white px-6 rounded-xl font-bold hover:bg-earth-900 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : 'Search'}
                    </button>
                </div>

                {verseText && (
                    <div className="mb-6 animate-slide-down">
                        <blockquote className="border-l-4 border-nature-500 pl-4 py-2 italic text-lg text-earth-700 bg-earth-50 rounded-r-xl mb-4">
                            "{verseText}"
                        </blockquote>
                        <textarea 
                            className="w-full p-4 bg-earth-50 border border-earth-200 rounded-xl min-h-[100px] outline-none focus:ring-2 focus:ring-nature-200"
                            placeholder="Write your reflection here..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                            <button onClick={handleSave} className="flex items-center gap-2 bg-nature-600 text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-nature-700">
                                <Save size={18}/> Save Note
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map(n => (
                    <div key={n.id} className="bg-white p-5 rounded-2xl border border-earth-200 shadow-sm hover:shadow-md transition-shadow group relative">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setNotes(prev => prev.filter(x => x.id !== n.id)) }}
                            className="absolute top-2 right-2 text-earth-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16}/>
                        </button>
                        <h4 className="font-bold text-earth-900 mb-1 flex items-center gap-2"><BookOpen size={16} className="text-nature-600"/> {n.reference}</h4>
                        <p className="text-earth-500 text-xs mb-3">{new Date(n.date).toLocaleDateString()}</p>
                        <p className="text-earth-700 italic text-sm border-l-2 border-earth-200 pl-2 mb-2 line-clamp-2">"{n.text}"</p>
                        <p className="text-earth-800 text-sm mt-2">{n.note}</p>
                    </div>
                ))}
                {notes.length === 0 && (
                    <div className="md:col-span-2 text-center py-12 text-earth-400">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>No notes yet. Search a verse to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const Calendar = ({ goals, notes, meetings, addMeeting }: { goals: Goal[], notes: BibleNote[], meetings: MentorMeeting[], addMeeting: (m: MentorMeeting) => void }) => {
    // Simplified Calendar View
    const today = new Date();
    const [showSchedule, setShowSchedule] = useState(false);
    const [newMeeting, setNewMeeting] = useState<Partial<MentorMeeting>>({ date: '', time: '', topic: '' });

    const upcomingEvents = [
        ...goals.filter(g => g.timeBound.dueDate).map(g => ({ type: 'GOAL', date: g.timeBound.dueDate, title: `Goal Due: ${g.title}`, id: g.id })),
        ...meetings.map(m => ({ type: 'MEETING', date: m.date, title: `Mentor Meeting: ${m.topic}`, id: m.id, time: m.time }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const handleSchedule = () => {
        if (newMeeting.date && newMeeting.time && newMeeting.topic) {
            addMeeting({
                id: Date.now().toString(),
                date: newMeeting.date,
                time: newMeeting.time,
                topic: newMeeting.topic,
                status: 'SCHEDULED'
            });
            setShowSchedule(false);
            setNewMeeting({ date: '', time: '', topic: '' });
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-32">
             <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-serif font-bold text-earth-900">Calendar</h2>
                 <button onClick={() => setShowSchedule(true)} className="bg-earth-800 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                     <Plus size={20}/> Schedule Meeting
                 </button>
             </div>

             {showSchedule && (
                 <div className="bg-white p-6 rounded-2xl shadow-lg border border-earth-100 animate-slide-down">
                     <h3 className="font-bold text-earth-800 mb-4">Schedule Mentor Meeting</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <input type="date" className="p-3 bg-earth-50 border rounded-xl" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
                         <input type="time" className="p-3 bg-earth-50 border rounded-xl" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} />
                     </div>
                     <input className="w-full p-3 bg-earth-50 border rounded-xl mb-4" placeholder="Topic to discuss..." value={newMeeting.topic} onChange={e => setNewMeeting({...newMeeting, topic: e.target.value})} />
                     <div className="flex gap-2">
                         <button onClick={() => setShowSchedule(false)} className="px-4 py-2 text-earth-500 font-bold">Cancel</button>
                         <button onClick={handleSchedule} className="px-4 py-2 bg-nature-600 text-white rounded-xl font-bold">Confirm</button>
                     </div>
                 </div>
             )}

             <div className="bg-white rounded-3xl shadow-sm border border-earth-100 overflow-hidden">
                 <div className="p-4 bg-earth-50 border-b border-earth-200 font-bold text-earth-500 uppercase text-xs tracking-wider">Upcoming Events</div>
                 {upcomingEvents.length === 0 ? (
                     <div className="p-8 text-center text-earth-400">No upcoming events.</div>
                 ) : (
                     <div className="divide-y divide-earth-100">
                         {upcomingEvents.map((evt, idx) => (
                             <div key={idx} className="p-4 flex items-center gap-4 hover:bg-earth-50 transition-colors">
                                 <div className={`p-3 rounded-xl ${evt.type === 'GOAL' ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                                     {evt.type === 'GOAL' ? <Target size={20}/> : <Users size={20}/>}
                                 </div>
                                 <div className="flex-1">
                                     <h4 className="font-bold text-earth-800">{evt.title}</h4>
                                     <p className="text-xs text-earth-500">{new Date(evt.date).toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})} {evt.time ? `@ ${evt.time}` : ''}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                 )}
             </div>
        </div>
    );
};

const Profile = ({ user, setUser, goals, bibleNotes, savedQuotes }: { user: UserProfile, setUser: any, goals: Goal[], bibleNotes: BibleNote[], savedQuotes: SavedQuote[] }) => {
    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-32">
             <div className="bg-white rounded-3xl p-8 shadow-sm border border-earth-100 text-center">
                 <div className="w-24 h-24 mx-auto bg-earth-800 rounded-full flex items-center justify-center text-white text-3xl font-serif font-bold mb-4 shadow-lg border-4 border-earth-100">
                     {user.name.charAt(0)}
                 </div>
                 <h2 className="text-2xl font-bold text-earth-900">{user.name}</h2>
                 <span className="inline-block mt-1 px-3 py-1 bg-nature-100 text-nature-800 text-xs font-bold rounded-full uppercase tracking-wider">{user.role === 'MENTEE' ? 'Planter' : 'Mentor'}</span>
                 
                 <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-earth-100">
                     <div>
                         <div className="text-2xl font-bold text-earth-800">{goals.filter(g => g.progress === 100).length}</div>
                         <div className="text-[10px] uppercase text-earth-400 font-bold">Goals Met</div>
                     </div>
                     <div>
                         <div className="text-2xl font-bold text-earth-800">{bibleNotes.length}</div>
                         <div className="text-[10px] uppercase text-earth-400 font-bold">Notes</div>
                     </div>
                     <div>
                         <div className="text-2xl font-bold text-earth-800">{savedQuotes.length}</div>
                         <div className="text-[10px] uppercase text-earth-400 font-bold">Quotes</div>
                     </div>
                 </div>
             </div>

             <div className="space-y-4">
                 <h3 className="font-bold text-earth-800 ml-2">Saved Quotes</h3>
                 {savedQuotes.map(q => (
                     <div key={q.id} className="bg-white p-4 rounded-2xl border border-earth-100 shadow-sm">
                         <p className="font-serif italic text-earth-700 mb-2">"{q.text}"</p>
                         <p className="text-xs font-bold text-earth-400">— {q.author}</p>
                     </div>
                 ))}
                 {savedQuotes.length === 0 && <p className="text-center text-earth-400 text-sm">No saved quotes yet.</p>}
             </div>
             
             <button onClick={() => setUser(null)} className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors">Sign Out</button>
        </div>
    );
};

// --- Main App Layout ---

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bibleNotes, setBibleNotes] = useState<BibleNote[]>([]);
  const [mentorMeetings, setMentorMeetings] = useState<MentorMeeting[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<{ text: string; author: string } | null>(null);
  
  // Controls if we are VIEWING as a mentor (only available if user role is Mentor)
  const [isMentorMode, setIsMentorMode] = useState(false);

  useEffect(() => {
    getDailyQuote().then(setDailyQuote);
  }, []);

  const handleSignIn = (role: UserRole, name: string) => {
    setUser({ name, role, joinedAt: Date.now() });
    setIsMentorMode(role === 'MENTOR'); // Default to mentor view if signing in as mentor
  };

  const handleUpgradeToMentor = () => {
    if (user) {
        setUser({ ...user, role: 'MENTOR' });
        setIsMentorMode(true);
        // In a real app, show a confetti or celebration modal here
    }
  };

  const handleSaveQuote = (quote: { text: string; author: string }) => {
      setSavedQuotes(prev => [...prev, { id: Date.now().toString(), text: quote.text, author: quote.author, dateSaved: Date.now() }]);
  };

  const addMentorMeeting = (meeting: MentorMeeting) => {
      setMentorMeetings(prev => [...prev, meeting]);
  };

  const NavItem = ({ v, icon: Icon, label }: { v: View, icon: any, label: string }) => (
    <button 
      onClick={() => setView(v)}
      className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all duration-300 ${view === v ? 'text-earth-800 bg-gold-200 shadow-sm' : 'text-earth-500 hover:text-earth-700 hover:bg-earth-100'}`}
    >
      <Icon size={24} strokeWidth={view === v ? 2.5 : 2} />
      <span className="text-[10px] font-bold tracking-wide uppercase">{label}</span>
    </button>
  );

  // If not signed in, show SignIn Page
  if (!user) {
      return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-earth-50 font-sans text-earth-900 flex flex-col">
      {/* Top Bar (Mobile/Desktop) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-earth-200 px-6 py-4 flex justify-between items-center transition-colors duration-500">
         <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(View.DASHBOARD)}>
            <div className={`${isMentorMode ? 'bg-earth-900' : 'bg-earth-800'} p-2 rounded-lg text-white transition-colors duration-500`}>
                <Leaf size={20} />
            </div>
            <div>
                <h1 className="text-2xl font-serif font-bold tracking-tight text-earth-900">Arbor</h1>
                <p className="text-[10px] uppercase tracking-wider text-earth-500 font-bold">{user.role === 'MENTEE' ? 'Planter' : 'Mentor'}</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
             <button onClick={() => setView(View.CALENDAR)} className="hidden md:block p-2 text-earth-600 hover:bg-earth-100 rounded-full" title="Calendar">
                 <CalendarIcon size={20} />
             </button>
             
             {/* Only show toggle if user is actually a Mentor */}
             {user.role === 'MENTOR' && (
                <button 
                    onClick={() => setIsMentorMode(!isMentorMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${isMentorMode ? 'bg-earth-800 text-white' : 'bg-earth-100 text-earth-600 hover:bg-earth-200'}`}
                >
                    <UserCog size={16} />
                    {isMentorMode ? 'Mentor View' : 'Personal View'}
                </button>
             )}
             
             <div className="hidden md:flex gap-2 items-center cursor-pointer hover:opacity-80" onClick={() => setView(View.PROFILE)}>
                <span className="text-sm font-bold text-earth-700">{user.name}</span>
                <div className="w-10 h-10 rounded-full bg-nature-700 border-2 border-white shadow-md flex items-center justify-center text-white font-serif font-bold overflow-hidden">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        user.name.charAt(0)
                    )}
                </div>
             </div>
         </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {view === View.DASHBOARD && (
            <Dashboard 
                quote={dailyQuote} 
                goals={goals}
                bibleNotes={bibleNotes} 
                setView={setView} 
                isMentorMode={isMentorMode} 
                userRole={user.role}
                onUpgrade={handleUpgradeToMentor}
                setGoals={setGoals}
                onSaveQuote={handleSaveQuote}
            />
        )}
        {view === View.LIFE_PLAN && <LifePlan />}
        {view === View.GOALS && <Goals goals={goals} setGoals={setGoals} isMentorMode={isMentorMode} />}
        {view === View.DECISIONS && <DecisionTool />}
        {view === View.BIBLE && <Bible notes={bibleNotes} setNotes={setBibleNotes} />}
        {view === View.MENTORSHIP && <Mentorship />}
        {view === View.COMMUNITY && <Community />}
        {view === View.CALENDAR && <Calendar goals={goals} notes={bibleNotes} meetings={mentorMeetings} addMeeting={addMentorMeeting} />}
        {view === View.PROFILE && <Profile user={user} setUser={setUser} goals={goals} bibleNotes={bibleNotes} savedQuotes={savedQuotes} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-earth-200 p-2 px-4 flex justify-between md:justify-center md:gap-8 z-50 shadow-lg pb-safe">
        <NavItem v={View.DASHBOARD} icon={LayoutDashboard} label="Home" />
        <NavItem v={View.LIFE_PLAN} icon={Compass} label="Plan" />
        <NavItem v={View.GOALS} icon={Target} label="Goals" />
        <NavItem v={View.CALENDAR} icon={CalendarIcon} label="Calendar" />
        <NavItem v={View.BIBLE} icon={BookOpen} label="Bible" />
      </nav>

      {/* Tailwind Utility for Safe Area Padding on Mobile */}
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
        .animate-slide-down { animation: slideDown 0.3s ease-out forwards; }
        .animate-blob { animation: blob 7s infinite; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .line-through-decoration { text-decoration-color: #663a2f; text-decoration-thickness: 2px; opacity: 0.5; }
      `}</style>
    </div>
  );
}

export default App;
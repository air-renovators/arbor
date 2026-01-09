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
import { getDailyQuote, getBibleVerse, getMentorshipAdvice, analyzeDecision } from './geminiService';
import VoiceInput from './VoiceInput';
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
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                               <div>
                                                  <label className="text-xs font-bold text-earth-500 uppercase mb-1">Frequency</label>
                                                  <select 
                                                      className="w-full bg-white border border-earth-200 p-2 rounded-lg text-sm"
                                                      value={step.frequency || 'Once'}
                                                      onChange={e => updateActionStep(step.id, 'frequency', e.target.value)}
                                                  >
                                                      <option value="Once">Once</option>
                                                      <option value="Daily">Daily</option>
                                                      <option value="Weekly">Weekly</option>
                                                      <option value="Monthly">Monthly</option>
                                                  </select>
                                               </div>
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
}

// --- App Component ---
const App = () => {
  const [user, setUser] = useState<{ role: UserRole; name: string } | null>(null);
  const [view, setView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bibleNotes, setBibleNotes] = useState<BibleNote[]>([]);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [dailyQuote, setDailyQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      const q = await getDailyQuote();
      setDailyQuote(q);
    };
    fetchQuote();
  }, []);

  const handleSignIn = (role: UserRole, name: string) => {
    setUser({ role, name });
  };

  const handleSaveQuote = (q: { text: string; author: string }) => {
    const newQuote: SavedQuote = {
      id: Date.now().toString(),
      text: q.text,
      author: q.author,
      dateSaved: Date.now()
    };
    setSavedQuotes(prev => [...prev, newQuote]);
  };

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  const renderContent = () => {
    switch (view) {
      case View.DASHBOARD:
        return (
          <Dashboard
            quote={dailyQuote}
            goals={goals}
            bibleNotes={bibleNotes}
            setView={setView}
            isMentorMode={user.role === 'MENTOR'}
            userRole={user.role}
            onUpgrade={() => setUser(prev => prev ? { ...prev, role: 'MENTOR' } : null)}
            setGoals={setGoals}
            onSaveQuote={handleSaveQuote}
          />
        );
      case View.GOALS:
        return <Goals goals={goals} setGoals={setGoals} isMentorMode={user.role === 'MENTOR'} />;
      case View.DECISIONS:
        return <DecisionTool />;
      case View.MENTORSHIP:
        return <Mentorship />;
      case View.COMMUNITY:
        return <Community />;
      case View.BIBLE:
          return (
            <div className="max-w-4xl mx-auto pb-32 animate-fade-in">
                 <div className="bg-blue-800 p-8 rounded-3xl text-white shadow-lg mb-6">
                    <h2 className="text-3xl font-serif font-bold flex items-center gap-3"><BookOpen /> Scripture Study</h2>
                    <p className="opacity-90 mt-2">Meditate on the word.</p>
                 </div>
                 <div className="p-12 text-center bg-white rounded-3xl border border-earth-100 text-earth-400">
                     <p>Bible Study Module Placeholder</p>
                 </div>
            </div>
          );
      default:
        return <div className="p-8 text-center text-earth-500">Feature coming soon...</div>;
    }
  };

  return (
    <div className="flex h-screen bg-earth-50">
       {/* Sidebar for Desktop */}
       <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-earth-900 text-earth-100 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl`}>
          <div className="p-6 flex justify-between items-center">
             <div className="text-2xl font-serif font-bold flex items-center gap-2">
                <Leaf className="text-nature-500" /> Arbor
             </div>
             <button className="lg:hidden text-earth-400" onClick={() => setIsSidebarOpen(false)}><X /></button>
          </div>
          
          <div className="px-6 mb-6">
             <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                 <div className="w-10 h-10 rounded-full bg-nature-600 flex items-center justify-center font-bold text-white">
                     {user.name.charAt(0)}
                 </div>
                 <div className="overflow-hidden">
                     <p className="font-bold text-white truncate">{user.name}</p>
                     <p className="text-xs text-earth-300 uppercase font-bold tracking-wider">{user.role}</p>
                 </div>
             </div>
          </div>

          <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
             <button onClick={() => { setView(View.DASHBOARD); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${view === View.DASHBOARD ? 'bg-nature-700 text-white font-bold' : 'text-earth-300 hover:bg-white/10 hover:text-white'}`}>
                <LayoutDashboard size={20}/> Dashboard
             </button>
             <button onClick={() => { setView(View.GOALS); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${view === View.GOALS ? 'bg-nature-700 text-white font-bold' : 'text-earth-300 hover:bg-white/10 hover:text-white'}`}>
                <Target size={20}/> Goals
             </button>
             <button onClick={() => { setView(View.DECISIONS); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${view === View.DECISIONS ? 'bg-nature-700 text-white font-bold' : 'text-earth-300 hover:bg-white/10 hover:text-white'}`}>
                <Compass size={20}/> Decisions
             </button>
             <button onClick={() => { setView(View.BIBLE); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${view === View.BIBLE ? 'bg-nature-700 text-white font-bold' : 'text-earth-300 hover:bg-white/10 hover:text-white'}`}>
                <BookOpen size={20}/> Bible
             </button>
             <button onClick={() => { setView(View.MENTORSHIP); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${view === View.MENTORSHIP ? 'bg-nature-700 text-white font-bold' : 'text-earth-300 hover:bg-white/10 hover:text-white'}`}>
                <MessageCircle size={20}/> Mentor
             </button>
             <button onClick={() => { setView(View.COMMUNITY); setIsSidebarOpen(false); }} className={`flex items-center gap-3 w-full p-3 rounded-xl transition-colors ${view === View.COMMUNITY ? 'bg-nature-700 text-white font-bold' : 'text-earth-300 hover:bg-white/10 hover:text-white'}`}>
                <Users size={20}/> Community
             </button>
          </nav>
          <div className="p-6 border-t border-white/10">
              <button onClick={() => setUser(null)} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-all">
                  <Users size={20}/> Sign Out
              </button>
          </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="lg:hidden p-4 bg-white border-b border-earth-200 flex justify-between items-center z-40">
             <div className="font-serif font-bold text-xl text-earth-800 flex items-center gap-2">
                <Leaf className="text-nature-600"/> Arbor
             </div>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu /></button>
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
             {renderContent()}
          </main>
       </div>
    </div>
  );
};

export default App;
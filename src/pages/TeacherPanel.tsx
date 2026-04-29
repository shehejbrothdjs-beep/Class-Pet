import React, { useState, useEffect } from 'react';
import { User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAppStore, initSync } from '../lib/store';
import { createStudent, updateStudentPoints, updateClassPin } from '../lib/db';
import { LogOut, Plus, Search, Check, AlertCircle, Home, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const colors = ['red', 'blue', 'green', 'purple', 'yellow'];
const EVOLUTION_POOL = ['Crown', 'Wings', 'Star', 'Aura', 'Glasses'];

export default function TeacherPanel({ user }: { user: User | null }) {
  const { settings, loading } = useAppStore();
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  useEffect(() => {
    let unsub = () => {};
    if (user) {
      unsub = initSync();
    }
    return () => unsub();
  }, [user]);

  const handleAuth = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch(e) {
      console.error(e);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings?.classPin && passwordInput === settings.classPin) {
      setUnlocked(true);
    } else {
      alert("密码错误");
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 3) {
      alert("密码至少 3 位");
      return;
    }
    await updateClassPin(passwordInput);
    setUnlocked(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
            <Home className="w-4 h-4"/> 返回首页
          </Link>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center border-4 border-neutral-100">
          <h2 className="text-2xl font-black text-[var(--color-duo-purple)] mb-4">👑 教师登录</h2>
          <p className="text-neutral-500 font-bold mb-6 text-sm">初次使用？无需繁琐注册<br/>直接点击下方按钮验证 Google 身份即可进入您的班级管理后台。</p>
          <button 
            onClick={handleAuth}
            className="w-full bg-[var(--color-duo-blue)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-blue active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            Google 账号一键登录
          </button>
        </div>
      </div>
    );
  }

  if (loading || !settings) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-100 text-[var(--color-duo-purple)] font-black text-xl">加载数据中...</div>;
  }

  if (!settings.classPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center border-4 border-neutral-100">
          <h2 className="text-2xl font-black text-[var(--color-duo-green)] mb-4">🎉 欢迎! 首次配置</h2>
          <p className="text-neutral-500 font-bold mb-6 text-sm">为保障班级数据安全，请设置一个您的专属管理密码。</p>
          <form onSubmit={handleSetPin}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-4 font-bold text-center text-xl mb-4 outline-none focus:ring-4 ring-[var(--color-duo-green-dark)]"
              placeholder="输入新密码"
            />
            <button 
              type="submit"
              className="w-full bg-[var(--color-duo-green)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-green active:translate-y-1 active:shadow-none transition-all"
            >
              设置密码并进入
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
            <Home className="w-4 h-4"/> 返回首页
          </Link>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center border-4 border-neutral-100">
          <h2 className="text-2xl font-black text-[var(--color-duo-purple)] mb-4">🔒 安全验证</h2>
          <p className="text-neutral-500 font-bold mb-6 text-sm">请输入班级管理密码</p>
          <form onSubmit={handleUnlock}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-4 font-bold text-center text-xl mb-4 outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              placeholder="密码"
            />
            <button 
              type="submit"
              className="w-full bg-[var(--color-duo-purple)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-purple active:translate-y-1 active:shadow-none transition-all"
            >
              验证进入
            </button>
          </form>
          <button 
            onClick={() => signOut(auth)}
            className="mt-6 text-neutral-400 hover:text-neutral-600 font-bold text-sm"
          >
            切换账号退出
          </button>
        </div>
      </div>
    );
  }

  return <TeacherDashboard user={user} />;
}

function TeacherDashboard({ user }: { user: User }) {
  const { students, settings, loading } = useAppStore();
  const [newStudentName, setNewStudentName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    
    await createStudent({
      id: "std_" + Date.now(),
      name: newStudentName.trim(),
      nickname: newStudentName.trim() + "的宠物",
      eggColor: colors[Math.floor(Math.random() * colors.length)],
      exp: 0,
      level: 1,
      effects: [],
    });
    setNewStudentName("");
    showToast("添加成功！");
  };

  const showToast = (msg: string) => {
    setToast({ msg, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B']
    });
  };

  const handleAction = async (points: number, actionName: string) => {
    if (selectedStudents.length === 0) {
      alert("请先选择学生！");
      return;
    }

    const promises = selectedStudents.map(async (id) => {
      const student = students.find(s => s.id === id);
      if (!student) return;
      
      let newExp = student.exp + points;
      let newLevel = student.level;
      let newEffects = [...student.effects];

      // PRD: No level down on negative points
      if (points < 0 && newExp < 0) {
        newExp = 0; 
      } else if (points > 0) {
        // Evaluate level up (e.g. 50 exp per level)
        const calculatedLevel = Math.floor(newExp / 50) + 1;
        if (calculatedLevel > newLevel) {
          newLevel = calculatedLevel;
          // Unlock an effect
          const available = EVOLUTION_POOL.filter(e => !newEffects.includes(e));
          if (available.length > 0) {
            newEffects.push(available[Math.floor(Math.random() * available.length)]);
          }
          if (selectedStudents.length === 1) fireConfetti();
        }
      }

      await updateStudentPoints(id, points, newLevel, newEffects, user.uid, actionName);
    });

    await Promise.all(promises);
    showToast(`批量操作成功: ${actionName}`);
    setSelectedStudents([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (loading) return <div>Loading...</div>;

  const filtered = students.filter(s => s.name.includes(searchTerm));

  return (
    <div className="min-h-screen bg-neutral-100 flex pb-32 relative">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-[var(--color-duo-purple)] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
          <Home className="w-5 h-5"/> 返回主页
        </Link>
      </div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 bg-[var(--color-duo-green)] text-white px-6 py-3 rounded-2xl shadow-xl font-black flex items-center z-50 gap-2"
          >
            <Check className="w-5 h-5"/> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 p-8 pt-20 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-[var(--color-duo-purple)] mb-2">教师工作台</h1>
            <p className="text-neutral-500 font-bold">批量管理、快捷加减分、密码管理</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                const newPin = prompt("请输入新的班级管理密码（至少3位）：");
                if (newPin && newPin.length >= 3) {
                  await updateClassPin(newPin);
                  alert("密码修改成功！");
                } else if (newPin !== null) {
                  alert("密码修改失败：至少需要3位");
                }
              }}
              className="flex items-center gap-2 text-neutral-400 hover:text-[var(--color-duo-purple)] font-bold transition-colors"
            >
              <KeyRound className="w-5 h-5" /> 修改密码
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="flex items-center gap-2 text-neutral-400 hover:text-red-500 font-bold transition-colors"
            >
              <LogOut className="w-5 h-5" /> 退出
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-white rounded-2xl flex items-center px-4 border-2 border-neutral-200">
                <Search className="w-5 h-5 text-neutral-400" />
                <input 
                  className="bg-transparent border-none outline-none p-3 w-full font-bold text-neutral-700" 
                  placeholder="搜索学生..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setSelectedStudents(students.map(s => s.id))}
                className="bg-neutral-200 text-neutral-600 px-4 rounded-2xl font-bold hover:bg-neutral-300"
              >
                全选
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(student => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <motion.div 
                    whileTap={{ scale: 0.96 }}
                    key={student.id}
                    onClick={() => toggleSelect(student.id)}
                    className={`cursor-pointer rounded-2xl p-4 border-4 transition-all relative ${isSelected ? 'border-[var(--color-duo-blue)] bg-blue-50' : 'border-transparent bg-white shadow-sm'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-2xl">
                         {/* Simple visual fallback for teacher view */}
                         {student.level >= 5 ? '🐉' : (student.level >= 2 ? '🐥' : '🥚')}
                      </div>
                      <div>
                        <div className="font-black text-neutral-800">{student.name}</div>
                        <div className="text-xs font-bold text-neutral-400">EXP: {student.exp} | Lv.{student.level}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-[var(--color-duo-blue)] rounded-full text-white w-6 h-6 flex items-center justify-center border-2 border-white">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Add Student */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-neutral-100">
              <h3 className="font-black text-xl mb-4 text-neutral-800">添加学生</h3>
              <form onSubmit={handleAddStudent} className="flex gap-3 items-center pb-1 lg:pb-0">
                <input 
                  className="flex-1 min-w-0 bg-neutral-100 rounded-xl p-3 px-4 font-bold outline-none focus:ring-2 ring-[var(--color-duo-green)] text-neutral-700" 
                  placeholder="输入姓名"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                />
                <button type="submit" className="bg-[var(--color-duo-green)] text-white w-14 h-14 shrink-0 rounded-[1rem] flex items-center justify-center shadow-btn-green active:translate-y-1 active:shadow-none transition-all">
                  <Plus className="w-6 h-6" />
                </button>
              </form>
            </div>

            {/* Actions panel */}
            <div className="bg-white rounded-3xl justify-center items-center p-6 shadow-sm border-2 border-neutral-100 sticky top-8">
              <h3 className="font-black text-xl mb-2 text-neutral-800">快捷操作</h3>
              <p className="text-sm text-neutral-400 font-bold mb-4">
                当前选中: <span className="text-[var(--color-duo-blue)]">{selectedStudents.length}</span> 人
              </p>

              <div className="space-y-6">
                <div>
                  <div className="text-sm font-black text-[var(--color-duo-green)] mb-3 flex items-center gap-1"><Plus className="w-4 h-4"/> 正向行为 (加分)</div>
                  <div className="flex flex-wrap gap-2">
                    {settings?.rules.filter(r => r.type === 'positive').map(rule => (
                      <button 
                        key={rule.id}
                        onClick={() => handleAction(rule.points, rule.name)}
                        className="bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
                      >
                        {rule.name} (+{rule.points})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-black text-[var(--color-duo-red)] mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> 负向行为 (扣分)</div>
                  <div className="flex flex-wrap gap-2">
                    {settings?.rules.filter(r => r.type === 'negative').map(rule => (
                      <button 
                        key={rule.id}
                        onClick={() => handleAction(rule.points, rule.name)}
                        className="bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
                      >
                        {rule.name} ({rule.points})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

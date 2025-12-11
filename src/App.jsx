import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Heart, MessageCircle, Gift, Bell, Sparkles, Smile, Frown, Meh, Megaphone, X, Send, Settings, ChevronRight, LogOut, Image as ImageIcon, Coins, Pencil, Trash2, Loader2, Lock, Clock, Award, Wallet, Building2, CornerDownRight, Link as LinkIcon, MapPin, Search, Key, Edit3, ClipboardList, CheckSquare, ChevronLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- [필수] Supabase 설정 ---
const SUPABASE_URL = 'https://clsvsqiikgnreqqvcrxj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc3ZzcWlpa2ducmVxcXZjcnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzcyNjAsImV4cCI6MjA4MDk1MzI2MH0.lsaycyp6tXjLwb-qB5PIQ0OqKweTWO2WaxZG5GYOUqk';

// --- 상수 데이터 ---
const ORGANIZATION = {
  '본사': ['보상기획팀', '보상지원팀', 'A&H손해사정지원팀', '고객지원팀'],
  '서울보상부': ['강북대물', '남양주대물', '강남대물', '일산대물', '서울외제차', '강원보상', '동부대인', '서부대인'],
  '경인보상부': ['경인', '인천대물', '강서대물', '성남대물', '수원대물', '경인외제차', '경기대인', '인천대인'],
  '중부보상부': ['중부', '대전대물', '광주대물', '전주대물', '청주대물', '대전대인', '광주대인'],
  '남부보상부': ['남부', '대구대물', '경북대물', '부산대물', '경남대물', '제주보상', '대구대인', '부산대인'],
  '스마트보상부': ['스마트지원', '스피드대물', '프라임대물1', '스피드대인', '프라임대인1', '프라임대인2', '프라임대인3'],
  '특수보상부': ['특수조사센터', '구상보상1', '구상보상2', '의료', 'SIU'],
  'A&H보상부': ['A&H보상1', 'A&H보상2'],
  '사당CS부': ['사당CS'],
  '대구CS부': ['대구CS']
};

const REGIONS = {
    '서울': ['강남구', '서초구', '송파구', '종로구', '마포구', '용산구', '성동구'],
    '경기': ['성남시', '수원시', '용인시', '고양시', '화성시', '안양시'],
    '인천': ['연수구', '남동구', '부평구'],
    '부산': ['해운대구', '수영구', '부산진구'],
    '대구': ['수성구', '중구'],
    '대전': ['유성구', '서구'],
    '광주': ['광산구', '서구'],
    '제주': ['제주시', '서귀포시']  
};

const INITIAL_POINTS = 3000; 
const AXA_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/9/94/AXA_Logo.svg"; 
const ADMIN_EMAIL = "jongpil.kim@axa.co.kr"; 

// --- Helper Functions ---
const formatName = (name) => {
  if (!name) return '';
  if (/[가-힣]{2,}/.test(name)) {
      return name.substring(1); 
  }
  return name; 
};

const formatInitial = (name) => {
    if (!name) return '';
    return name.charAt(0);
};

const getWeeklyBirthdays = (profiles) => {
    if (!profiles || profiles.length === 0) return { current: [], next: [] };

    const today = new Date();
    const currentYear = today.getFullYear();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); 
    const endOfCurrentWeek = new Date(startOfWeek);
    endOfCurrentWeek.setDate(startOfWeek.getDate() + 7);

    const endOfNextWeek = new Date(endOfCurrentWeek);
    endOfNextWeek.setDate(endOfCurrentWeek.getDate() + 7);

    const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const normalizedToday = normalizeDate(new Date());

    const currentBirthdays = [];
    const nextBirthdays = [];

    profiles.forEach(p => {
        if (!p.birthdate) return;
        const [_, m, d] = p.birthdate.split('-').map(Number);
        const birthDate = new Date(currentYear, m - 1, d); 
        let normalizedBirthDate = normalizeDate(birthDate);

        if (normalizedBirthDate.getTime() === normalizedToday.getTime()) return; 
        
        if (normalizedBirthDate < normalizedToday) {
             const nextYearBirthDate = new Date(currentYear + 1, m - 1, d);
             normalizedBirthDate = normalizeDate(nextYearBirthDate);
        }
        
        const typeLabel = p.calendar_type === 'lunar' ? '(-)' : '(+)';

        if (normalizedBirthDate >= normalizedToday && normalizedBirthDate < normalizeDate(endOfCurrentWeek)) {
             currentBirthdays.push({ name: p.name, date: `${m}/${d}`, typeLabel });
        } 
        else if (normalizedBirthDate >= normalizeDate(endOfCurrentWeek) && normalizedBirthDate < normalizeDate(endOfNextWeek)) {
             nextBirthdays.push({ name: p.name, date: `${m}/${d}`, typeLabel });
        }
    });

    return { current: currentBirthdays, next: nextBirthdays };
};

const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

// --- Sub Components ---

const MoodToast = ({ message, emoji, visible }) => {
    if (!visible) return null;
    return (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-up w-[90%] max-w-sm">
            <div className="bg-slate-800/90 backdrop-blur-sm text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
                <span className="text-3xl">{emoji}</span>
                <span className="text-sm font-bold leading-relaxed">{message}</span>
            </div>
        </div>
    );
};

const AdminAlertModal = ({ onClose }) => {
    const [doNotShow, setDoNotShow] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl relative">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-500">
                    <Bell className="w-5 h-5"/> 알림
                </h3>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                    📢 <strong>처리되지 않은 포인트 차감 신청</strong>이 있습니다.<br/>
                    설정 메뉴에서 내역을 확인해주세요.
                </p>
                
                <div className="flex items-center gap-2 mb-4 bg-slate-50 p-2 rounded-lg cursor-pointer" onClick={() => setDoNotShow(!doNotShow)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${doNotShow ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                        {doNotShow && <CheckSquare className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs text-slate-500 select-none">오늘 하루 더 이상 열지 않기</span>
                </div>

                <button 
                    onClick={() => onClose(doNotShow)} 
                    className="w-full bg-slate-800 text-white p-3 rounded-xl font-bold hover:bg-slate-900 transition-colors"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

const AuthForm = ({ isSignupMode, setIsSignupMode, handleLogin, handleSignup, loading }) => {
  const [birthdate, setBirthdate] = useState('');
  const [calendarType, setCalendarType] = useState('solar'); 
  const [selectedDept, setSelectedDept] = useState(''); 

  return (
    <div className="min-h-screen bg-blue-50 flex justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 border border-blue-100 animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-400 to-blue-600"></div>
        <div className="text-center mb-10 mt-6 flex flex-col items-center">
          <img src={AXA_LOGO_URL} alt="AXA Logo" className="w-20 h-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">AXA Connect</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">함께 만드는 스마트한 조직문화 🚀</p>
          </div>

        {isSignupMode ? (
          <form onSubmit={handleSignup} className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">이름</label><input name="name" type="text" placeholder="홍길동" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:border-blue-500 transition-colors" required /></div>
            
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">생년월일</label>
                <div className="flex gap-2">
                    <input name="birthdate" type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm text-slate-600 focus:border-blue-500 transition-colors" required />
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 shrink-0">
                         <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name="calendarType" value="solar" checked={calendarType === 'solar'} onChange={() => setCalendarType('solar')} className="w-3 h-3 text-blue-600" />
                             <span className="text-xs text-slate-600">양력</span>
                         </label>
                         <label className="flex items-center gap-1 cursor-pointer">
                             <input type="radio" name="calendarType" value="lunar" checked={calendarType === 'lunar'} onChange={() => setCalendarType('lunar')} className="w-3 h-3 text-blue-600" />
                             <span className="text-xs text-slate-600">음력</span>
                         </label>
                    </div>
                </div>
            </div>

            <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">이메일</label><input name="email" type="email" placeholder="example@axa.com" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:border-blue-500 transition-colors" required /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">비밀번호</label><input name="password" type="password" placeholder="비밀번호 설정" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:border-blue-500 transition-colors" required /></div>
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="grid grid-cols-2 gap-2">
                <select name="dept" className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700" onChange={(e) => setSelectedDept(e.target.value)} required>
                    <option value="">본부/부문</option>
                    {Object.keys(ORGANIZATION).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <select name="team" className="w-full p-2 bg-white border border-slate-200 rounded-xl outline-none text-xs text-slate-700" disabled={!selectedDept} required>
                    <option value="">팀/센터</option>
                    {selectedDept && ORGANIZATION[selectedDept].map(team => <option key={team} value={team}>{team}</option>)}
                </select>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1 ml-1">⚠️ 관리자 권한 부여 시에만 인증 코드 입력 (일반 사용자는 공란)</p>
              <input name="code" type="password" placeholder="인증 코드 (선택)" className="w-full p-3.5 bg-white border-2 border-slate-100 rounded-2xl outline-none text-sm text-slate-800 placeholder-slate-300 focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg transition-all mt-2 disabled:bg-blue-300 flex justify-center">{loading ? <Loader2 className="animate-spin w-5 h-5" /> : '가입 승인 요청'}</button>
            <button type="button" onClick={() => setIsSignupMode(false)} className="w-full text-slate-400 text-xs py-2 hover:text-blue-600">로그인으로 돌아가기</button>
          </form>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">이메일</label><input name="email" type="text" placeholder="user@axa.co.kr" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:border-blue-500 transition-colors" /></div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1 ml-1">비밀번호</label><input name="password" type="password" placeholder="(6자리 이상 숫자)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm focus:border-blue-500 transition-colors" required minLength="6" /></div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-[0.98] disabled:bg-blue-300 flex justify-center">{loading ? <Loader2 className="animate-spin w-5 h-5" /> : '🚀 로그인'}</button>
            </form>
            <div className="text-center mt-2"><button onClick={() => setIsSignupMode(true)} className="text-slate-500 text-xs font-bold hover:text-blue-600 underline transition-colors">임직원 회원가입</button></div>
          </div>
        )}
      </div>
    </div>
  );
};

const Header = ({ currentUser, onOpenUserInfo, handleLogout, onOpenChangeDept, onOpenChangePwd, onOpenAdminGrant, onOpenRedemptionList }) => {
  const todayDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const [showSettings, setShowSettings] = useState(false);
  const displayName = formatName(currentUser?.name);
  
  return (
    <div className="bg-white/80 backdrop-blur-md p-4 sticky top-0 z-30 border-b border-slate-100 shadow-sm">
      <div className="text-[10px] text-blue-400 font-bold mb-1 pl-1">{todayDate}</div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <img src={AXA_LOGO_URL} alt="AXA Logo" className="w-8 h-auto" />
            <h1 className="text-lg font-black text-slate-800 tracking-tight">AXA Connect</h1>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <div className="bg-white text-slate-600 px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-2 border border-slate-100 shadow-sm">
             <Coins className="w-6 h-6 text-yellow-400 fill-yellow-400" />
             <div className="flex flex-col items-start leading-none">
                 <span className="text-[9px] text-slate-400 font-normal mb-0.5">내 포인트</span>
                 <span className="text-sm font-black text-slate-700">
                     {currentUser?.points?.toLocaleString() || 0} P
                 </span>
             </div>
          </div>

          <button onClick={onOpenUserInfo} className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md hover:ring-2 ring-blue-200 transition-all">
            {displayName}
          </button>

          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors relative z-40"><Settings className="w-5 h-5 text-slate-400" /></button>
          
          {showSettings && (
             <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-fade-in">
                <button onClick={() => { setShowSettings(false); onOpenChangeDept(); }} className="flex items-center gap-2 w-full p-3 text-xs text-slate-600 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                   <Edit3 className="w-3.5 h-3.5 text-blue-400"/> 소속/팀 변경
                </button>
                <button onClick={() => { setShowSettings(false); onOpenChangePwd(); }} className="flex items-center gap-2 w-full p-3 text-xs text-slate-600 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                   <Key className="w-3.5 h-3.5 text-blue-400"/> 비밀번호 변경
                </button>
                
                {currentUser?.role === 'admin' && (
                    <>
                    <button onClick={() => { setShowSettings(false); onOpenAdminGrant(); }} className="flex items-center gap-2 w-full p-3 text-xs text-blue-600 font-bold hover:bg-blue-50 border-b border-slate-50 transition-colors">
                        <Gift className="w-3.5 h-3.5 text-blue-500"/> 포인트 지급 (관리자)
                    </button>
                    <button onClick={() => { setShowSettings(false); onOpenRedemptionList(); }} className="flex items-center gap-2 w-full p-3 text-xs text-purple-600 font-bold hover:bg-purple-50 border-b border-slate-50 transition-colors">
                        <ClipboardList className="w-3.5 h-3.5 text-purple-500"/> 포인트 차감 신청 관리 (관리자)
                    </button>
                    </>
                )}

                <button onClick={handleLogout} className="flex items-center gap-2 w-full p-3 text-xs text-red-400 hover:bg-red-50 transition-colors">
                   <LogOut className="w-3.5 h-3.5"/> 로그아웃
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ChangeDeptModal = ({ onClose, onSave }) => {
    const [dept, setDept] = useState('');
    const [team, setTeam] = useState('');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5"/></button>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Building2 className="w-5 h-5"/> 소속 변경</h3>
                <div className="space-y-3">
                    <select className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none" onChange={(e) => setDept(e.target.value)}>
                        <option value="">본부/부문 선택</option>
                        {Object.keys(ORGANIZATION).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none" disabled={!dept} onChange={(e) => setTeam(e.target.value)}>
                        <option value="">팀 선택</option>
                        {dept && ORGANIZATION[dept].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => onSave(dept, team)} disabled={!dept || !team} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-colors">변경 저장</button>
                </div>
            </div>
        </div>
    );
};

const ChangePasswordModal = ({ onClose, onSave }) => {
    const [password, setPassword] = useState('');
    const isValid = password.length >= 6 && /^\d+$/.test(password);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5"/></button>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5"/> 비밀번호 변경</h3>
                <div className="space-y-3">
                    <input 
                        type="password" 
                        placeholder="새 비밀번호 (6자리 이상 숫자)" 
                        className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {!isValid && password.length > 0 && <p className="text-[10px] text-red-500">6자리 이상 숫자로 입력해주세요.</p>}
                    <button onClick={() => onSave(password)} disabled={!isValid} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-colors">비밀번호 변경</button>
                </div>
            </div>
        </div>
    );
};

const AdminGrantModal = ({ onClose, onGrant, profiles }) => {
    const [dept, setDept] = useState('');
    const [targetUser, setTargetUser] = useState('');
    const [amount, setAmount] = useState('');

    const filteredUsers = profiles.filter(p => p.dept === dept);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5"/></button>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-600"><Gift className="w-5 h-5"/> 특별 포인트 지급</h3>
                <div className="space-y-3">
                    <select className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none" onChange={(e) => { setDept(e.target.value); setTargetUser(''); }}>
                        <option value="">소속 선택</option>
                        {Object.keys(ORGANIZATION).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none" disabled={!dept} onChange={(e) => setTargetUser(e.target.value)}>
                        <option value="">직원 선택</option>
                        {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.team})</option>)}
                    </select>
                    <input 
                        type="number" 
                        placeholder="지급 포인트 (숫자만 입력)" 
                        className="w-full p-3 bg-slate-50 rounded-xl text-sm border border-slate-200 outline-none font-bold"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <button onClick={() => onGrant(targetUser, amount)} disabled={!targetUser || !amount} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl font-bold hover:shadow-lg disabled:opacity-50 transition-all">
                        포인트 지급하기
                    </button>
                </div>
            </div>
        </div>
    );
};

const RedemptionListModal = ({ onClose, redemptionList }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X className="w-5 h-5"/></button>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-600"><ClipboardList className="w-5 h-5"/> 포인트 차감 신청 내역</h3>
                <div className="flex-1 overflow-y-auto">
                    {redemptionList && redemptionList.length > 0 ? (
                        <div className="space-y-2">
                            {redemptionList.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{item.user_name}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(item.created_at).toLocaleDateString()} 신청</p>
                                    </div>
                                    <div className="text-red-500 font-bold text-sm">
                                        -{item.amount?.toLocaleString()} P
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-10 text-sm">신청 내역이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const UserInfoModal = ({ currentUser, pointHistory, setShowUserInfoModal, handleRedeemPoints }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2rem] p-0 shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-t-[2rem] flex justify-between items-center sticky top-0 z-10">
            <div className="flex flex-col text-white">
                <h3 className="text-lg font-bold flex items-center gap-2"><User className="w-5 h-5"/> {currentUser.name}</h3>
                <p className="text-xs opacity-90 ml-7 mt-0.5 flex items-center gap-1 font-medium"><Building2 className="w-3 h-3"/> {currentUser.dept} / {currentUser.team}</p>
            </div>
            <button onClick={() => setShowUserInfoModal(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-5">
            {currentUser.points >= 10000 ? (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                    <p className="text-sm text-blue-800 font-bold mb-2">🎉 보유 포인트가 10,000P 이상입니다!</p>
                    <button 
                        onClick={handleRedeemPoints}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors shadow-md"
                    >
                        <Wallet className="w-4 h-4" /> 10,000P 상품권 교환 신청
                    </button>
                </div>
            ) : (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-500">10,000P 부터 상품권 교환 신청이 가능해요 🎁</p>
                    <div className="mt-2 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: `${Math.min((currentUser.points / 10000) * 100, 100)}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 text-right">{Math.floor((currentUser.points / 10000) * 100)}% 달성</p>
                </div>
            )}

            <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400"/> 포인트 히스토리</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-hide">
                    {pointHistory.length > 0 ? pointHistory.map((history) => (
                        <div key={history.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 line-clamp-1">{history.reason}</p>
                                <span className="text-[10px] text-slate-400">{new Date(history.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="text-sm font-black ml-4 flex items-center gap-1" style={{ 
                                color: history.type === 'earn' ? '#10b981' : '#ef4444' 
                            }}>
                                {history.type === 'earn' ? '+' : '-'}{history.amount.toLocaleString()} P
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-xs text-slate-400 py-6">아직 활동 내역이 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
);

const BirthdayPopup = ({ currentUser, handleBirthdayGrant, setShowBirthdayPopup }) => (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative text-center">
            <button onClick={() => setShowBirthdayPopup(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full"><X className="w-5 h-5" /></button>
            <div className="text-5xl mb-4">
                <span className="text-6xl animate-pulse">🎂</span>
                <div className="relative w-12 h-1 bg-yellow-500 mx-auto rounded-full mt-1">
                    <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-1.5 h-3 bg-white shadow-[0_0_5px_rgba(255,255,0,0.8)] animate-flame"></div>
                </div>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">생일 축하 드립니다!</h3>
            <p className="text-sm text-slate-500 mb-6">소중한 {currentUser.name} 님의 생일이 있는 달이에요.<br/>특별한 선물을 준비했어요.</p>
            <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-200 mb-6">
                <span className="text-2xl font-black text-yellow-600 flex items-center justify-center gap-2">
                    <Coins className="w-6 h-6 fill-yellow-500 text-yellow-600"/> +1,000 P
                </span>
            </div>
            
            <button onClick={handleBirthdayGrant} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg transition-all flex justify-center items-center gap-2">
                <Gift className="w-5 h-5"/> 포인트 받기
            </button>

            <style jsx>{`
                @keyframes flame {
                    0%, 100% { box-shadow: 0 0 5px rgba(255,255,0,0.8), 0 0 10px rgba(255,165,0,0.5); transform: scaleY(1.0); }
                    50% { box-shadow: 0 0 8px rgba(255,255,0,1), 0 0 15px rgba(255,165,0,0.8); transform: scaleY(1.2); }
                }
                .animate-flame {
                    animation: flame 1.5s infinite ease-in-out;
                }
            `}</style>
        </div>
    </div>
);

const BirthdayNotifier = ({ weeklyBirthdays }) => {
    const [view, setView] = useState('current'); 
    const list = view === 'current' ? weeklyBirthdays.current : weeklyBirthdays.next;
    
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 h-full flex flex-col">
            <h3 className="font-bold text-lg mb-3 flex items-center text-slate-800">
                <span className="mr-2">🎂</span> 생일자
            </h3>

            <div className="flex bg-blue-50 p-1 rounded-xl mb-3 border border-blue-100">
                <button 
                    onClick={() => setView('current')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${view === 'current' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    이번 주
                </button>
                <button 
                    onClick={() => setView('next')}
                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${view === 'next' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    다음 주
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
                {list.length > 0 ? (
                    <div className="space-y-2">
                        {list.map((b, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-blue-100/50 border border-blue-100 rounded-xl">
                                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs shadow-sm">🎂</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">{b.name}</p>
                                    <p className="text-[10px] text-slate-400">{b.date} <span className="text-blue-500 font-bold">{b.typeLabel}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 text-xs gap-1">
                        <Smile className="w-5 h-5 opacity-50"/>
                        <span>생일자가 없어요</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const HomeTab = ({ mood, handleMoodCheck, feeds, onWriteClick, onNavigateToNews, onNavigateToFeed, weeklyBirthdays }) => {
    const noticeFeedsAll = feeds.filter(f => f.type === 'news');
    const noticeFeeds = noticeFeedsAll.slice(0, 3);
    const praiseFeeds = feeds.filter(f => f.type === 'praise').slice(0, 5); 
    const infoFeeds = feeds.filter(f => f.type === 'knowhow' || f.type === 'matjib').slice(0, 5); 

    const handleSectionClick = (type) => {
        onNavigateToFeed(type); 
    };

    const getMoodButtonStyle = (type) => {
        if (mood === type) {
            if (type === 'happy') return 'bg-blue-500 border-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200';
            if (type === 'soso') return 'bg-yellow-400 border-yellow-500 text-white shadow-md scale-105 ring-2 ring-yellow-200';
            if (type === 'sad') return 'bg-orange-500 border-orange-600 text-white shadow-md scale-105 ring-2 ring-orange-200';
        } else if (mood) {
            return 'bg-slate-100 border-slate-200 text-slate-300';
        } else {
            if (type === 'happy') return 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 opacity-90';
            if (type === 'soso') return 'bg-yellow-400 border-yellow-400 text-white hover:bg-yellow-500 opacity-90';
            if (type === 'sad') return 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 opacity-90';
        }
    };
    
    return (
      <div className="p-5 space-y-6 pb-32 animate-fade-in relative bg-blue-50 min-h-full">
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                        <h2 className="text-xs font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                            출석체크 
                            {mood && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[9px] font-bold">완료</span>}
                        </h2>
                        <p className="text-sm font-black text-slate-700">오늘의 기분은?</p>
                    </div>
                  </div>
                  <div className="flex gap-2 h-full mt-2">
                    <button 
                      onClick={() => handleMoodCheck('happy')} 
                      className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 duration-200 border ${getMoodButtonStyle('happy')}`}
                      disabled={!!mood}
                    >
                      <Smile className="w-5 h-5"/>
                      <span className="text-[9px] font-bold">좋음</span>
                    </button>
                    <button 
                      onClick={() => handleMoodCheck('soso')} 
                      className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 duration-200 border ${getMoodButtonStyle('soso')}`}
                      disabled={!!mood}
                    >
                      <Meh className="w-5 h-5"/>
                      <span className="text-[9px] font-bold">보통</span>
                    </button>
                    <button 
                      onClick={() => handleMoodCheck('sad')} 
                      className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 duration-200 border ${getMoodButtonStyle('sad')}`}
                      disabled={!!mood}
                    >
                      <Frown className="w-5 h-5"/>
                      <span className="text-[9px] font-bold">피곤</span>
                    </button>
                  </div>
                  {!mood && <div className="text-[10px] text-center mt-2 text-blue-500 font-bold bg-blue-100 rounded-lg py-1 flex items-center justify-center gap-1"><Coins className="w-3 h-3 text-yellow-500 fill-yellow-500"/> 황금동전 +10P</div>}
                </div>
            </div>
            <div className="col-span-1">
                <BirthdayNotifier weeklyBirthdays={weeklyBirthdays} />
            </div>
        </div>

        <div>
           <div className="flex justify-between items-center mb-3 px-1">
             <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Megaphone className="w-4 h-4 text-red-500"/> 공지사항</h2>
             <button onClick={onNavigateToNews} className="text-xs text-slate-400 font-medium hover:text-blue-600 flex items-center gap-0.5">
                 더보기 <ChevronRight className="w-3 h-3" />
             </button>
           </div>
           <div className="space-y-2">
             {noticeFeeds.length > 0 ? noticeFeeds.map(feed => ( 
               <div key={feed.id} onClick={onNavigateToNews} className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 transition-transform active:scale-[0.99] hover:border-blue-200 cursor-pointer">
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-0.5">
                        {feed.title || feed.content}
                        {isToday(feed.created_at) && <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-sm inline-block">NEW</span>}
                    </p>
                    <span className="text-[10px] text-slate-400">{feed.formattedTime} • {feed.author}</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-slate-300" />
               </div>
             )) : <div className="text-center text-xs text-slate-400 py-6 bg-white rounded-2xl border border-slate-100 border-dashed">등록된 공지가 없습니다.</div>}
           </div>
        </div>
        <div className="flex justify-end">
            <button onClick={onWriteClick} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex items-center gap-2 active:scale-95 border border-blue-400">
                 <Pencil className="w-4 h-4" />
                 <span className="text-sm font-bold">글쓰기</span>
                 <div className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center"><Coins className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300 mr-0.5"/>100P</div>
            </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-1 bg-blue-100/50 rounded-lg text-blue-600 text-[10px] font-bold mx-1 border border-blue-100">
            <Coins className="w-3 h-3 text-yellow-500 fill-yellow-500"/>
            게시물 1개 작성시, +100P (일 최대 300P 가능)
        </div>

        <div className="grid grid-cols-2 gap-4 min-h-[300px]">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-blue-100 cursor-pointer" onClick={() => handleSectionClick('praise')}>
               <h3 className="text-sm font-bold text-green-600 mb-3 flex items-center gap-1.5 pointer-events-none"><Heart className="w-4 h-4 fill-green-500 text-green-500"/> 칭찬합시다</h3>
               <div className="space-y-2 pointer-events-none">
                 {praiseFeeds.map(feed => (
                    <div key={feed.id} 
                         className="p-3 bg-green-50/30 rounded-2xl border border-green-100 transition-colors">
                        <p className="text-[10px] font-bold text-slate-500 mb-1">To. {feed.target_name || '동료'}</p>
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                            {feed.content}
                            {isToday(feed.created_at) && <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-sm inline-block">NEW</span>}
                        </p>
                        <div className="text-right text-[9px] text-slate-400 mt-1">{feed.formattedTime}</div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-blue-100 cursor-pointer" onClick={() => handleSectionClick('knowhow')}>
               <h3 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-1.5 pointer-events-none"><Sparkles className="w-4 h-4 fill-blue-500 text-blue-500"/> 업무꿀팁 & 맛집소개</h3>
               <div className="space-y-2 pointer-events-none">
                 {infoFeeds.map(feed => (
                    <div key={feed.id} 
                         className={`p-3 rounded-2xl border transition-colors 
                         ${feed.type === 'knowhow' ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-100/50' : 'bg-orange-50/50 border-orange-100 hover:bg-orange-100/50'}`}>
                       <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mr-1 border align-middle 
                           ${feed.type === 'knowhow' ? 'bg-white text-blue-600 border-blue-100' : 'bg-white text-orange-600 border-orange-100'}`}>
                           {feed.type === 'matjib' ? '맛집소개' : '업무꿀팁'}
                       </span>
                       <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed inline align-middle">
                            {feed.title || feed.content}
                            {isToday(feed.created_at) && <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-sm inline-block">NEW</span>}
                        </p>
                       <div className="text-right text-[9px] text-slate-400 mt-2">{feed.formattedTime}</div>
                    </div>
                  ))}
               </div>
            </div>
        </div>
      </div>
    );
};

const NoticeBoard = ({ feeds, onWriteClick, currentUser }) => {
    const notices = feeds.filter(f => f.type === 'news');

    return (
        <div className="p-5 pb-32 animate-fade-in min-h-full bg-blue-50">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">📢 공지사항</h2>
                {currentUser?.role === 'admin' && (
                    <button onClick={onWriteClick} className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors">
                        공지 작성
                    </button>
                )}
            </div>
            
            <div className="space-y-3">
                {notices.map(feed => (
                    <div key={feed.id} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-bold text-slate-800 line-clamp-1">
                                {feed.title || '제목 없음'}
                                {isToday(feed.created_at) && <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-sm inline-block">NEW</span>}
                            </h3>
                            <span className="text-[10px] text-slate-400 flex-shrink-0">{feed.formattedTime}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2 whitespace-pre-wrap">{feed.content}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-50 pt-2">
                            <span>작성자: {feed.author}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Comment = ({ comment, currentUser, handleDeleteComment }) => (
    <div className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
        {comment.parent_id && <CornerDownRight className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />}
        <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-sm ${comment.profiles?.role === 'admin' ? 'bg-red-400' : 'bg-blue-400'}`}>
            {formatInitial(comment.profiles?.name || 'Unknown')}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    {comment.profiles?.name || '알 수 없음'}
                    {comment.profiles?.role === 'admin' && <span className="px-1 py-0.5 bg-red-50 text-red-500 text-[9px] rounded-md">관리자</span>}
                </p>
                <span className="text-[9px] text-slate-400">{new Date(comment.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mt-0.5 break-words">{comment.content}</p>
            
            <div className="flex gap-2 mt-1 justify-end">
                {(currentUser?.id === comment.author_id || currentUser?.role === 'admin') && (
                    <button onClick={() => handleDeleteComment(comment.id)} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-0.5"><Trash2 className="w-3 h-3"/> 삭제</button>
                )}
            </div>
        </div>
    </div>
);

const FeedTab = ({ feeds, activeFeedFilter, setActiveFeedFilter, onWriteClick, currentUser, handleDeletePost, handleLikePost, handleAddComment, handleDeleteComment }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFeeds = feeds.filter(f => {
      const matchesFilter = activeFeedFilter === 'all' || f.type === activeFeedFilter;
      const matchesSearch = searchTerm === "" || 
          (f.title && f.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
          (f.content && f.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (f.author && f.author.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-5 space-y-5 pb-28 animate-fade-in bg-blue-50">
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input 
            type="text" 
            placeholder="검색어를 입력하세요 (제목, 내용, 작성자)" 
            className="flex-1 bg-transparent text-xs p-2 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[{ id: 'all', label: '전체' }, { id: 'praise', label: '칭찬해요' }, { id: 'knowhow', label: '업무 꿀팁' }, { id: 'matjib', label: '맛집 소개' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveFeedFilter(tab.id)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeFeedFilter === tab.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}>{tab.label}</button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onWriteClick}>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95 border border-blue-400">
                <div className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center"><Coins className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300 mr-0.5"/>100P</div>
                <Pencil className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">게시글 작성</span>
            </div>
          </div>
          <p className="text-[9px] text-blue-500 font-bold bg-blue-100 px-2 py-1 rounded-lg">
              게시물 1개 작성시 +100P (일 최대 300P 가능)
          </p>
      </div>
      
      {filteredFeeds.map(feed => {
        const comments = feed.comments || [];
        return (
          <div key={feed.id} className="bg-white rounded-3xl p-5 shadow-sm border border-blue-100 relative group transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br from-blue-500 to-blue-400 shadow-sm`}>{formatInitial(feed.author)}</div>
              <div>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1">
                      {feed.author} 
                      {feed.profiles?.role === 'admin' && <span className="bg-red-50 text-red-500 text-[9px] px-1.5 py-0.5 rounded-md border border-red-100">관리자</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">{feed.formattedTime} • {feed.team}</p>
              </div>
            </div>
            
            <div className="mb-4">
                <div className="flex flex-wrap gap-1 mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        feed.type === 'praise' ? 'bg-green-50 text-green-600 border-green-100' : 
                        feed.type === 'news' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                        {feed.type === 'praise' ? '칭찬해요' : feed.type === 'news' ? '📢 공지사항' : feed.type === 'matjib' ? '맛집 소개' : '업무 꿀팁'}
                    </span>
                    {feed.region_main && <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200"><MapPin className="w-2.5 h-2.5 inline mr-0.5"/>{feed.region_main} {feed.region_sub}</span>}
                </div>
                
                {feed.type === 'praise' && feed.target_name && <p className="text-xs font-bold text-green-600 mb-1">To. {feed.target_name}</p>}
                
                {/* 칭찬 게시글 제목 처리: 제목이 있으면 출력하고, 없으면 아예 렌더링하지 않음 */}
                {feed.title && (
                    <h3 className="text-base font-bold text-slate-800 mb-1.5">
                        {feed.title}
                        {isToday(feed.created_at) && <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-sm inline-block">NEW</span>}
                    </h3>
                )}

                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{feed.content}</p>
                {feed.link_url && (
                    <a href={feed.link_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-1.5 rounded-lg hover:underline w-full truncate">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{feed.link_url}</span>
                    </a>
                )}
            </div>
            
            {feed.image_url && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 shadow-sm"><img src={feed.image_url} alt="Content" className="w-full h-full object-cover" /></div>
            )}
            
            <div className="flex items-center gap-4 border-t border-slate-50 pt-3">
              <button 
                onClick={() => handleLikePost(feed.id, feed.likes, feed.isLiked)} 
                className={`flex items-center gap-1 text-xs font-bold transition-colors ${feed.isLiked ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <Heart className={`w-4 h-4 ${feed.isLiked ? 'fill-red-500' : ''}`} /> {feed.likes?.length || 0}
              </button>
              <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                  <MessageCircle className="w-4 h-4" /> {comments.length}
              </div>
              <div className="ml-auto text-[10px] text-slate-300">{feed.formattedTime}</div>
              {(currentUser?.id === feed.author_id || currentUser?.role === 'admin') && (
                  <button onClick={() => handleDeletePost(feed.id)} className="text-[10px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 px-2 py-1">
                      삭제
                  </button>
              )}
            </div>
            
            {comments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50 space-y-2">
                    {comments.map(comment => (
                        <Comment key={comment.id} comment={comment} currentUser={currentUser} handleDeleteComment={handleDeleteComment} />
                    ))}
                </div>
            )}
            
            <form onSubmit={(e) => handleAddComment(e, feed.id, null)} className="flex gap-2 mt-3">
                <input name="commentContent" type="text" placeholder="댓글을 남겨주세요..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:border-blue-400 focus:bg-white transition-colors" required />
                <button type="submit" className="bg-white border border-slate-200 text-slate-500 p-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"><Send className="w-3.5 h-3.5"/></button>
            </form>
          </div>
        );
      })}
    </div>
  );
};

const WriteModal = ({ setShowWriteModal, handlePostSubmit, currentUser, activeTab }) => {
  const [writeCategory, setWriteCategory] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [regionMain, setRegionMain] = useState('');
  const [regionSub, setRegionSub] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagePreview(URL.createObjectURL(file));
  };
  
  // useMemo를 사용하여 categories 배열을 메모이제이션
  const categories = useMemo(() => [
    {id: 'praise', label: '칭찬하기', show: activeTab !== 'news'},
    {id: 'matjib', label: '맛집소개', show: activeTab !== 'news'},
    {id: 'knowhow', label: '업무꿀팁', show: activeTab !== 'news'},
    {id: 'news', label: '공지사항', show: activeTab === 'news' && currentUser?.role === 'admin'}
  ].filter(c => c.show), [activeTab, currentUser]); // 의존성 배열에 activeTab과 currentUser 추가

  useEffect(() => {
      if (categories.length > 0 && !writeCategory) {
          setWriteCategory(categories[0].id);
      }
  }, [categories, writeCategory]);

  const showPointReward = ['praise', 'knowhow', 'matjib'].includes(writeCategory);
  const pointRewardText = showPointReward ? ' (+100P)' : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-0 shadow-2xl max-h-[90vh] overflow-y-auto relative">
        <div className="bg-slate-800 p-6 rounded-t-[2.5rem] flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Pencil className="w-5 h-5"/> 글쓰기</h3>
            <button onClick={() => setShowWriteModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
            <form onSubmit={handlePostSubmit}>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((cat) => (
                    <label key={cat.id} className="flex-shrink-0 cursor-pointer">
                        <input type="radio" name="category" value={cat.id} className="peer hidden" checked={writeCategory === cat.id} onChange={() => setWriteCategory(cat.id)} />
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${writeCategory === cat.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{cat.label}</span>
                    </label>
                ))}
            </div>
            
            <div className="space-y-4 mb-8">
                {writeCategory === 'praise' && (
                    <div className="bg-green-50 p-4 rounded-2xl border border-green-100 animate-fade-in">
                        <label className="text-xs font-bold text-green-700 block mb-2 ml-1">누구를 칭찬하나요?</label>
                        <input name="targetName" type="text" placeholder="이름을 입력하세요 (예: 김철수)" className="w-full bg-white p-3 rounded-xl border border-green-200 text-sm outline-none focus:border-green-500" required />
                    </div>
                )}

                {writeCategory === 'matjib' && (
                    <div className="space-y-3 animate-fade-in">
                        <input name="title" type="text" placeholder="맛집 이름 (제목)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 font-bold" required />
                        <div className="grid grid-cols-2 gap-2">
                             <select name="regionMain" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" onChange={(e) => setRegionMain(e.target.value)} required>
                                 <option value="">시/도 선택</option>
                                 {Object.keys(REGIONS).map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                             <select name="regionSub" value={regionSub} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" disabled={!regionMain} onChange={(e) => setRegionSub(e.target.value)} required>
                                 <option value="">시/군/구 선택</option>
                                 {regionMain && REGIONS[regionMain].map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                        </div>
                        <input name="linkUrl" type="url" placeholder="지도 링크나 블로그 주소 (선택)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-600" />
                    </div>
                )}

                {(writeCategory === 'knowhow' || writeCategory === 'news') && (
                    <div className="animate-fade-in">
                        <input name="title" type="text" placeholder="제목을 입력하세요" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 font-bold mb-3" required />
                    </div>
                )}

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <textarea name="content" className="w-full h-32 bg-transparent text-sm outline-none resize-none placeholder-slate-400" placeholder={writeCategory === 'praise' ? "칭찬 내용을 작성해주세요..." : "내용을 자세히 작성해주세요..."} required></textarea>
                </div>

                <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center justify-center w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all">
                        <div className="text-center">
                            <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                            <span className="text-[10px] text-slate-400">사진</span>
                        </div>
                        <input type="file" name="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                    {imagePreview && (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setImagePreview(null)} className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white"><X className="w-5 h-5"/></button>
                        </div>
                    )}
                </div>
            </div>
            
            <button type="submit" className="w-full bg-slate-800 text-white p-4 rounded-2xl text-sm font-bold hover:bg-slate-900 shadow-lg transition-all flex items-center justify-center gap-2">
                등록하기 <span className="text-yellow-400 bg-white/10 px-1.5 py-0.5 rounded text-xs">{pointRewardText}</span>
            </button>
            </form>
        </div>
      </div>
    </div>
  );
};

const RankingTab = ({ feeds, profiles, allPointHistory }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    const isSelectedMonth = (dateString) => {
        if(!dateString) return false;
        const d = new Date(dateString);
        return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    };

    const handlePrevMonth = () => {
        setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)));
    };

    const handleNextMonth = () => {
        const nextMonth = new Date(selectedDate);
        nextMonth.setMonth(selectedDate.getMonth() + 1);
        if (nextMonth <= new Date()) { // 미래로 이동 방지
            setSelectedDate(nextMonth);
        }
    };

    // 2. 월간 획득 포인트 랭킹 계산 (point_history 기반)
    const pointRanking = useMemo(() => {
        const monthlyPoints = {};
        allPointHistory.forEach(record => {
            if (isSelectedMonth(record.created_at) && record.type === 'earn') {
                monthlyPoints[record.user_id] = (monthlyPoints[record.user_id] || 0) + record.amount;
            }
        });

        return Object.entries(monthlyPoints)
            .map(([id, points]) => {
                const p = profiles.find(profile => profile.id === id) || { name: '알수없음', team: '소속미정' };
                return { name: p.name, value: points, unit: 'P', team: p.team };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);
    }, [allPointHistory, profiles, selectedDate]);

    // 3. 소통왕, 인기왕은 feeds 기준으로 날짜 필터링
    const postCounts = {};
    feeds.filter(f => isSelectedMonth(f.created_at)).forEach(f => {
        postCounts[f.author_id] = (postCounts[f.author_id] || 0) + 1;
    });
    const postRanking = Object.entries(postCounts)
        .map(([id, count]) => {
            const p = profiles.find(profile => profile.id === id) || { name: '알수없음', team: '소속미정' };
            return { name: p.name, value: count, unit: '건', team: p.team };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    const likeCounts = {};
    feeds.filter(f => isSelectedMonth(f.created_at)).forEach(f => {
        const likes = f.likes ? (Array.isArray(f.likes) ? f.likes.length : 0) : 0;
        if(likes > 0) {
            likeCounts[f.author_id] = (likeCounts[f.author_id] || 0) + likes;
        }
    });
    const likeRanking = Object.entries(likeCounts)
        .map(([id, count]) => {
            const p = profiles.find(profile => profile.id === id) || { name: '알수없음', team: '소속미정' };
            return { name: p.name, value: count, unit: '개', team: p.team };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

    const RankItem = ({ rank, name, value, unit, team, color }) => (
        <div className="flex items-center p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className={`text-xl font-black mr-4 w-8 text-center ${color}`}>{rank}</div>
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{name || 'Unknown'}</p> 
                <p className="text-[10px] text-slate-400">{team}</p>
            </div>
            <div className="text-base font-black text-slate-700 ml-4">{value}<span className="text-[10px] text-slate-400 ml-0.5 font-normal">{unit}</span></div>
        </div>
    );

    return (
        <div className="p-5 space-y-8 pb-28 animate-fade-in bg-blue-50">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-blue-100 text-center relative">
                {/* 1. 날짜 네비게이션 */}
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5 text-slate-400" /></button>
                    <h2 className="text-lg font-black text-slate-800">{selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 랭킹</h2>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full disabled:opacity-30" disabled={selectedDate >= new Date(new Date().setDate(1))}><ChevronRight className="w-5 h-5 text-slate-400" /></button>
                </div>
                <p className="text-xs text-slate-400">매월 1일 ~ 말일 기준 집계</p>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2 mb-2 ml-1"><Coins className="w-4 h-4 text-yellow-500"/> 월간 획득 포인트 랭킹</h3>
                <div className="space-y-2">{pointRanking.length > 0 ? pointRanking.map((p, i) => <RankItem key={i} rank={i+1} name={p.name} team={p.team} value={p.value.toLocaleString()} unit="P" color="text-yellow-500"/>) : <div className="text-center text-xs text-slate-400 py-4">데이터가 없습니다.</div>}</div>
            </div>
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2 mb-2 ml-1"><Pencil className="w-4 h-4 text-green-500"/> 소통왕 (게시글)</h3>
                <div className="space-y-2">{postRanking.length > 0 ? postRanking.map((p, i) => <RankItem key={i} rank={i+1} {...p} color="text-green-500"/>) : <div className="text-center text-xs text-slate-400 py-4">데이터가 없습니다.</div>}</div>
            </div>
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2 mb-2 ml-1"><Heart className="w-4 h-4 text-red-500"/> 인기왕 (좋아요)</h3>
                <div className="space-y-2">{likeRanking.length > 0 ? likeRanking.map((p, i) => <RankItem key={i} rank={i+1} {...p} color="text-red-500"/>) : <div className="text-center text-xs text-slate-400 py-4">데이터가 없습니다.</div>}</div>
            </div>
        </div>
    );
};

// ... BottomNav code is same ...
const BottomNav = ({ activeTab, setActiveTab }) => (
  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[380px] bg-[#00008F] backdrop-blur-md border border-blue-900 shadow-[0_8px_30px_rgb(0,0,0,0.3)] p-2 z-30 flex justify-between items-center rounded-3xl">
    {[{ id: 'home', icon: User, label: '홈' }, { id: 'feed', icon: MessageCircle, label: '소통' }, { id: 'news', icon: Bell, label: '소식' }, { id: 'ranking', icon: Award, label: '랭킹' }].map(item => (
      <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'text-white bg-white/20 shadow-lg scale-105' : 'text-blue-300 hover:text-white'}`}>
        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : ''}`} />
        <span className="text-[10px] font-bold">{item.label}</span>
      </button>
    ))}
  </div>
);

// --- Main App Component ---
export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  // 1. 전체 포인트 히스토리 상태 추가 (랭킹용)
  const [allPointHistory, setAllPointHistory] = useState([]);
  const [redemptionList, setRedemptionList] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false);
  
  const [showChangeDeptModal, setShowChangeDeptModal] = useState(false);
  const [showChangePwdModal, setShowChangePwdModal] = useState(false);
  const [showAdminGrantModal, setShowAdminGrantModal] = useState(false);
  const [showRedemptionListModal, setShowRedemptionListModal] = useState(false); 
  const [showAdminAlertModal, setShowAdminAlertModal] = useState(false); 
  const [toast, setToast] = useState({ visible: false, message: '', emoji: '' });

  const [activeTab, setActiveTab] = useState('home');
  const [activeFeedFilter, setActiveFeedFilter] = useState('all');
  const [mood, setMood] = useState(null);
  const weeklyBirthdays = React.useMemo(() => getWeeklyBirthdays(profiles), [profiles]);

  useEffect(() => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    setSupabase(client);
  }, []);
  
  const checkBirthday = useCallback((user) => {
    if (!user.birthdate || user.birthday_granted) return; 
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const [_, m, d] = user.birthdate.split('-').map(Number);
    const birthMonth = m;
    if (currentMonth === birthMonth) {
        setShowBirthdayPopup(true);
    }
  }, []);

  const checkAdminNotifications = async (user) => {
      if (user.role !== 'admin' || !supabase) return;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const hideDate = localStorage.getItem('hide_admin_alert');

      if (hideDate === todayStr) return;

      try {
          const { count, error } = await supabase.from('redemption_requests').select('*', { count: 'exact', head: true }); 
          if (!error && count > 0) {
              setShowAdminAlertModal(true); 
          }
      } catch (err) { console.error(err); }
  };

  const handleCloseAdminAlert = (doNotShowToday) => {
      if (doNotShowToday) {
          const todayStr = new Date().toISOString().split('T')[0];
          localStorage.setItem('hide_admin_alert', todayStr);
      }
      setShowAdminAlertModal(false);
  };

  const fetchUserData = useCallback(async (userId) => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
            setCurrentUser(data);
            const todayStr = new Date().toISOString().split('T')[0];
            if (data.last_attendance === todayStr) setMood('checked');
            checkBirthday(data);
            checkAdminNotifications(data); 
        }
    } catch (err) { console.error(err); }
  }, [supabase, checkBirthday]);

  // 개인용 포인트 히스토리
  const fetchPointHistory = useCallback(async (userId) => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('point_history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (data) setPointHistory(data);
    } catch (err) { console.error(err); }
  }, [supabase]);

  // 1. 전체 포인트 히스토리 가져오기 (랭킹용)
  const fetchAllPointHistory = useCallback(async () => {
      if (!supabase) return;
      try {
          // 필요한 컬럼만 가져와서 최적화
          const { data } = await supabase.from('point_history').select('user_id, amount, type, created_at');
          if (data) setAllPointHistory(data);
      } catch(err) { console.error(err); }
  }, [supabase]);

  const fetchFeeds = useCallback(async () => {
    if (!supabase) return; 
    try {
        const { data: posts } = await supabase.from('posts').select(`*, profiles:author_id (name, dept, team, role)`).order('created_at', { ascending: false });
        const { data: comments } = await supabase.from('comments').select(`*, profiles:author_id (name, role)`).order('created_at', { ascending: true });

        if (posts) {
            const buildCommentTree = (postComments) => {
                const commentMap = {};
                const rootComments = [];
                postComments.forEach(c => { commentMap[c.id] = { ...c, replies: [] }; });
                postComments.forEach(c => { rootComments.push(commentMap[c.id]); });
                return rootComments;
            };

            const formatted = posts.map(post => {
                const postComments = comments ? comments.filter(c => c.post_id === post.id) : [];
                const createdDate = new Date(post.created_at);
                const formattedTime = createdDate.toLocaleDateString('ko-KR', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                }).replace(/\. /g, '.').replace(/\./g, '/').slice(0, -1) + ' ' + createdDate.toLocaleTimeString('ko-KR', {
                    hour: '2-digit', minute: '2-digit', hour12: false,
                }).replace(' ', ''); 

                return {
                    ...post,
                    author: post.profiles?.name || '알 수 없음',
                    team: post.profiles?.team,
                    time: new Date(post.created_at).toLocaleDateString(), 
                    formattedTime: formattedTime, 
                    likes: post.likes ? (typeof post.likes === 'string' ? JSON.parse(post.likes) : post.likes) : [], 
                    isLiked: false,
                    comments: buildCommentTree(postComments), 
                    totalComments: postComments.length 
                };
            });
            if (currentUser) {
                formatted.forEach(p => { p.isLiked = p.likes.includes(currentUser.id); });
            }
            setFeeds(formatted);
        }
    } catch (err) { console.error(err); }
  }, [supabase, currentUser]);

  const fetchProfiles = useCallback(async () => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('profiles').select('*');
        if (data) setProfiles(data);
    } catch (err) { console.error(err); }
  }, [supabase]);

  const fetchRedemptionList = useCallback(async () => {
      if (!supabase) return;
      try {
          const { data } = await supabase.from('redemption_requests').select('*').order('created_at', { ascending: false });
          if(data) setRedemptionList(data);
      } catch (err) { console.error(err); }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return; 

    // 테이블 변경 시 fetchFeeds를 통해 데이터 갱신
    const channel = supabase.channel('public:comments_posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => { fetchFeeds(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { fetchFeeds(); })
        .subscribe();

    try {
        supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
            fetchUserData(session.user.id);
            fetchPointHistory(session.user.id);
        }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
            fetchUserData(session.user.id);
            fetchPointHistory(session.user.id);
        }
        else setCurrentUser(null);
        });

        fetchFeeds();
        fetchProfiles();
        fetchAllPointHistory(); // 전체 포인트 히스토리 로드
        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    } catch(err) { console.error("Supabase init error:", err); }
  }, [supabase, fetchFeeds, fetchPointHistory, fetchProfiles, fetchUserData, fetchAllPointHistory]);

  const checkSupabaseConfig = () => {
    if (!supabase) return false;
    if (SUPABASE_URL.includes('your-project-url')) return false; 
    return true;
  };
  
  const handleBirthdayGrant = async () => {
    if (!currentUser || !checkSupabaseConfig()) return;
    try {
        const newPoints = (currentUser.points || 0) + 1000;
        await supabase.from('profiles').update({ points: newPoints, birthday_granted: true }).eq('id', currentUser.id);
        await supabase.from('point_history').insert({ user_id: currentUser.id, reason: '생일 축하 포인트', amount: 1000, type: 'earn' });
        setShowBirthdayPopup(false);
        fetchUserData(currentUser.id);
        fetchPointHistory(currentUser.id);
        fetchAllPointHistory(); // 랭킹 갱신
    } catch (err) { console.error('오류 발생: ', err.message); }
  };

  const handleLikePost = async (postId, currentLikes, isLiked) => {
      if (!currentUser || !checkSupabaseConfig()) return;
      const userId = currentUser.id;
      let newLikes = [...currentLikes];

      if (isLiked) { newLikes = newLikes.filter(id => id !== userId); } 
      else { newLikes.push(userId); }
      
      setFeeds(feeds.map(f => f.id === postId ? { ...f, likes: newLikes, isLiked: !isLiked } : f));
      
      try { await supabase.from('posts').update({ likes: newLikes }).eq('id', postId); } 
      catch (err) { console.error(err); fetchFeeds(); }
  };

  // 댓글 추가 함수 수정: setTimeout 제거
  const handleAddComment = async (e, postId, parentId = null) => {
      e.preventDefault();
      const content = e.target.commentContent.value;
      if (!content || !currentUser) return;
      
      try {
          await supabase.from('comments').insert({ 
              post_id: postId, author_id: currentUser.id, content: content, parent_id: parentId 
          });
          e.target.reset();
          // fetchFeeds(); // 실시간 리스너가 처리
      } catch (err) { console.error('댓글 작성 실패: ', err.message); }
  };
  
  // 댓글 삭제 함수 수정: setTimeout 제거
  const handleDeleteComment = async (commentId) => {
      if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
      try {
          await supabase.from('comments').delete().eq('id', commentId);
          // fetchFeeds(); // 실시간 리스너가 처리
      } catch (err) { console.error('삭제 실패: ', err.message); }
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) return;
    const postToDelete = feeds.find(f => f.id === postId);
    if (!postToDelete) return;

    if (currentUser.id !== postToDelete.author_id && currentUser.role !== 'admin') {
        alert('삭제 권한이 없습니다.');
        return;
    }
    if (!window.confirm('게시글을 삭제하시겠습니까? 삭제 시 지급된 포인트가 회수됩니다.')) return;

    try {
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) throw error;
        
        if (['praise', 'knowhow', 'matjib'].includes(postToDelete.type)) {
            const newPoints = Math.max(0, currentUser.points - 100); 
            await supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id);
            
            let reasonText = '게시글 삭제 (포인트 회수)';
            if (postToDelete.type === 'praise') reasonText = '게시글 삭제(칭찬) - 회수';
            else if (postToDelete.type === 'knowhow') reasonText = '게시글 삭제(꿀팁) - 회수';
            else if (postToDelete.type === 'matjib') reasonText = '게시글 삭제(맛집) - 회수';

            await supabase.from('point_history').insert({ user_id: currentUser.id, reason: reasonText, amount: 100, type: 'use' });
            fetchUserData(currentUser.id); 
            fetchAllPointHistory(); // 랭킹 갱신
        }
        fetchFeeds();
    } catch (err) { console.error('삭제 실패: ', err.message); }
  };

  const handleRedeemPoints = async () => {
    if (!currentUser || currentUser.points < 10000) return;
    if (!window.confirm('10,000P를 사용하여 포인트 차감 신청을 하시겠습니까?')) return;
    try {
        await supabase.from('redemption_requests').insert({ user_id: currentUser.id, user_name: currentUser.name, amount: 10000 });
        
        const newPoints = currentUser.points - 10000;
        await supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id);
        await supabase.from('point_history').insert({ user_id: currentUser.id, reason: '포인트 차감 신청', amount: 10000, type: 'use' });
        
        fetchUserData(currentUser.id);
        fetchPointHistory(currentUser.id);
        setShowUserInfoModal(false);
    } catch (err) { console.error('신청 실패: ', err.message); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!checkSupabaseConfig()) return;
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
        const { data: userCheck } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            if (userCheck === null) {
                 alert('가입되지 않은 이메일 계정입니다.');
            } else {
                 alert('비밀번호가 일치하지 않습니다.');
            }
        }
    } catch (err) { 
        console.error('로그인 실패: ', err.message); 
        alert('로그인 중 오류가 발생했습니다.');
    } finally { 
        setLoading(false); 
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!checkSupabaseConfig()) return;
    setLoading(true);
    const { name, email, password, dept, team, code, birthdate, calendarType } = e.target;
    let role = 'member';
    if (code.value === 'admin2026') role = 'admin';
    else if (code.value && code.value !== 'admin2026') { alert('잘못된 인증 코드입니다.'); setLoading(false); return; }
    try {
        const initialData = { 
            name: name.value, dept: dept.value, team: team.value, role: role, points: INITIAL_POINTS, 
            birthdate: birthdate.value, calendar_type: calendarType.value, email: email.value 
        };
        const { data: signUpResult, error } = await supabase.auth.signUp({ email: email.value, password: password.value, options: { data: initialData } });
        if (error) throw error;
        await supabase.from('point_history').insert({ user_id: signUpResult.user.id, reason: '최초 가입 포인트', amount: INITIAL_POINTS, type: 'earn' });
    } catch (err) { console.error('가입 실패: ', err.message); } finally { setLoading(false); }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !checkSupabaseConfig()) return;

    const category = e.target.category.value;
    const isRewardCategory = ['praise', 'knowhow', 'matjib'].includes(category);
    let rewardPoints = isRewardCategory ? 100 : 0; 
    
    const content = e.target.content.value;
    const title = e.target.title ? e.target.title.value : null;
    const targetName = e.target.targetName ? e.target.targetName.value : null;
    const regionMain = e.target.regionMain ? e.target.regionMain.value : null;
    const regionSub = e.target.regionSub ? e.target.regionSub.value : null;
    const linkUrl = e.target.linkUrl ? e.target.linkUrl.value : null;

    const file = e.target.file?.files[0];
    let publicImageUrl = null;

    try {
        if (file) {
           const fileExt = file.name.split('.').pop();
           const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
           const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);
           if (!uploadError) {
               const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
               publicImageUrl = publicUrl;
           }
        }

        const { error: postError } = await supabase.from('posts').insert({
            content: content, type: category, author_id: currentUser.id, image_url: publicImageUrl, 
            target_name: targetName, title: title, region_main: regionMain, region_sub: regionSub, link_url: linkUrl, likes: [] 
        });

        if (postError) throw postError;

        if (rewardPoints > 0) {
            const newPoints = (currentUser.points || 0) + rewardPoints;
            await supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id);
            
            let reasonText = `게시글 작성 (${category})`;
            if (category === 'praise') reasonText = '게시글 작성(칭찬)';
            else if (category === 'knowhow') reasonText = '게시글 작성(꿀팁)';
            else if (category === 'matjib') reasonText = '게시글 작성(맛집소개)';

            await supabase.from('point_history').insert({ user_id: currentUser.id, reason: reasonText, amount: rewardPoints, type: 'earn' });
        }
        setShowWriteModal(false);
        fetchFeeds();
        fetchUserData(currentUser.id);
        fetchAllPointHistory(); // 랭킹 갱신
    } catch (err) { console.error('작성 실패: ', err.message); }
  };

  const handleMoodCheck = async (selectedMood) => {
    if (mood || !checkSupabaseConfig()) return;
    setMood(selectedMood);
    
    let message = "";
    let emoji = "";
    if (selectedMood === 'happy') {
        message = "오늘 기분 최고예요! 뭐든 할 준비 완료! 😄";
        emoji = "✨";
    } else if (selectedMood === 'soso') {
        message = "괜찮아요! 오늘도 잘 해낼 거예요! 💪";
        emoji = "🍀";
    } else if (selectedMood === 'sad') {
        message = "조금 지쳤지만 버틸 수 있어요.. 🐌";
        emoji = "☕";
    }
    
    setToast({ visible: true, message, emoji });
    setTimeout(() => setToast({ ...toast, visible: false }), 3000); 

    try {
        const newPoints = (currentUser.points || 0) + 10;
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('profiles').update({ points: newPoints, last_attendance: todayStr }).eq('id', currentUser.id);
        await supabase.from('point_history').insert({ user_id: currentUser.id, reason: '출석체크', amount: 10, type: 'earn' });
        fetchUserData(currentUser.id);
        fetchAllPointHistory(); // 랭킹 갱신
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    if (!supabase) return; 
    try {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSession(null);
        setMood(null);
        setPointHistory([]);
    } catch (err) { console.error('로그아웃 실패: ', err.message); }
  };

  const handleChangePasswordClick = async () => {
    if (!currentUser || !supabase) return; 
    if (!window.confirm('비밀번호를 초기화(15661566) 하시겠습니까?')) return;
    try {
        const { error } = await supabase.auth.updateUser({ password: '15661566' });
        if (error) throw error;
    } catch (err) { console.error('변경 실패: ', err.message); }
  };

  const handleChangeDept = async (newDept, newTeam) => {
      if (!currentUser || !supabase) return;
      try {
          await supabase.from('profiles').update({ dept: newDept, team: newTeam }).eq('id', currentUser.id);
          fetchUserData(currentUser.id);
          setShowChangeDeptModal(false);
          alert('소속이 변경되었습니다.');
      } catch(err) { console.error(err); }
  };

  const handleChangePassword = async (newPassword) => {
      if (!currentUser || !supabase) return;
      try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          setShowChangePwdModal(false);
          alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
          handleLogout();
      } catch(err) { console.error(err); }
  };

  const handleAdminGrantPoints = async (targetUserId, amount) => {
      if (!currentUser || !supabase) return;
      if (currentUser.role !== 'admin') return;

      try {
          const { data: targetUser } = await supabase.from('profiles').select('points').eq('id', targetUserId).single();
          if (!targetUser) return;

          const newPoints = (targetUser.points || 0) + parseInt(amount);
          await supabase.from('profiles').update({ points: newPoints }).eq('id', targetUserId);
          await supabase.from('point_history').insert({ 
              user_id: targetUserId, 
              reason: '관리자 특별 지급', 
              amount: parseInt(amount), 
              type: 'earn' 
          });
          
          setShowAdminGrantModal(false);
          alert('포인트 지급이 완료되었습니다.');
          fetchProfiles(); 
          fetchAllPointHistory(); // 랭킹 갱신
      } catch(err) { console.error(err); }
  };

  const handleNavigateToFeedWithFilter = (type) => {
    setActiveTab('feed');
    setActiveFeedFilter(type);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      <div className="w-full max-w-md h-full min-h-screen shadow-2xl relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="relative z-10 h-full flex flex-col">
          {!session ? (
            <AuthForm isSignupMode={isSignupMode} setIsSignupMode={setIsSignupMode} handleLogin={handleLogin} handleSignup={handleSignup} loading={loading} />
          ) : (
            <>
              <Header 
                currentUser={currentUser} 
                onOpenUserInfo={() => setShowUserInfoModal(true)} 
                handleLogout={handleLogout} 
                onOpenChangeDept={() => setShowChangeDeptModal(true)}
                onOpenChangePwd={() => setShowChangePwdModal(true)}
                onOpenAdminGrant={() => setShowAdminGrantModal(true)}
                onOpenRedemptionList={() => { fetchRedemptionList(); setShowRedemptionListModal(true); }}
              />
              <main className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === 'home' && <HomeTab 
                  mood={mood} 
                  handleMoodCheck={handleMoodCheck} 
                  feeds={feeds} 
                  weeklyBirthdays={weeklyBirthdays} 
                  onWriteClick={() => setShowWriteModal(true)} 
                  onNavigateToNews={() => setActiveTab('news')} 
                  onNavigateToFeed={handleNavigateToFeedWithFilter}
                />}
                
                {activeTab === 'feed' && <FeedTab 
                    feeds={feeds} 
                    activeFeedFilter={activeFeedFilter} 
                    setActiveFeedFilter={setActiveFeedFilter} 
                    onWriteClick={() => setShowWriteModal(true)} 
                    currentUser={currentUser} 
                    handleDeletePost={handleDeletePost} 
                    handleLikePost={handleLikePost} 
                    handleAddComment={handleAddComment} 
                    handleDeleteComment={handleDeleteComment} 
                />}
                {/* 랭킹 탭에 전체 포인트 이력을 전달 */}
                {activeTab === 'ranking' && <RankingTab feeds={feeds} profiles={profiles} allPointHistory={allPointHistory} />}
                {activeTab === 'news' && <NoticeBoard feeds={feeds} onWriteClick={() => setShowWriteModal(true)} currentUser={currentUser} />}
              </main>
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
              
              {/* Modals */}
              {showWriteModal && <WriteModal setShowWriteModal={setShowWriteModal} handlePostSubmit={handlePostSubmit} currentUser={currentUser} activeTab={activeTab} />}
              {showUserInfoModal && currentUser && <UserInfoModal currentUser={currentUser} pointHistory={pointHistory} setShowUserInfoModal={setShowUserInfoModal} handleRedeemPoints={handleRedeemPoints} />}
              {showBirthdayPopup && currentUser && <BirthdayPopup currentUser={currentUser} handleBirthdayGrant={handleBirthdayGrant} setShowBirthdayPopup={setShowBirthdayPopup} />}
              
              {/* Settings Modals */}
              {showChangeDeptModal && <ChangeDeptModal onClose={() => setShowChangeDeptModal(false)} onSave={handleChangeDept} />}
              {showChangePwdModal && <ChangePasswordModal onClose={() => setShowChangePwdModal(false)} onSave={handleChangePassword} />}
              {showAdminGrantModal && <AdminGrantModal onClose={() => setShowAdminGrantModal(false)} onGrant={handleAdminGrantPoints} profiles={profiles} />}
              {showRedemptionListModal && <RedemptionListModal onClose={() => setShowRedemptionListModal(false)} redemptionList={redemptionList} />}
              
              {/* Admin Alert Modal (New) */}
              {showAdminAlertModal && <AdminAlertModal onClose={handleCloseAdminAlert} />}
              
              {/* Toast */}
              <MoodToast visible={toast.visible} message={toast.message} emoji={toast.emoji} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
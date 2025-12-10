import React, { useState, useEffect, useCallback } from 'react';
import { User, Heart, MessageCircle, Gift, Bell, Sparkles, Smile, Frown, Meh, Megaphone, X, Send, Settings, ChevronRight, LogOut, Image as ImageIcon, Coins, Pencil, Trash2, Loader2, Lock, Clock, Award, Wallet, Building2, CornerDownRight, Link as LinkIcon, MapPin, Search } from 'lucide-react';

// --- [필수] Supabase 설정 ---
// 주의: 배포 시에는 보안을 위해 이 값들을 환경 변수(process.env...)로 변경하는 것이 좋습니다.
// 현재 미리보기 환경 작동을 위해 하드코딩된 값을 사용합니다.
const SUPABASE_URL = 'https://clsvsqiikgnreqqvcrxj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc3ZzcWlpa2ducmVxcXZjcnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzcyNjAsImV4cCI6MjA4MDk1MzI2MH0.lsaycyp6tXjLwb-qB5PIQ0OqKweTWO3WaxZG5GYOUqk';

// --- 상수 데이터 ---
const ORGANIZATION = {
  '본사': ['보상기획팀', '총무팀', '재무팀'],
  '서울보상부': ['플랫폼개발팀', 'AI연구센터', 'QA파트', '디자인팀'],
  '경인보상부': ['국내영업팀', '해외영업팀', '브랜드마케팅팀', 'CS센터'],
  '중부보상부': ['기획파트', '사업개발팀']
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
  // 한국어 이름의 경우 성(첫 글자)을 제외하고 반환
  if (/[가-힣]{2,}/.test(name)) {
      return name.substring(1); 
  }
  return name; 
};

// 이름의 첫 글자만 반환
const formatInitial = (name) => {
    if (!name) return '';
    return name.charAt(0);
};

// 주간 생일자 목록 계산
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
        // eslint-disable-next-line no-unused-vars
        const [_, m, d] = p.birthdate.split('-').map(Number);
        const birthDate = new Date(currentYear, m - 1, d); 
        let normalizedBirthDate = normalizeDate(birthDate);

        // 오늘 생일은 팝업으로 처리하므로 목록에서 제외
        if (normalizedBirthDate.getTime() === normalizedToday.getTime()) return; 
        
        // 이미 지난 생일이면 다음 해로 이동
        if (normalizedBirthDate < normalizedToday) {
             const nextYearBirthDate = new Date(currentYear + 1, m - 1, d);
             normalizedBirthDate = normalizeDate(nextYearBirthDate);
        }
        
        // 이번 주 생일
        if (normalizedBirthDate >= normalizedToday && normalizedBirthDate < normalizeDate(endOfCurrentWeek)) {
             currentBirthdays.push({ name: p.name, date: `${m}/${d}` });
        } 
        // 다음 주 생일
        else if (normalizedBirthDate >= normalizeDate(endOfCurrentWeek) && normalizedBirthDate < normalizeDate(endOfNextWeek)) {
             nextBirthdays.push({ name: p.name, date: `${m}/${d}` });
        }
    });

    return { current: currentBirthdays, next: nextBirthdays };
};

// 금일 작성 여부 확인 헬퍼
const isToday = (timestamp) => {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

// --- Sub Components ---

const AuthForm = ({ isSignupMode, setIsSignupMode, handleLogin, handleSignup, loading }) => {
  const [selectedDept, setSelectedDept] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [calendarType, setCalendarType] = useState('solar'); 

  return (
    // 테마: 배경색을 밝은 파스텔톤으로
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
            
            {/* 생년월일 음력/양력 선택 */}
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
              {/* 관리자 코드 숨김 처리 (type="password") 및 안내 문구 수정 */}
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

const Header = ({ currentUser, onOpenUserInfo, handleLogout, handleChangePasswordClick }) => {
  const todayDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const [showSettings, setShowSettings] = useState(false);
  const displayName = formatName(currentUser?.name);
  
  return (
    // 테마 수정: 헤더 배경색은 유지
    <div className="bg-white/80 backdrop-blur-md p-4 sticky top-0 z-30 border-b border-slate-100 shadow-sm">
      <div className="text-[10px] text-blue-400 font-bold mb-1 pl-1">{todayDate}</div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <img src={AXA_LOGO_URL} alt="AXA Logo" className="w-8 h-auto" />
            <h1 className="text-lg font-black text-slate-800 tracking-tight">AXA Connect</h1>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <div className="bg-white text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-slate-100 shadow-sm">
             <Coins className="w-4 h-4 text-yellow-400 fill-yellow-400" />
             <span className="text-[10px] text-slate-400">나의 포인트</span>
             {currentUser?.points?.toLocaleString() || 0} P
          </div>

          <button onClick={onOpenUserInfo} className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md hover:ring-2 ring-blue-200 transition-all">
            {displayName}
          </button>

          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors relative z-40"><Settings className="w-5 h-5 text-slate-400" /></button>
          
          {showSettings && (
             <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-fade-in">
                {/* 비밀번호 초기화 */}
                <button onClick={handleChangePasswordClick} className="flex items-center gap-2 w-full p-3 text-sm text-slate-600 hover:bg-slate-50 border-b border-slate-50 transition-colors">
                   <Lock className="w-4 h-4 text-blue-400"/> 비밀번호 초기화
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 w-full p-3 text-sm text-red-400 hover:bg-red-50 transition-colors">
                   <LogOut className="w-4 h-4"/> 로그아웃
                </button>
             </div>
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
                    {/* 촛불 효과 */}
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
                                    <p className="text-[10px] text-slate-400">{b.date}</p>
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
    // 홈화면 게시글 목록 복원
    const noticeFeedsAll = feeds.filter(f => f.type === 'news');
    const noticeFeeds = noticeFeedsAll.slice(0, 3);
    const praiseFeeds = feeds.filter(f => f.type === 'praise').slice(0, 5); // 5개 표시
    const infoFeeds = feeds.filter(f => f.type === 'knowhow' || f.type === 'matjib').slice(0, 5); // 5개 표시

    const handleSectionClick = (type) => {
        onNavigateToFeed(type); // 섹션 클릭 시 필터링하여 FeedTab으로 이동 (이전 요청 로직)
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
                      className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 duration-200 border 
                      ${mood === 'happy' ? 'bg-blue-500 border-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200' : 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 opacity-90'}`}
                      disabled={!!mood}
                    >
                      <Smile className="w-5 h-5"/>
                      <span className="text-[9px] font-bold">좋음</span>
                    </button>
                    <button 
                      onClick={() => handleMoodCheck('soso')} 
                      className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 duration-200 border 
                      ${mood === 'soso' ? 'bg-yellow-400 border-yellow-500 text-white shadow-md scale-105 ring-2 ring-yellow-200' : 'bg-yellow-400 border-yellow-400 text-white hover:bg-yellow-500 opacity-90'}`}
                      disabled={!!mood}
                    >
                      <Meh className="w-5 h-5"/>
                      <span className="text-[9px] font-bold">보통</span>
                    </button>
                    <button 
                      onClick={() => handleMoodCheck('sad')} 
                      className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 duration-200 border 
                      ${mood === 'sad' ? 'bg-orange-500 border-orange-600 text-white shadow-md scale-105 ring-2 ring-orange-200' : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 opacity-90'}`}
                      disabled={!!mood}
                    >
                      <Frown className="w-5 h-5"/>
                      <span className="text-[9px] font-bold">피곤</span>
                    </button>
                  </div>
                  {/* 출석체크 섹션 황금동전 +10P 추가 */}
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
        <div className="grid grid-cols-2 gap-4 min-h-[300px]">
            {/* 칭찬합시다 섹션 */}
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
            {/* 업무꿀팁 & 맛집소개 섹션 */}
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
    // 테마 수정: 배경색을 밝은 파스텔톤으로
    <div className="p-5 space-y-5 pb-28 animate-fade-in bg-blue-50">
      {/* 검색바 */}
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
          {/* 7. 포인트 지급 안내 문구 */}
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
                  {/* 작성일자와 작성 시간 표시 */}
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
                
                {/* 2. 칭찬 대상자 이름 앞에 To. 추가 */}
                {feed.type === 'praise' && feed.target_name && <p className="text-xs font-bold text-green-600 mb-1">To. {feed.target_name}</p>}
                
                <h3 className="text-base font-bold text-slate-800 mb-1.5">
                    {feed.title || '제목 없음'}
                    {isToday(feed.created_at) && <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-sm inline-block">NEW</span>}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{feed.content}</p>
                {feed.link_url && (
                    <a href={feed.link_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-1.5 rounded-lg hover:underline w-full truncate">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{feed.link_url}</span>
                    </a>
                )}
            </div>
            
            {feed.image_url && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-100 shadow-sm"><img src={feed.image_url} alt="Content" className="w-full h-auto object-cover" /></div>
            )}
            
            <div className="flex items-center gap-4 border-t border-slate-50 pt-3">
              {/* 1. 좋아요 토글 로직은 handleLikePost에서 처리 */}
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
            
            {/* 댓글 영역 (Live) */}
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
  
  // 8, 9. 카테고리 설정 (탭에 따라 다르게, 이름 변경 반영)
  // HomeTab에서 글쓰기 모달을 호출할 때는 activeTab이 'home'이므로, 'news'는 자동으로 제외됩니다.
  const categories = [
    {id: 'praise', label: '칭찬하기', show: activeTab !== 'news'},
    {id: 'matjib', label: '맛집소개', show: activeTab !== 'news'},
    {id: 'knowhow', label: '업무꿀팁', show: activeTab !== 'news'},
    {id: 'news', label: '공지사항', show: activeTab === 'news' && currentUser?.role === 'admin'}
  ].filter(c => c.show);

  useEffect(() => {
      // 카테고리 초기값 설정
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

const RankingTab = ({ feeds, profiles }) => {
    // 10. 월별 명예의 전당 타이틀 수정 (현재 월 표시)
    const currentMonth = new Date().getMonth();
    const currentMonthName = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const isCurrentMonth = (dateString) => {
        if(!dateString) return false;
        const d = new Date(dateString);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    };

    const pointRanking = [...profiles].sort((a, b) => b.points - a.points).slice(0, 3);

    const postCounts = {};
    feeds.filter(f => isCurrentMonth(f.created_at)).forEach(f => {
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
    feeds.filter(f => isCurrentMonth(f.created_at)).forEach(f => {
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
                <p className="text-sm font-bold text-slate-800">{name || 'Unknown'}</p> {/* 이름 전체 표시 */}
                <p className="text-[10px] text-slate-400">{team}</p>
            </div>
            <div className="text-base font-black text-slate-700 ml-4">{value}<span className="text-[10px] text-slate-400 ml-0.5 font-normal">{unit}</span></div>
        </div>
    );
    return (
        <div className="p-5 space-y-8 pb-28 animate-fade-in bg-blue-50">
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-blue-100 text-center">
                <h2 className="text-lg font-black text-slate-800 mb-1">🏆 {currentYear}년 {currentMonthName}월의 명예의 전당</h2> {/* 타이틀 수정 */}
                <p className="text-xs text-slate-400">매월 1일 초기화됩니다</p>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2 mb-2 ml-1"><Coins className="w-4 h-4 text-yellow-500"/> 누적 포인트 랭킹</h3>
                <div className="space-y-2">{pointRanking.map((p, i) => <RankItem key={i} rank={i+1} name={p.name} team={p.team} value={p.points.toLocaleString()} unit="P" color="text-yellow-500"/>)}</div>
            </div>
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2 mb-2 ml-1"><Pencil className="w-4 h-4 text-green-500"/> 소통왕 (게시글)</h3>
                <div className="space-y-2">{postRanking.length > 0 ? postRanking.map((p, i) => <RankItem key={i} rank={i+1} {...p} color="text-green-500"/>) : <p className="text-center text-xs text-slate-300 py-4 border border-dashed border-slate-200 rounded-xl">아직 데이터가 없습니다.</p>}</div>
            </div>
            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2 mb-2 ml-1"><Heart className="w-4 h-4 text-red-500"/> 인기왕 (좋아요)</h3>
                <div className="space-y-2">{likeRanking.length > 0 ? likeRanking.map((p, i) => <RankItem key={i} rank={i+1} {...p} color="text-red-500"/>) : <p className="text-center text-xs text-slate-300 py-4 border border-dashed border-slate-200 rounded-xl">아직 데이터가 없습니다.</p>}</div>
            </div>
        </div>
    );
};

// 하단 네비게이션
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
  const [loading, setLoading] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeFeedFilter, setActiveFeedFilter] = useState('all');
  const [mood, setMood] = useState(null);
  const weeklyBirthdays = getWeeklyBirthdays(profiles);

  useEffect(() => {
    // Supabase 라이브러리 로드
    if (window.supabase) {
        initSupabase();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = initSupabase;
    document.body.appendChild(script);
  }, []);

  const initSupabase = () => {
    if (!window.supabase) return;
    const { createClient } = window.supabase;
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    setSupabase(client);
  };
  
  // 생일 팝업 확인 로직
  const checkBirthday = useCallback((user) => {
    // 포인트를 이미 받았거나 생일이 없으면 팝업을 띄우지 않음
    if (!user.birthdate || user.birthday_granted) return; 
    
    const today = new Date();
    // month: 0-11, date: 1-31
    const currentMonth = today.getMonth() + 1;
    
    // eslint-disable-next-line no-unused-vars
    const [_, m, d] = user.birthdate.split('-').map(Number);
    const birthMonth = m;

    // 현재 월이 생일 월과 일치하면 팝업 활성화
    if (currentMonth === birthMonth) {
        setShowBirthdayPopup(true);
    }
  }, []);

  // 사용자 프로필 데이터 불러오기
  const fetchUserData = useCallback(async (userId) => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (data) {
        setCurrentUser(data);
        const todayStr = new Date().toISOString().split('T')[0];
        // 마지막 출석일이 오늘이면 mood 상태 업데이트
        if (data.last_attendance === todayStr) setMood('checked');
        
        // 로그인 시 생일 체크 및 팝업 활성화
        // checkBirthday는 useCallback에 의존성이 포함되어 있으므로 여기서 호출합니다.
        checkBirthday(data);
        }
    } catch (err) { console.error(err); }
  }, [supabase, checkBirthday]);

  // 포인트 사용/적립 내역 불러오기
  const fetchPointHistory = useCallback(async (userId) => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('point_history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (data) setPointHistory(data);
    } catch (err) { console.error(err); }
  }, [supabase]);

  // 댓글 구조화 및 게시글 데이터 가져오기
  const fetchFeeds = useCallback(async () => {
    if (!supabase) return; 
    try {
        // 게시글 정보 (작성자 프로필 join)
        const { data: posts } = await supabase.from('posts').select(`*, profiles:author_id (name, dept, team, role)`).order('created_at', { ascending: false });
        // 댓글 정보 (작성자 프로필 join)
        const { data: comments } = await supabase.from('comments').select(`*, profiles:author_id (name, role)`).order('created_at', { ascending: true });

        if (posts) {
            // 댓글 트리 구조 생성 함수 (현재는 계층 구조 없이 1레벨만 표시)
            const buildCommentTree = (postComments) => {
                const commentMap = {};
                const rootComments = [];
                
                postComments.forEach(c => {
                    commentMap[c.id] = { ...c, replies: [] };
                });
                
                postComments.forEach(c => {
                    // 댓글은 전부 루트 댓글로 간주하고 정렬 순서대로 유지
                    rootComments.push(commentMap[c.id]);
                });
                return rootComments;
            };

            const formatted = posts.map(post => {
                const postComments = comments ? comments.filter(c => c.post_id === post.id) : [];
                
                // 작성일자 + 작성 시간 포맷팅
                const createdDate = new Date(post.created_at);
                const formattedTime = createdDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }).replace(/\. /g, '.').replace(/\./g, '/').slice(0, -1) + ' ' + createdDate.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }).replace(' ', ''); // 'YYYY/MM/DD HH:MM' 형식

                return {
                    ...post,
                    author: post.profiles?.name || '알 수 없음',
                    team: post.profiles?.team,
                    time: new Date(post.created_at).toLocaleDateString(), // 레거시 필드 유지
                    formattedTime: formattedTime, // 새 필드 추가
                    likes: post.likes ? (typeof post.likes === 'string' ? JSON.parse(post.likes) : post.likes) : [], 
                    isLiked: false,
                    comments: buildCommentTree(postComments), // 트리 구조 댓글
                    totalComments: postComments.length // 전체 댓글 수
                };
            });
            
            // 현재 로그인된 사용자의 좋아요 상태 반영
            if (currentUser) {
                formatted.forEach(p => {
                    // 좋아요 상태 업데이트 (DB 데이터와 현재 사용자 비교)
                    p.isLiked = p.likes.includes(currentUser.id);
                });
            }
            setFeeds(formatted);
        }
    } catch (err) { console.error(err); }
  }, [supabase, currentUser]);

  // 전체 프로필 목록 불러오기 (랭킹 등에 사용)
  const fetchProfiles = useCallback(async () => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('profiles').select('*');
        if (data) setProfiles(data);
    } catch (err) { console.error(err); }
  }, [supabase]);

  // 메인 데이터 구독 및 초기 인증
  useEffect(() => {
    if (!supabase) return; 

    // Realtime 구독 (댓글/게시글 변경 감지 시 즉시 반영)
    const channel = supabase.channel('public:comments_posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
            fetchFeeds();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
            fetchFeeds();
        })
        .subscribe();

    try {
        // 초기 세션 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) {
            fetchUserData(session.user.id);
            fetchPointHistory(session.user.id);
        }
        });

        // 인증 상태 변화 감지
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
        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    } catch(err) {
        console.error("Supabase init error:", err);
    }
  }, [supabase, fetchFeeds, fetchPointHistory, fetchProfiles, fetchUserData]);

  // Supabase 설정 확인 (하드코딩된 값 사용 중인지 체크)
  const checkSupabaseConfig = () => {
    if (!supabase) return false;
    if (SUPABASE_URL.includes('your-project-url')) return false; // 예시 값 방지
    return true;
  };
  
  // 생일 축하 포인트 지급
  const handleBirthdayGrant = async () => {
    if (!currentUser || !checkSupabaseConfig()) return;
    try {
        const newPoints = (currentUser.points || 0) + 1000;
        await supabase.from('profiles').update({ points: newPoints, birthday_granted: true }).eq('id', currentUser.id);
        await supabase.from('point_history').insert({ user_id: currentUser.id, reason: '생일 축하 포인트', amount: 1000, type: 'earn' });
        // alert('생일 축하 포인트 1,000P가 지급되었습니다! 🎉'); // alert 대신 커스텀 모달 사용 권장
        setShowBirthdayPopup(false);
        fetchUserData(currentUser.id);
        fetchPointHistory(currentUser.id);
    } catch (err) { console.error('오류 발생: ', err.message); }
  };

  // 1. 좋아요 토글 로직
  const handleLikePost = async (postId, currentLikes, isLiked) => {
      if (!currentUser || !checkSupabaseConfig()) return;
      const userId = currentUser.id;
      let newLikes = [...currentLikes];

      // 좋아요를 이미 눌렀다면 (취소)
      if (isLiked) {
          newLikes = newLikes.filter(id => id !== userId);
      } 
      // 좋아요를 누르지 않았다면 (등록)
      else {
          newLikes.push(userId);
      }
      
      // Optimistic Update (UI 즉시 반영)
      setFeeds(feeds.map(f => f.id === postId ? { ...f, likes: newLikes, isLiked: !isLiked } : f));
      
      // DB 업데이트
      try { 
          await supabase.from('posts').update({ likes: newLikes }).eq('id', postId); 
      } catch (err) { 
          console.error(err); 
          fetchFeeds(); // 실패 시 롤백 (데이터 다시 가져오기)
      }
  };

  // 댓글 추가
  const handleAddComment = async (e, postId, parentId = null) => {
      e.preventDefault();
      const content = e.target.commentContent.value;
      if (!content || !currentUser) return;
      
      try {
          await supabase.from('comments').insert({ 
              post_id: postId, 
              author_id: currentUser.id, 
              content: content,
              parent_id: parentId // 대댓글인 경우 부모 ID 저장
          });
          e.target.reset();
          // 실시간 기능이 작동하더라도 안전하게 한 번 더 fetch
          setTimeout(fetchFeeds, 500); 
      } catch (err) { console.error('댓글 작성 실패: ', err.message); }
  };
  
  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
      if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
      try {
          await supabase.from('comments').delete().eq('id', commentId);
          setTimeout(fetchFeeds, 500);
      } catch (err) { console.error('삭제 실패: ', err.message); }
  };

  // 게시글 삭제 (포인트 회수 로직 포함)
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
        
        // 포인트 회수 (칭찬, 꿀팁, 맛집 게시글만 해당)
        if (['praise', 'knowhow', 'matjib'].includes(postToDelete.type)) {
            const newPoints = Math.max(0, currentUser.points - 100); 
            await supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id);
            
            let reasonText = '게시글 삭제 (포인트 회수)';
            if (postToDelete.type === 'praise') reasonText = '게시글 삭제(칭찬) - 회수';
            else if (postToDelete.type === 'knowhow') reasonText = '게시글 삭제(꿀팁) - 회수';
            else if (postToDelete.type === 'matjib') reasonText = '게시글 삭제(맛집) - 회수';

            await supabase.from('point_history').insert({ 
                user_id: currentUser.id, 
                reason: reasonText, 
                amount: 100, 
                type: 'use' 
            });
            fetchUserData(currentUser.id); 
        }

        // alert('삭제되었습니다.'); // alert 대신 커스텀 모달 사용 권장
        fetchFeeds();
    } catch (err) { console.error('삭제 실패: ', err.message); }
  };

  // 포인트 상품권 교환 신청
  const handleRedeemPoints = async () => {
    if (!currentUser || currentUser.points < 10000) return;
    if (!window.confirm('10,000P를 사용하여 포인트 차감 신청을 하시겠습니까?')) return;
    try {
        // 1. 신청 내역 DB 기록
        await supabase.from('redemption_requests').insert({ user_id: currentUser.id, user_name: currentUser.name, amount: 10000 });
        
        // 2. 포인트 차감 및 히스토리 기록
        const newPoints = currentUser.points - 10000;
        await supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id);
        await supabase.from('point_history').insert({ user_id: currentUser.id, reason: '포인트 차감 신청', amount: 10000, type: 'use' });
        
        // 3. 관리자에게 메일 발송 (이 부분은 실제로 작동하지 않을 수 있습니다. 웹 환경에 따라 mailto만 사용)
        const subject = encodeURIComponent(`[AXA Connect] 포인트 차감 신청 - ${currentUser.name}`);
        const body = encodeURIComponent(`사용자: ${currentUser.name} (${currentUser.email})\n신청 포인트: 10,000P\n\n처리 부탁드립니다.`);
        window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
        
        // alert('신청이 완료되었습니다.'); // alert 대신 커스텀 모달 사용 권장
        fetchUserData(currentUser.id);
        fetchPointHistory(currentUser.id);
        setShowUserInfoModal(false);
    } catch (err) { console.error('신청 실패: ', err.message); }
  };

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!checkSupabaseConfig()) return;
    setLoading(true);
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    } catch (err) { console.error('로그인 실패: ', err.message); } finally { setLoading(false); }
  };

  // 회원가입 처리
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!checkSupabaseConfig()) return;
    setLoading(true);
    // 회원가입 필드: calendarType 추가됨
    const { name, email, password, dept, team, code, birthdate, calendarType } = e.target;
    let role = 'member';
    if (code.value === 'admin2026') role = 'admin';
    else if (code.value && code.value !== 'admin2026') { alert('잘못된 인증 코드입니다.'); setLoading(false); return; }
    try {
        const initialData = { 
            name: name.value, 
            dept: dept.value, 
            team: team.value, 
            role: role, 
            points: INITIAL_POINTS, 
            birthdate: birthdate.value,
            calendar_type: calendarType.value // DB 저장
        };
        const { data: signUpResult, error } = await supabase.auth.signUp({ email: email.value, password: password.value, options: { data: initialData } });
        if (error) throw error;
        // 초기 포인트 지급
        await supabase.from('point_history').insert({ user_id: signUpResult.user.id, reason: '최초 가입 포인트', amount: INITIAL_POINTS, type: 'earn' });
        // alert('가입 완료! 자동 로그인됩니다.'); // alert 대신 커스텀 모달 사용 권장
    } catch (err) { console.error('가입 실패: ', err.message); } finally { setLoading(false); }
  };

  // 게시글 작성 처리 (이미지 업로드 및 포인트 지급 포함)
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
            content: content, 
            type: category, 
            author_id: currentUser.id, 
            image_url: publicImageUrl, 
            target_name: targetName,
            title: title,
            region_main: regionMain,
            region_sub: regionSub,
            link_url: linkUrl,
            likes: [] 
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
            // alert(`등록되었습니다! (+${rewardPoints}P)`); // alert 대신 커스텀 모달 사용 권장
        } else {
             // alert('등록되었습니다.'); // alert 대신 커스텀 모달 사용 권장
        }
        setShowWriteModal(false);
        fetchFeeds();
        fetchUserData(currentUser.id);
    } catch (err) { console.error('작성 실패: ', err.message); }
  };

  // 오늘의 기분 (출석 체크)
  const handleMoodCheck = async (selectedMood) => {
    if (mood || !checkSupabaseConfig()) return;
    setMood(selectedMood);
    try {
        const newPoints = (currentUser.points || 0) + 10;
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('profiles').update({ points: newPoints, last_attendance: todayStr }).eq('id', currentUser.id);
        await supabase.from('point_history').insert({ user_id: currentUser.id, reason: '출석체크', amount: 10, type: 'earn' });
        fetchUserData(currentUser.id);
        // alert('출석체크 완료! (+10P)'); // alert 대신 커스텀 모달 사용 권장
    } catch (err) { console.error(err); }
  };

  // 로그아웃
  const handleLogout = async () => {
    if (!supabase) return; 
    try {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setSession(null);
        setMood(null);
        setPointHistory([]);
        // alert('로그아웃 되었습니다.'); // alert 대신 커스텀 모달 사용 권장
    } catch (err) { console.error('로그아웃 실패: ', err.message); }
  };

  // 비밀번호 초기화 (하드코딩된 임시 비밀번호로 변경)
  const handleChangePasswordClick = async () => {
    if (!currentUser || !supabase) return; 
    if (!window.confirm('비밀번호를 초기화(15661566) 하시겠습니까?')) return;
    try {
        const { error } = await supabase.auth.updateUser({ password: '15661566' });
        if (error) throw error;
        // alert('비밀번호가 15661566으로 변경되었습니다.'); // alert 대신 커스텀 모달 사용 권장
    } catch (err) { console.error('변경 실패: ', err.message); }
  };

  if (!supabase && !window.supabase) return <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-500 gap-2"><Loader2 className="animate-spin" /> 앱 로딩 중...</div>;

  // HomeTab에서 게시글 클릭 시 호출되어 탭과 필터를 변경 (섹션 헤더 클릭 시 사용)
  const handleNavigateToFeedWithFilter = (type) => {
    setActiveTab('feed');
    setActiveFeedFilter(type);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      {/* 테마 수정: 전체 배경색을 밝은 파스텔톤으로 */}
      <div className="w-full max-w-md h-full min-h-screen shadow-2xl relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">
        <div className="relative z-10 h-full flex flex-col">
          {!session ? (
            <AuthForm isSignupMode={isSignupMode} setIsSignupMode={setIsSignupMode} handleLogin={handleLogin} handleSignup={handleSignup} loading={loading} />
          ) : (
            <>
              <Header currentUser={currentUser} onOpenUserInfo={() => setShowUserInfoModal(true)} handleLogout={handleLogout} handleChangePasswordClick={handleChangePasswordClick} />
              <main className="flex-1 overflow-y-auto scrollbar-hide">
                {/* HomeTab을 다시 구성하여 게시글 목록을 포함합니다. */}
                {activeTab === 'home' && <HomeTab 
                  mood={mood} 
                  handleMoodCheck={handleMoodCheck} 
                  feeds={feeds} // feeds prop 추가
                  weeklyBirthdays={weeklyBirthdays} // weeklyBirthdays prop 추가
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
                {activeTab === 'ranking' && <RankingTab feeds={feeds} profiles={profiles} />}
                {activeTab === 'news' && <NoticeBoard feeds={feeds} onWriteClick={() => setShowWriteModal(true)} currentUser={currentUser} />}
              </main>
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
              {showWriteModal && <WriteModal setShowWriteModal={setShowWriteModal} handlePostSubmit={handlePostSubmit} currentUser={currentUser} activeTab={activeTab} />}
              {showUserInfoModal && currentUser && <UserInfoModal currentUser={currentUser} pointHistory={pointHistory} setShowUserInfoModal={setShowUserInfoModal} handleRedeemPoints={handleRedeemPoints} />}
              {showBirthdayPopup && currentUser && <BirthdayPopup currentUser={currentUser} handleBirthdayGrant={handleBirthdayGrant} setShowBirthdayPopup={setShowBirthdayPopup} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
// ... (상단 import 및 서브 컴포넌트 코드는 기존과 동일하게 유지) ...

// --- Main App Component (수정됨) ---
export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [feeds, setFeeds] = useState([]);
  const [pointHistory, setPointHistory] = useState([]);
  const [allPointHistory, setAllPointHistory] = useState([]);
  const [redemptionList, setRedemptionList] = useState([]); 
  const [loading, setLoading] = useState(false); // 로그인/가입 버튼 로딩
  const [isAuthLoading, setIsAuthLoading] = useState(true); // 초기 앱 진입 로딩

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
  
  // [1] 생일 체크 함수
  const checkBirthday = useCallback((user) => {
    if (!user.birthdate || user.birthday_granted) return; 
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const [_, m, d] = user.birthdate.split('-').map(Number);
    if (currentMonth === m) {
        setShowBirthdayPopup(true);
    }
  }, []);

  // [2] 관리자 알림 체크
  const checkAdminNotifications = async (user) => {
      if (user.role !== 'admin' || !supabase) return;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const hideDate = localStorage.getItem('hide_admin_alert');
      if (hideDate === todayStr) return;

      try {
          const { count, error } = await supabase.from('redemption_requests').select('*', { count: 'exact', head: true }); 
          if (!error && count > 0) setShowAdminAlertModal(true); 
      } catch (err) { console.error(err); }
  };

  const handleCloseAdminAlert = (doNotShowToday) => {
      if (doNotShowToday) {
          const todayStr = new Date().toISOString().split('T')[0];
          localStorage.setItem('hide_admin_alert', todayStr);
      }
      setShowAdminAlertModal(false);
  };

  // [3] 사용자 정보 가져오기
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
  }, [checkBirthday]);

  const fetchPointHistory = useCallback(async (userId) => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('point_history').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (data) setPointHistory(data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchAllPointHistory = useCallback(async () => {
      if (!supabase) return;
      try {
          const { data } = await supabase.from('point_history').select('user_id, amount, type, created_at');
          if (data) setAllPointHistory(data);
      } catch(err) { console.error(err); }
  }, []);

  // [4] 게시글 가져오기 (무한 루프 방지를 위해 currentUser 의존성 제거)
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
                    isLiked: false, // 초기값
                    comments: buildCommentTree(postComments), 
                    totalComments: postComments.length 
                };
            });
            
            // setFeeds 내부에서 currentUser 상태를 참조하여 isLiked 계산
            setFeeds(formatted);
        }
    } catch (err) { console.error(err); }
  }, []); // 의존성 배열 비움

  const fetchProfiles = useCallback(async () => {
    if (!supabase) return; 
    try {
        const { data } = await supabase.from('profiles').select('*');
        if (data) setProfiles(data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchRedemptionList = useCallback(async () => {
      if (!supabase) return;
      try {
          const { data } = await supabase.from('redemption_requests').select('*').order('created_at', { ascending: false });
          if(data) setRedemptionList(data);
      } catch (err) { console.error(err); }
  }, []);

  // [수정됨] useEffect 1: 초기 인증 및 데이터 로드 (단 1회 실행)
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
        try {
            if (!supabase) throw new Error("Supabase client not initialized");
            
            const { data: { session } } = await supabase.auth.getSession();
            if (mounted) {
                setSession(session);
                if (session) {
                    await fetchUserData(session.user.id);
                    await fetchPointHistory(session.user.id);
                }
            }
        } catch(err) {
            console.error("Auth init error:", err);
        } finally {
            if (mounted) setIsAuthLoading(false); // 로딩 종료 보장
        }
    };

    initAuth();
    
    // 초기 공통 데이터 로드
    fetchFeeds();
    fetchProfiles();
    fetchAllPointHistory();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (mounted) {
            setSession(session);
            if (session) {
                 await fetchUserData(session.user.id);
                 await fetchPointHistory(session.user.id);
            } else {
                setCurrentUser(null);
            }
            setIsAuthLoading(false);
        }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []); // 빈 배열: 마운트 시 1회만 실행

  // [수정됨] useEffect 2: 실시간 구독 (별도 분리)
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('public:comments_posts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => { fetchFeeds(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { fetchFeeds(); })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [fetchFeeds]);

  // [수정됨] useEffect 3: currentUser 변경 시 좋아요 상태 업데이트
  useEffect(() => {
      if (currentUser && feeds.length > 0) {
          setFeeds(prevFeeds => prevFeeds.map(f => ({
              ...f,
              isLiked: f.likes.includes(currentUser.id)
          })));
      }
  }, [currentUser?.id]); // currentUser.id가 바뀔 때만 실행

  const checkSupabaseConfig = () => {
    if (!supabase) return false;
    if (SUPABASE_URL.includes('your-project-url')) return false; 
    return true;
  };
  
  // ... (이벤트 핸들러 함수들은 기존과 동일, fetchFeeds 호출 등은 그대로 유지) ...
  // 지면 관계상 handleBirthdayGrant ~ handleNavigateToFeedWithFilter 함수들은 기존 코드를 그대로 사용합니다.
  // 아래에 handleBirthdayGrant 부터 다시 작성해드립니다.

  const handleBirthdayGrant = async () => {
    if (!currentUser || !checkSupabaseConfig()) return;
    try {
        const newPoints = (currentUser.points || 0) + 1000;
        await supabase.from('profiles').update({ points: newPoints, birthday_granted: true }).eq('id', currentUser.id);
        await supabase.from('point_history').insert({ user_id: currentUser.id, reason: '생일 축하 포인트', amount: 1000, type: 'earn' });
        setShowBirthdayPopup(false);
        fetchUserData(currentUser.id);
        fetchPointHistory(currentUser.id);
        fetchAllPointHistory(); 
    } catch (err) { console.error('오류 발생: ', err.message); }
  };

  const handleLikePost = async (postId, currentLikes, isLiked) => {
      if (!currentUser || !checkSupabaseConfig()) return;
      const userId = currentUser.id;
      let newLikes = [...currentLikes];

      if (isLiked) { newLikes = newLikes.filter(id => id !== userId); } 
      else { newLikes.push(userId); }
      
      setFeeds(prevFeeds => prevFeeds.map(f => f.id === postId ? { ...f, likes: newLikes, isLiked: !isLiked } : f));
      
      try { await supabase.from('posts').update({ likes: newLikes }).eq('id', postId); } 
      catch (err) { console.error(err); fetchFeeds(); }
  };

  const handleAddComment = async (e, postId, parentId = null) => {
      e.preventDefault();
      const content = e.target.commentContent.value;
      if (!content || !currentUser) return;
      
      try {
          await supabase.from('comments').insert({ 
              post_id: postId, author_id: currentUser.id, content: content, parent_id: parentId 
          });
          e.target.reset();
      } catch (err) { console.error('댓글 작성 실패: ', err.message); }
  };
  
  const handleDeleteComment = async (commentId) => {
      if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
      try {
          await supabase.from('comments').delete().eq('id', commentId);
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
            fetchAllPointHistory(); 
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
        fetchAllPointHistory(); 
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
        fetchAllPointHistory(); 
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
          fetchAllPointHistory(); 
      } catch(err) { console.error(err); }
  };

  const handleNavigateToFeedWithFilter = (type) => {
    setActiveTab('feed');
    setActiveFeedFilter(type);
  };

  if (isAuthLoading) {
      return (
          <div className="min-h-screen bg-blue-50 flex justify-center items-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
      );
  }

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
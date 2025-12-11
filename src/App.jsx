import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Heart, MessageCircle, Gift, Bell, Sparkles, Smile, Frown, Meh, Megaphone, X, Send, Settings, ChevronRight, LogOut, Image as ImageIcon, Coins, Pencil, Trash2, Loader2, Lock, Clock, Award, Wallet, Building2, CornerDownRight, Link as LinkIcon, MapPin, Search, Key, Edit3, ClipboardList, CheckSquare, ChevronLeft } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- [필수] Supabase 설정 ---
const SUPABASE_URL = 'https://clsvsqiikgnreqqvcrxj.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc3ZzcWlpa2ducmVxcXZjcnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzcyNjAsImV4cCI6MjA4MDk1MzI2MH0.lsaycyp6tXjLwb-qB5PIQ0OqKweTWO3WaxZG5GYOUqk';

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
                <p className="text-sm text-slate-600 mb-6 leading-relaxed"></p>
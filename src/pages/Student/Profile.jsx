// src/pages/Student/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Loading } from '../../components/Common';
import { useAuth } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { getTreeLevel } from '../../utils/helpers';
import { supabase } from '../../supabase';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // info, blog, password
  const [message, setMessage] = useState({ type: '', text: '' });

  // 블로그 URL 폼
  const [blogForm, setBlogForm] = useState({
    blog1: '',
    blog2: '',
    blog3: '',
  });

  // 비밀번호 폼
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setBlogForm({
        blog1: data.blog1 || '',
        blog2: data.blog2 || '',
        blog3: data.blog3 || '',
      });
    } catch (err) {
      console.error('프로필 로드 실패:', err);
      setMessage({ type: 'error', text: '프로필을 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBlog = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('students')
        .update({
          blog1: blogForm.blog1 || null,
          blog2: blogForm.blog2 || null,
          blog3: blogForm.blog3 || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: '블로그 URL이 저장되었습니다.' });
      fetchProfile();
    } catch (err) {
      console.error('블로그 저장 실패:', err);
      setMessage({ type: 'error', text: '저장에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage({ type: '', text: '' });

    // 유효성 검사
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '모든 필드를 입력해주세요.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      setMessage({ type: 'error', text: err.message || '비밀번호 변경에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!profile) {
    return (
      <div style={styles.container}>
        <p style={styles.errorText}>프로필을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const treeLevel = getTreeLevel(profile.post_count || 0);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>프로필</h1>

      {/* 프로필 카드 */}
      <div style={styles.profileCard}>
        <div style={styles.treeEmoji}>{treeLevel.emoji}</div>
        <div style={styles.profileInfo}>
          <span style={styles.profileName}>{profile.name}</span>
          <span style={styles.profileEmail}>{profile.email}</span>
          <span style={styles.treeLevel}>{treeLevel.name}</span>
        </div>
        <div style={styles.profileStats}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{profile.total_points || 0}</span>
            <span style={styles.statLabel}>포인트</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{profile.post_count || 0}</span>
            <span style={styles.statLabel}>포스팅</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statValue}>{profile.team || '-'}</span>
            <span style={styles.statLabel}>조</span>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            backgroundColor: activeTab === 'info' ? COLORS.primary : 'transparent',
            color: activeTab === 'info' ? '#000' : COLORS.text,
          }}
          onClick={() => { setActiveTab('info'); setMessage({ type: '', text: '' }); }}
        >
          내 정보
        </button>
        <button
          style={{
            ...styles.tab,
            backgroundColor: activeTab === 'blog' ? COLORS.primary : 'transparent',
            color: activeTab === 'blog' ? '#000' : COLORS.text,
          }}
          onClick={() => { setActiveTab('blog'); setMessage({ type: '', text: '' }); }}
        >
          블로그 설정
        </button>
        <button
          style={{
            ...styles.tab,
            backgroundColor: activeTab === 'password' ? COLORS.primary : 'transparent',
            color: activeTab === 'password' ? '#000' : COLORS.text,
          }}
          onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
        >
          비밀번호
        </button>
      </div>

      {/* 메시지 */}
      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
          color: message.type === 'success' ? COLORS.secondary : COLORS.error,
        }}>
          {message.text}
        </div>
      )}

      {/* 내 정보 탭 */}
      {activeTab === 'info' && (
        <div style={styles.section}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>이름</span>
            <span style={styles.infoValue}>{profile.name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>이메일</span>
            <span style={styles.infoValue}>{profile.email}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>전화번호</span>
            <span style={styles.infoValue}>{profile.phone || '-'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>조</span>
            <span style={styles.infoValue}>{profile.team || '미배정'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>역할</span>
            <span style={styles.infoValue}>
              {profile.is_leader ? '조장' : '조원'}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>기수</span>
            <span style={styles.infoValue}>{profile.batch || '-'}기</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>가입일</span>
            <span style={styles.infoValue}>
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>연속 출석</span>
            <span style={styles.infoValue}>{profile.streak || 0}일</span>
          </div>
        </div>
      )}

      {/* 블로그 설정 탭 */}
      {activeTab === 'blog' && (
        <div style={styles.section}>
          <p style={styles.sectionDesc}>
            블로그 URL을 등록하면 포스팅 현황을 자동으로 추적합니다.
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>블로그 1</label>
            <input
              type="url"
              value={blogForm.blog1}
              onChange={(e) => setBlogForm({ ...blogForm, blog1: e.target.value })}
              placeholder="https://blog.naver.com/..."
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>블로그 2</label>
            <input
              type="url"
              value={blogForm.blog2}
              onChange={(e) => setBlogForm({ ...blogForm, blog2: e.target.value })}
              placeholder="https://blog.naver.com/..."
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>블로그 3</label>
            <input
              type="url"
              value={blogForm.blog3}
              onChange={(e) => setBlogForm({ ...blogForm, blog3: e.target.value })}
              placeholder="https://blog.naver.com/..."
              style={styles.input}
            />
          </div>

          <button
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
            }}
            onClick={handleSaveBlog}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}

      {/* 비밀번호 변경 탭 */}
      {activeTab === 'password' && (
        <div style={styles.section}>
          <div style={styles.formGroup}>
            <label style={styles.label}>현재 비밀번호</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="현재 비밀번호"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>새 비밀번호</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="6자 이상"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>새 비밀번호 확인</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              placeholder="새 비밀번호 확인"
              style={styles.input}
            />
          </div>

          <button
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.6 : 1,
            }}
            onClick={handleChangePassword}
            disabled={saving}
          >
            {saving ? '변경 중...' : '비밀번호 변경'}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    paddingBottom: '100px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 20px 0',
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  treeEmoji: {
    fontSize: '64px',
    marginBottom: '12px',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '20px',
  },
  profileName: {
    color: COLORS.text,
    fontSize: '22px',
    fontWeight: 'bold',
  },
  profileEmail: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  treeLevel: {
    color: COLORS.primary,
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '4px',
  },
  profileStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    color: COLORS.primary,
    fontSize: '20px',
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: '12px',
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '12px 8px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '20px',
  },
  sectionDesc: {
    color: COLORS.textMuted,
    fontSize: '13px',
    margin: '0 0 16px 0',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: `1px solid ${COLORS.surfaceLight}`,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: '500',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    color: COLORS.textMuted,
    fontSize: '13px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  saveButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: COLORS.primary,
    border: 'none',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    padding: '40px',
  },
};

export default Profile;

// src/pages/Admin/InstructorManage.jsx
// 강사소개 관리 페이지

import { useState, useEffect } from 'react';
import { Card, Loading, Button } from '../../components/Common';
import { COLORS } from '../../utils/constants';
import { supabase } from '../../supabase';

const InstructorManage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructor, setInstructor] = useState({
    name: '',
    title: '',
    photo_url: '',
    introduction: '',
    career: [],
    sns: {
      blog: '',
      instagram: '',
      youtube: '',
      kakao: '',
    },
    contact: '',
  });
  const [newCareer, setNewCareer] = useState('');

  useEffect(() => {
    loadInstructor();
  }, []);

  const loadInstructor = async () => {
    try {
      const { data, error } = await supabase
        .from('instructor')
        .select('*')
        .single();

      if (data) {
        setInstructor({
          ...data,
          career: data.career || [],
          sns: data.sns || { blog: '', instagram: '', youtube: '', kakao: '' },
        });
      }
    } catch (err) {
      console.error('강사 정보 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 기존 데이터 확인
      const { data: existing } = await supabase
        .from('instructor')
        .select('id')
        .single();

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('instructor')
          .update({
            name: instructor.name,
            title: instructor.title,
            photo_url: instructor.photo_url || null,
            introduction: instructor.introduction,
            career: instructor.career,
            sns: instructor.sns,
            contact: instructor.contact,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // 새로 생성
        const { error } = await supabase
          .from('instructor')
          .insert([{
            name: instructor.name,
            title: instructor.title,
            photo_url: instructor.photo_url || null,
            introduction: instructor.introduction,
            career: instructor.career,
            sns: instructor.sns,
            contact: instructor.contact,
          }]);

        if (error) throw error;
      }

      alert('저장되었습니다.');
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const addCareer = () => {
    if (!newCareer.trim()) return;
    setInstructor(prev => ({
      ...prev,
      career: [...prev.career, newCareer.trim()],
    }));
    setNewCareer('');
  };

  const removeCareer = (index) => {
    setInstructor(prev => ({
      ...prev,
      career: prev.career.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>강사소개 관리</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card title="기본 정보">
        <div style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>이름 *</label>
              <input
                type="text"
                value={instructor.name}
                onChange={(e) => setInstructor(prev => ({ ...prev, name: e.target.value }))}
                style={styles.input}
                placeholder="강사명"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>타이틀</label>
              <input
                type="text"
                value={instructor.title}
                onChange={(e) => setInstructor(prev => ({ ...prev, title: e.target.value }))}
                style={styles.input}
                placeholder="예: 블로그 마스터 클래스 강사"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>프로필 사진 URL</label>
            <input
              type="url"
              value={instructor.photo_url}
              onChange={(e) => setInstructor(prev => ({ ...prev, photo_url: e.target.value }))}
              style={styles.input}
              placeholder="https://..."
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>소개</label>
            <textarea
              value={instructor.introduction}
              onChange={(e) => setInstructor(prev => ({ ...prev, introduction: e.target.value }))}
              style={styles.textarea}
              rows={5}
              placeholder="강사 소개 내용"
            />
          </div>
        </div>
      </Card>

      {/* 경력 */}
      <Card title="경력">
        <div style={styles.careerList}>
          {instructor.career.map((item, index) => (
            <div key={index} style={styles.careerItem}>
              <span style={styles.careerText}>{item}</span>
              <button
                style={styles.removeButton}
                onClick={() => removeCareer(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div style={styles.addCareerRow}>
          <input
            type="text"
            value={newCareer}
            onChange={(e) => setNewCareer(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
            placeholder="경력 항목 입력"
            onKeyDown={(e) => e.key === 'Enter' && addCareer()}
          />
          <Button onClick={addCareer} variant="secondary">추가</Button>
        </div>
      </Card>

      {/* SNS */}
      <Card title="SNS 링크">
        <div style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>블로그</label>
            <input
              type="url"
              value={instructor.sns.blog}
              onChange={(e) => setInstructor(prev => ({
                ...prev,
                sns: { ...prev.sns, blog: e.target.value },
              }))}
              style={styles.input}
              placeholder="https://blog.naver.com/..."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>인스타그램</label>
            <input
              type="url"
              value={instructor.sns.instagram}
              onChange={(e) => setInstructor(prev => ({
                ...prev,
                sns: { ...prev.sns, instagram: e.target.value },
              }))}
              style={styles.input}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>유튜브</label>
            <input
              type="url"
              value={instructor.sns.youtube}
              onChange={(e) => setInstructor(prev => ({
                ...prev,
                sns: { ...prev.sns, youtube: e.target.value },
              }))}
              style={styles.input}
              placeholder="https://youtube.com/..."
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>카카오톡 오픈채팅</label>
            <input
              type="url"
              value={instructor.sns.kakao}
              onChange={(e) => setInstructor(prev => ({
                ...prev,
                sns: { ...prev.sns, kakao: e.target.value },
              }))}
              style={styles.input}
              placeholder="https://open.kakao.com/..."
            />
          </div>
        </div>
      </Card>

      {/* 연락처 */}
      <Card title="문의 안내">
        <div style={styles.formGroup}>
          <textarea
            value={instructor.contact}
            onChange={(e) => setInstructor(prev => ({ ...prev, contact: e.target.value }))}
            style={styles.textarea}
            rows={3}
            placeholder="문의 관련 안내 문구"
          />
        </div>
      </Card>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  input: {
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
  },
  textarea: {
    padding: '12px 14px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  careerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  careerItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
  },
  careerText: {
    color: COLORS.text,
    fontSize: '14px',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: COLORS.error,
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  addCareerRow: {
    display: 'flex',
    gap: '12px',
  },
};

export default InstructorManage;

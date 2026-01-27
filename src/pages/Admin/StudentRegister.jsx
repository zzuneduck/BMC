// src/pages/Admin/StudentRegister.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { isValidPhone, isValidUrl } from '../../utils/helpers';

const StudentRegister = () => {
  const navigate = useNavigate();
  const { createStudent, checkNameExists } = useStudents();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    blog1: '',
    blog2: '',
    blog3: '',
    class_type: '온라인',
    post_count: '',
    team: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('휴대폰 번호를 입력해주세요.');
      return false;
    }
    if (!isValidPhone(formData.phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return false;
    }
    if (!formData.password) {
      setError('비밀번호를 입력해주세요.');
      return false;
    }
    if (!formData.blog1.trim()) {
      setError('블로그 주소를 입력해주세요.');
      return false;
    }
    if (!isValidUrl(formData.blog1)) {
      setError('올바른 블로그 URL을 입력해주세요.');
      return false;
    }
    if (!formData.post_count) {
      setError('초기 포스팅 개수를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // 이름 중복 체크
      const nameCheck = await checkNameExists(formData.name.trim());
      if (nameCheck.exists) {
        setError('이미 등록된 이름입니다.');
        setLoading(false);
        return;
      }

      // 수강생 등록
      const postCount = parseInt(formData.post_count, 10);
      const result = await createStudent({
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        password: formData.password,
        blog1: formData.blog1.trim(),
        blog2: formData.blog2.trim() || null,
        blog3: formData.blog3.trim() || null,
        class_type: formData.class_type,
        post_count: postCount,
        tree_level: postCount >= 50 ? 5 : postCount >= 30 ? 4 : postCount >= 15 ? 3 : postCount >= 5 ? 2 : 1,
        team: formData.team.trim() || null,
        total_points: 0,
      });

      if (!result.success) {
        setError(result.error || '등록 중 오류가 발생했습니다.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      phone: '',
      password: '',
      blog1: '',
      blog2: '',
      blog3: '',
      class_type: '온라인',
      post_count: '',
      team: '',
    });
    setSuccess(false);
    setError('');
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successBox}>
          <span style={styles.successEmoji}>✅</span>
          <h2 style={styles.successTitle}>수강생 등록 완료!</h2>
          <p style={styles.successText}>
            <span style={styles.highlight}>{formData.name}</span>님이 등록되었습니다.
          </p>
          <div style={styles.buttonRow}>
            <button onClick={handleReset} style={styles.primaryBtn}>
              추가 등록
            </button>
            <button onClick={() => navigate('/admin/students')} style={styles.secondaryBtn}>
              목록 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>수강생 등록</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>기본 정보</h3>

          <div style={styles.inputGroup}>
            <label style={styles.label}>이름 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="실명 입력"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>휴대폰 번호 *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="01012345678"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>비밀번호 *</label>
            <input
              type="text"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="초기 비밀번호"
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>수업유형 *</label>
              <select
                name="class_type"
                value={formData.class_type}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="온라인">온라인</option>
                <option value="오프라인">오프라인</option>
              </select>
            </div>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>조</label>
              <input
                type="text"
                name="team"
                value={formData.team}
                onChange={handleChange}
                placeholder="예: A조"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>블로그 정보</h3>

          <div style={styles.inputGroup}>
            <label style={styles.label}>블로그 주소 *</label>
            <input
              type="url"
              name="blog1"
              value={formData.blog1}
              onChange={handleChange}
              placeholder="https://blog.naver.com/..."
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>블로그 주소 2</label>
            <input
              type="url"
              name="blog2"
              value={formData.blog2}
              onChange={handleChange}
              placeholder="선택 사항"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>블로그 주소 3</label>
            <input
              type="url"
              name="blog3"
              value={formData.blog3}
              onChange={handleChange}
              placeholder="선택 사항"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>현재 포스팅 개수 *</label>
            <input
              type="number"
              name="post_count"
              value={formData.post_count}
              onChange={handleChange}
              placeholder="0"
              min="0"
              style={styles.input}
            />
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          style={{
            ...styles.submitBtn,
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          {loading ? '등록 중...' : '수강생 등록'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 24px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '20px',
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: '16px',
    margin: '0 0 16px 0',
  },
  inputGroup: {
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
    padding: '12px 16px',
    backgroundColor: COLORS.surfaceLight,
    border: 'none',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '15px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  error: {
    color: COLORS.error,
    fontSize: '14px',
    textAlign: 'center',
    margin: 0,
  },
  submitBtn: {
    padding: '16px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  successBox: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  successEmoji: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '16px',
  },
  successTitle: {
    color: COLORS.text,
    fontSize: '24px',
    margin: '0 0 8px 0',
  },
  successText: {
    color: COLORS.textMuted,
    fontSize: '16px',
    marginBottom: '32px',
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  primaryBtn: {
    padding: '14px 28px',
    backgroundColor: COLORS.primary,
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '14px 28px',
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    cursor: 'pointer',
  },
};

export default StudentRegister;

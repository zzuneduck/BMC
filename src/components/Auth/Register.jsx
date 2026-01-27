// src/components/Auth/Register.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { COLORS } from '../../utils/constants';
import { isValidPhone, getTreeLevel } from '../../utils/helpers';

// 블로그 URL 정규화 (https:// 자동 추가)
const normalizeUrl = (url) => {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

// 간단한 블로그 주소 유효성 검사
const isValidBlogUrl = (url) => {
  if (!url || !url.trim()) return false;
  // blog.naver.com/아이디 형태인지 체크
  return url.includes('.');
};

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    blog_url_1: '',
    blog_url_2: '',
    blog_url_3: '',
    class_type: '온라인',
    initial_posts: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // 1단계 유효성 검사
  const validateStep1 = () => {
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
    if (formData.password.length < 4) {
      setError('비밀번호는 4자 이상이어야 합니다.');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    return true;
  };

  // 2단계 유효성 검사
  const validateStep2 = () => {
    if (!formData.blog_url_1.trim()) {
      setError('블로그 주소를 입력해주세요.');
      return false;
    }
    if (!isValidBlogUrl(formData.blog_url_1)) {
      setError('올바른 블로그 주소를 입력해주세요. (예: blog.naver.com/아이디)');
      return false;
    }
    if (formData.blog_url_2 && !isValidBlogUrl(formData.blog_url_2)) {
      setError('블로그 주소 2가 올바르지 않습니다.');
      return false;
    }
    if (formData.blog_url_3 && !isValidBlogUrl(formData.blog_url_3)) {
      setError('블로그 주소 3이 올바르지 않습니다.');
      return false;
    }
    if (!formData.initial_posts) {
      setError('현재 포스팅 개수를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      setError('');
    }
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      // 1. 이름 중복 체크
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('name', formData.name.trim())
        .single();

      if (existing) {
        setError('이미 등록된 이름입니다.');
        setLoading(false);
        return;
      }

      // 2. students 테이블에 INSERT
      const blogUrl1 = normalizeUrl(formData.blog_url_1);
      const blogUrl2 = formData.blog_url_2.trim() ? normalizeUrl(formData.blog_url_2) : null;
      const blogUrl3 = formData.blog_url_3.trim() ? normalizeUrl(formData.blog_url_3) : null;
      const postCount = parseInt(formData.initial_posts, 10) || 0;
      const treeLevel = getTreeLevel(postCount);

      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert([{
          name: formData.name.trim(),
          phone: formData.phone.replace(/\D/g, ''),
          password: formData.password,
          blog1: blogUrl1,
          blog2: blogUrl2,
          blog3: blogUrl3,
          class_type: formData.class_type,
          post_count: postCount,
          tree_level: treeLevel.level,
        }])
        .select()
        .single();

      if (studentError) {
        console.error('Student insert error:', studentError);
        setError('회원가입 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      setShowComplete(true);
    } catch (err) {
      console.error('Register error:', err);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 완료 화면
  if (showComplete) {
    return (
      <div style={styles.container}>
        <div style={styles.completeBox}>
          <div style={styles.completeEmoji}>🎉</div>
          <h1 style={styles.completeTitle}>회원가입 완료!</h1>
          <p style={styles.completeText}>
            <span style={styles.highlight}>{formData.name}</span>님,<br />
            블로그 마스터 클래스에<br />
            오신 것을 환영합니다!
          </p>
          <button
            onClick={() => navigate('/login')}
            style={styles.button}
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.registerBox}>
        {/* 로고 */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>BMC</div>
        </div>

        <h1 style={styles.title}>회원가입</h1>

        {/* 프로그레스 */}
        <div style={styles.progress}>
          <div style={styles.progressStep}>
            <div style={{
              ...styles.progressDot,
              backgroundColor: COLORS.primary,
            }}>1</div>
            <span style={{
              ...styles.progressLabel,
              color: step === 1 ? COLORS.primary : COLORS.textMuted,
            }}>기본 정보</span>
          </div>
          <div style={styles.progressLine}>
            <div style={{
              ...styles.progressLineFill,
              width: step === 2 ? '100%' : '0%',
            }} />
          </div>
          <div style={styles.progressStep}>
            <div style={{
              ...styles.progressDot,
              backgroundColor: step === 2 ? COLORS.primary : COLORS.surface,
              color: step === 2 ? COLORS.background : COLORS.textMuted,
            }}>2</div>
            <span style={{
              ...styles.progressLabel,
              color: step === 2 ? COLORS.primary : COLORS.textMuted,
            }}>블로그 정보</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* 1단계: 기본 정보 */}
          {step === 1 && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>이름 *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="실명을 입력하세요"
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
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="4자 이상"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>비밀번호 확인 *</label>
                <input
                  type="password"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  style={styles.input}
                />
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <button
                type="button"
                onClick={handleNext}
                style={styles.button}
              >
                다음
              </button>
            </>
          )}

          {/* 2단계: 블로그 정보 */}
          {step === 2 && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>블로그 주소 1 * (필수)</label>
                <div style={styles.urlInputWrapper}>
                  <span style={styles.urlPrefix}>https://</span>
                  <input
                    type="text"
                    name="blog_url_1"
                    value={formData.blog_url_1}
                    onChange={handleChange}
                    placeholder="blog.naver.com/아이디"
                    style={styles.urlInput}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>블로그 주소 2 (선택)</label>
                <div style={styles.urlInputWrapper}>
                  <span style={styles.urlPrefix}>https://</span>
                  <input
                    type="text"
                    name="blog_url_2"
                    value={formData.blog_url_2}
                    onChange={handleChange}
                    placeholder="blog.naver.com/아이디"
                    style={styles.urlInput}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>블로그 주소 3 (선택)</label>
                <div style={styles.urlInputWrapper}>
                  <span style={styles.urlPrefix}>https://</span>
                  <input
                    type="text"
                    name="blog_url_3"
                    value={formData.blog_url_3}
                    onChange={handleChange}
                    placeholder="blog.naver.com/아이디"
                    style={styles.urlInput}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>수업 유형 *</label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="class_type"
                      value="온라인"
                      checked={formData.class_type === '온라인'}
                      onChange={handleChange}
                      style={styles.radio}
                    />
                    <span style={styles.radioText}>온라인</span>
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="class_type"
                      value="오프라인"
                      checked={formData.class_type === '오프라인'}
                      onChange={handleChange}
                      style={styles.radio}
                    />
                    <span style={styles.radioText}>오프라인</span>
                  </label>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>현재 포스팅 개수 *</label>
                <input
                  type="number"
                  name="initial_posts"
                  value={formData.initial_posts}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  style={styles.input}
                />
              </div>

              {error && <p style={styles.error}>{error}</p>}

              <div style={styles.buttonRow}>
                <button
                  type="button"
                  onClick={handleBack}
                  style={styles.backButton}
                >
                  이전
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.button,
                    flex: 1,
                    opacity: loading ? 0.7 : 1,
                  }}
                  disabled={loading}
                >
                  {loading ? '가입 중...' : '회원가입'}
                </button>
              </div>
            </>
          )}
        </form>

        {/* 로그인 링크 */}
        <div style={styles.links}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={styles.linkHighlight}>
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: COLORS.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  registerBox: {
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  logoContainer: {
    marginBottom: '16px',
  },
  logo: {
    display: 'inline-block',
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '10px 20px',
    borderRadius: '6px',
    letterSpacing: '3px',
  },
  title: {
    color: COLORS.text,
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 24px 0',
  },
  progress: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
    gap: '8px',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  progressDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: COLORS.background,
  },
  progressLabel: {
    fontSize: '12px',
  },
  progressLine: {
    width: '60px',
    height: '3px',
    backgroundColor: COLORS.surface,
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    transition: 'width 0.3s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    color: COLORS.textMuted,
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    backgroundColor: COLORS.surface,
    border: '1px solid transparent',
    borderRadius: '8px',
    color: COLORS.text,
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  urlInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  urlPrefix: {
    padding: '14px 0 14px 16px',
    color: COLORS.textMuted,
    fontSize: '16px',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  urlInput: {
    flex: 1,
    padding: '14px 16px 14px 0',
    backgroundColor: 'transparent',
    border: 'none',
    color: COLORS.text,
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  radioGroup: {
    display: 'flex',
    gap: '20px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  radio: {
    marginRight: '8px',
    accentColor: COLORS.primary,
  },
  radioText: {
    color: COLORS.text,
    fontSize: '16px',
  },
  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
  },
  backButton: {
    padding: '16px 24px',
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
  },
  error: {
    color: COLORS.error,
    fontSize: '14px',
    margin: '0',
    textAlign: 'center',
  },
  links: {
    marginTop: '24px',
    color: COLORS.textMuted,
    fontSize: '14px',
  },
  linkHighlight: {
    color: COLORS.primary,
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  completeBox: {
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    padding: '40px 20px',
  },
  completeEmoji: {
    fontSize: '80px',
    marginBottom: '24px',
  },
  completeTitle: {
    color: COLORS.primary,
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 16px 0',
  },
  completeText: {
    color: COLORS.text,
    fontSize: '18px',
    lineHeight: 1.6,
    marginBottom: '32px',
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
};

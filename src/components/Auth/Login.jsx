// src/components/Auth/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { COLORS } from '../../utils/constants';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { name, password } = formData;

    try {
      const result = await login(name, password);

      if (result.success) {
        // 관리자면 /admin, 수강생이면 /student로 이동
        navigate(result.user.isAdmin ? '/admin' : '/student');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        {/* 로고 */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>BMC</div>
        </div>

        {/* 제목 */}
        <h1 style={styles.title}>블로그 마스터 클래스</h1>
        <p style={styles.subtitle}>평생 관리반 1기</p>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>아이디 (이름)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              style={styles.input}
              required
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 링크 */}
        <div style={styles.links}>
          <Link to="/forgot-password" style={styles.link}>
            비밀번호를 잊으셨나요?
          </Link>
          <div style={styles.registerLink}>
            아직 계정이 없으신가요?{' '}
            <Link to="/register" style={styles.linkHighlight}>
              회원가입
            </Link>
          </div>
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
  loginBox: {
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  logoContainer: {
    marginBottom: '24px',
  },
  logo: {
    display: 'inline-block',
    backgroundColor: COLORS.primary,
    color: COLORS.background,
    fontSize: '32px',
    fontWeight: 'bold',
    padding: '16px 32px',
    borderRadius: '8px',
    letterSpacing: '4px',
  },
  title: {
    color: COLORS.text,
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: COLORS.primary,
    fontSize: '18px',
    margin: '0 0 40px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
    transition: 'border-color 0.2s',
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
    transition: 'opacity 0.2s',
  },
  error: {
    color: COLORS.error,
    fontSize: '14px',
    margin: '0',
    textAlign: 'center',
  },
  links: {
    marginTop: '30px',
  },
  link: {
    color: COLORS.textMuted,
    fontSize: '14px',
    textDecoration: 'none',
  },
  registerLink: {
    color: COLORS.textMuted,
    fontSize: '14px',
    marginTop: '16px',
  },
  linkHighlight: {
    color: COLORS.primary,
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

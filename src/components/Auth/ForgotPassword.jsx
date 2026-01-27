// src/components/Auth/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudents } from '../../hooks';
import { COLORS } from '../../utils/constants';
import { isValidPhone } from '../../utils/helpers';

export default function ForgotPassword() {
  const { findPassword } = useStudents();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const { name, phone } = formData;

    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (!phone.trim()) {
      setError('휴대폰 번호를 입력해주세요.');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = phone.replace(/\D/g, '');
      const response = await findPassword(name.trim(), cleanedPhone);

      if (!response.success) {
        setError(response.error);
        return;
      }

      setResult({
        name: response.data.name,
        password: response.data.password,
      });
    } catch {
      setError('조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        {/* 로고 */}
        <div style={styles.logoContainer}>
          <div style={styles.logo}>BMC</div>
        </div>

        <h1 style={styles.title}>비밀번호 찾기</h1>
        <p style={styles.subtitle}>
          가입 시 등록한 이름과 휴대폰 번호를<br />
          입력해주세요.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>이름</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                style={styles.input}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>휴대폰 번호</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01012345678"
                style={styles.input}
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
              {loading ? '조회 중...' : '비밀번호 찾기'}
            </button>
          </form>
        ) : (
          <div style={styles.resultBox}>
            <div style={styles.resultIcon}>🔐</div>
            <p style={styles.resultText}>
              <span style={styles.highlight}>{result.name}</span>님의<br />
              비밀번호를 찾았습니다.
            </p>
            <div style={styles.passwordBox}>
              <span style={styles.passwordLabel}>비밀번호</span>
              <span style={styles.password}>{result.password}</span>
            </div>
            <p style={styles.warning}>
              보안을 위해 로그인 후<br />
              비밀번호를 변경해주세요.
            </p>
            <Link to="/login" style={styles.button}>
              로그인하러 가기
            </Link>
          </div>
        )}

        {/* 링크 */}
        <div style={styles.links}>
          <Link to="/login" style={styles.link}>
            로그인으로 돌아가기
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
  box: {
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
    margin: '0 0 12px 0',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: '14px',
    margin: '0 0 32px 0',
    lineHeight: 1.5,
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
  },
  button: {
    display: 'block',
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
    textDecoration: 'none',
    textAlign: 'center',
    boxSizing: 'border-box',
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
  resultBox: {
    backgroundColor: COLORS.surface,
    borderRadius: '12px',
    padding: '32px 24px',
  },
  resultIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  resultText: {
    color: COLORS.text,
    fontSize: '16px',
    lineHeight: 1.5,
    margin: '0 0 24px 0',
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  passwordBox: {
    backgroundColor: COLORS.background,
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  passwordLabel: {
    display: 'block',
    color: COLORS.textMuted,
    fontSize: '12px',
    marginBottom: '8px',
  },
  password: {
    color: COLORS.primary,
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '2px',
  },
  warning: {
    color: COLORS.textMuted,
    fontSize: '13px',
    lineHeight: 1.5,
    margin: '0 0 20px 0',
  },
};

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './EditProfile.module.css';

const genderOptions = ['男', '女', '保密'];

const identityOptions = ['学生', '老师', '职工'];

const provinces = [
  '北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '湖南',
  '河南', '河北', '山东', '福建', '安徽', '重庆', '天津', '陕西',
  '辽宁', '江西', '广西', '云南', '贵州', '山西', '黑龙江', '吉林',
  '甘肃', '内蒙古', '新疆', '海南', '宁夏', '青海', '西藏',
];

function ListPicker({ title, options, selected, onSelect, onClose }) {
  return (
    <div className={styles.pickerOverlay}>
      <div className={styles.pickerBackdrop} onClick={onClose} />
      <div className={styles.pickerContainer}>
        <div className={styles.pickerHeader}>
          <button className={styles.pickerCancel} onClick={onClose}>取消</button>
          <span className={styles.pickerTitle}>{title}</span>
          <button className={styles.pickerConfirm} onClick={onClose}>确定</button>
        </div>
        <div className={styles.pickerBody}>
          {options.map((opt) => (
            <button
              key={opt}
              className={`${styles.pickerOption} ${selected === opt ? styles.selected : ''}`}
              onClick={() => { onSelect(opt); onClose(); }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BirthdayPicker({ value, onSelect, onClose }) {
  const [step, setStep] = useState('year');
  const currentYear = new Date().getFullYear();

  const parsed = value ? value.split('-') : [];
  const [year, setYear] = useState(parsed[0] ? parseInt(parsed[0]) : null);
  const [month, setMonth] = useState(parsed[1] ? parseInt(parsed[1]) : null);

  const years = [];
  for (let y = currentYear; y >= 1940; y--) years.push(y);

  const months = [];
  for (let m = 1; m <= 12; m++) months.push(m);

  const daysInMonth = year && month ? new Date(year, month, 0).getDate() : 31;
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const stepTitle = step === 'year' ? '选择年份' : step === 'month' ? '选择月份' : '选择日期';

  const handleYear = (y) => {
    setYear(y);
    setMonth(null);
    setStep('month');
  };

  const handleMonth = (m) => {
    setMonth(m);
    setStep('day');
  };

  const handleDay = (d) => {
    const mm = String(month).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onSelect(`${year}-${mm}-${dd}`);
    onClose();
  };

  const stepOptions = step === 'year' ? years : step === 'month' ? months : days;
  const stepLabel = step === 'year' ? '年' : step === 'month' ? '月' : '日';

  return (
    <div className={styles.pickerOverlay}>
      <div className={styles.pickerBackdrop} onClick={onClose} />
      <div className={styles.pickerContainer}>
        <div className={styles.pickerHeader}>
          <button className={styles.pickerCancel} onClick={onClose}>取消</button>
          <span className={styles.pickerTitle}>{stepTitle}</span>
          <button className={styles.pickerConfirm} onClick={onClose}>确定</button>
        </div>
        {year && month && step === 'day' && (
          <div className={styles.dateBreadcrumb}>
            <button className={styles.crumb} onClick={() => { setStep('year'); setMonth(null); }}>{year}年</button>
            <button className={styles.crumb} onClick={() => setStep('month')}>{month}月</button>
          </div>
        )}
        {year && step === 'month' && (
          <div className={styles.dateBreadcrumb}>
            <button className={styles.crumb} onClick={() => setStep('year')}>{year}年</button>
          </div>
        )}
        <div className={styles.pickerBody}>
          {stepOptions.map((opt) => (
            <button
              key={opt}
              className={`${styles.pickerOption} ${step === 'year' && year === opt ? styles.selected : ''} ${step === 'month' && month === opt ? styles.selected : ''}`}
              onClick={() => step === 'year' ? handleYear(opt) : step === 'month' ? handleMonth(opt) : handleDay(opt)}
            >
              {opt}{stepLabel}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditProfilePage() {
  const navigate = useNavigate();
  const { profile: savedProfile, updateProfile } = useAuth();
  const [toast, setToast] = useState('');
  const [picker, setPicker] = useState(null);

  const [localProfile, setLocalProfile] = useState(() => ({ ...savedProfile }));

  const handleChange = useCallback((key, value) => {
    setLocalProfile(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    updateProfile(localProfile);
    setToast('保存成功');
    setTimeout(() => {
      setToast('');
      navigate('/?tab=mine', { replace: true });
    }, 1200);
  };

  const openPicker = useCallback((type) => setPicker(type), []);
  const closePicker = useCallback(() => setPicker(null), []);

  const initial = localProfile.nickname ? localProfile.nickname.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.page}>
      <div className={styles.phoneFrame}>
        <div className={styles.navBar}>
          <div className={styles.navLeft}>
            <button className={styles.backBtn} onClick={() => navigate('/?tab=mine', { replace: true })}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>
          <span className={styles.navTitle}>编辑个人资料</span>
          <div className={styles.navRight}>
            <button className={styles.saveBtn} onClick={handleSave}>保存</button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.avatarSection}>
            <span className={styles.avatarLabel}>头像</span>
            <button className={styles.avatarBtn}>{initial}</button>
          </div>

          <div className={styles.fieldList}>
            <div className={styles.fieldItem}>
              <span className={styles.fieldLabel}>昵称</span>
              <input
                className={styles.fieldInput}
                value={localProfile.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                placeholder="请输入昵称"
              />
            </div>

            <div className={styles.fieldItem} onClick={() => openPicker('identity')}>
              <span className={styles.fieldLabel}>校园身份</span>
              <span className={`${styles.fieldValue} ${localProfile.identity ? styles.hasValue : ''}`}>
                {localProfile.identity || '请选择'}
              </span>
              <span className={styles.fieldArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>

            <div className={styles.fieldItem} onClick={() => openPicker('gender')}>
              <span className={styles.fieldLabel}>性别</span>
              <span className={`${styles.fieldValue} ${localProfile.gender ? styles.hasValue : ''}`}>
                {localProfile.gender || '请选择'}
              </span>
              <span className={styles.fieldArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>

            <div className={styles.fieldItem} onClick={() => openPicker('birthday')}>
              <span className={styles.fieldLabel}>生日</span>
              <span className={`${styles.fieldValue} ${localProfile.birthday ? styles.hasValue : ''}`}>
                {localProfile.birthday || '请选择'}
              </span>
              <span className={styles.fieldArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>

            <div className={styles.fieldItem} onClick={() => openPicker('location')}>
              <span className={styles.fieldLabel}>所在地</span>
              <span className={`${styles.fieldValue} ${localProfile.location ? styles.hasValue : ''}`}>
                {localProfile.location || '请选择'}
              </span>
              <span className={styles.fieldArrow}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </div>
          </div>

          <div className={styles.bioSection}>
            <span className={styles.bioLabel}>个性简介</span>
            <textarea
              className={styles.bioTextarea}
              value={localProfile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="介绍一下自己吧"
              maxLength={25}
            />
          </div>
          <p className={styles.hint}>{localProfile.bio.length}/25</p>
        </div>

        {picker === 'identity' && (
          <ListPicker
            title="选择校园身份"
            options={identityOptions}
            selected={localProfile.identity}
            onSelect={(v) => handleChange('identity', v)}
            onClose={closePicker}
          />
        )}

        {picker === 'gender' && (
          <ListPicker
            title="选择性别"
            options={genderOptions}
            selected={localProfile.gender}
            onSelect={(v) => handleChange('gender', v)}
            onClose={closePicker}
          />
        )}

        {picker === 'birthday' && (
          <BirthdayPicker
            value={localProfile.birthday}
            onSelect={(v) => handleChange('birthday', v)}
            onClose={closePicker}
          />
        )}

        {picker === 'location' && (
          <ListPicker
            title="选择所在地"
            options={provinces}
            selected={localProfile.location}
            onSelect={(v) => handleChange('location', v)}
            onClose={closePicker}
          />
        )}

        {toast && <div className={styles.toast}>{toast}</div>}
      </div>
    </div>
  );
}

export default EditProfilePage;

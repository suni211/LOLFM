import React, { useState } from 'react';
import axios from 'axios';
import './LogoUpload.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function LogoUpload({ team, onLogoUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 확인 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 확인
    if (!file.type.match('image.*')) {
      setError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleUpload = async () => {
    const fileInput = document.getElementById('logo-input');
    const file = fileInput.files[0];
    
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await axios.post(
        `${API_URL}/teams/${team.id}/logo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        if (onLogoUpdate) {
          onLogoUpdate(response.data.logoPath);
        }
        setPreview(null);
        fileInput.value = '';
        alert('로고가 업로드되었습니다.');
      }
    } catch (error) {
      console.error('로고 업로드 오류:', error);
      setError(error.response?.data?.error || '로고 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('로고를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/teams/${team.id}/logo`,
        { withCredentials: true }
      );

      if (response.data.success) {
        if (onLogoUpdate) {
          onLogoUpdate(null);
        }
        setPreview(null);
        alert('로고가 삭제되었습니다.');
      }
    } catch (error) {
      console.error('로고 삭제 오류:', error);
      setError(error.response?.data?.error || '로고 삭제에 실패했습니다.');
    }
  };

  const logoUrl = team.logo_path 
    ? `${API_URL.replace('/api', '')}${team.logo_path}`
    : null;

  return (
    <div className="logo-upload">
      <h3>팀 로고</h3>
      
      <div className="logo-preview-container">
        {preview ? (
          <img src={preview} alt="로고 미리보기" className="logo-preview" />
        ) : logoUrl ? (
          <img src={logoUrl} alt="팀 로고" className="logo-preview" />
        ) : (
          <div className="logo-placeholder">
            <span>로고 없음</span>
          </div>
        )}
      </div>

      <div className="logo-upload-controls">
        <label htmlFor="logo-input" className="file-input-label">
          파일 선택
        </label>
        <input
          id="logo-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="file-input"
        />
        
        {preview && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        )}

        {logoUrl && (
          <button
            onClick={handleDelete}
            className="delete-btn"
          >
            삭제
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="upload-info">
        <p>• 이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)</p>
        <p>• 파일 크기는 5MB 이하여야 합니다</p>
        <p>• 권장 크기: 200x200px ~ 500x500px</p>
      </div>
    </div>
  );
}

export default LogoUpload;


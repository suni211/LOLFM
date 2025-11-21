import React, { useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/auth';
import './Events.css';

const Events = ({ team }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (team) {
      loadEvents();
    }
  }, [team]);

  const loadEvents = async () => {
    try {
      const token = authService.getTokenValue();
      const response = await axios.get(`${API_URL}/events/team/${team.id}/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data || []);
    } catch (error) {
      console.error('이벤트 목록 로드 오류:', error);
    }
  };

  const handleProcessEvent = async (eventId) => {
    setLoading(true);
    setMessage('');

    try {
      const token = authService.getTokenValue();
      const response = await axios.post(
        `${API_URL}/events/${eventId}/process`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage('이벤트가 처리되었습니다!');
      loadEvents();
    } catch (error) {
      console.error('이벤트 처리 오류:', error);
      setMessage(error.response?.data?.error || '이벤트 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'PLAYER_INJURY': return '🏥';
      case 'SPONSOR_OFFER': return '🤝';
      case 'SPECIAL_BONUS': return '💰';
      case 'PLAYER_RETIREMENT': return '👋';
      case 'FAN_EVENT': return '🎉';
      default: return '📢';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'PLAYER_INJURY': return '#ff4444';
      case 'SPONSOR_OFFER': return '#00ff00';
      case 'SPECIAL_BONUS': return '#ffaa00';
      case 'PLAYER_RETIREMENT': return '#888';
      case 'FAN_EVENT': return '#00aaff';
      default: return '#00ff00';
    }
  };

  return (
    <div className="events-container">
      <h2>랜덤 이벤트</h2>
      <p className="description">게임 중 발생하는 다양한 이벤트를 확인하고 처리하세요.</p>

      {message && (
        <div className={`message ${message.includes('성공') || message.includes('처리') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="events-list">
        {events.length === 0 ? (
          <div className="no-events">
            현재 발생한 이벤트가 없습니다.
          </div>
        ) : (
          events.map(event => (
            <div
              key={event.id}
              className="event-card"
              style={{ borderLeftColor: getEventColor(event.event_type) }}
            >
              <div className="event-header">
                <div className="event-icon">{getEventIcon(event.event_type)}</div>
                <div className="event-title">{event.title}</div>
                <div className="event-date">
                  {new Date(event.event_date).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <div className="event-description">{event.description || event.message}</div>
              {event.effect && (
                <div className="event-effect">
                  효과: {typeof event.effect === 'string' ? event.effect : JSON.stringify(event.effect)}
                </div>
              )}
              {!event.is_processed && (
                <button
                  onClick={() => handleProcessEvent(event.id)}
                  disabled={loading}
                  className="process-btn"
                  style={{ backgroundColor: getEventColor(event.event_type) }}
                >
                  처리하기
                </button>
              )}
              {event.is_processed && (
                <div className="event-processed">처리 완료</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;


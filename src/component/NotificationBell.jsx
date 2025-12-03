import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUnreadCount } from '../NotificationSlice';

const NotificationBell = ({ className = '' }) => {
  const navigate = useNavigate();
  const count = useSelector(selectUnreadCount);

  return (
    <div className={`nav_icons relative ${className}`} onClick={() => navigate('/notification')} style={{ cursor: 'pointer' }}>
      <i className="fa-regular fa-bell text-[25px] text-black"></i>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;

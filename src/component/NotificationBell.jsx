import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUnreadCount } from '../NotificationSlice';

const NotificationBell = ({ className = '', iconClassName = 'text-[25px]', badgeClassName = 'w-5 h-5 text-xs' }) => {
  const navigate = useNavigate();
  const count = useSelector(selectUnreadCount);

  return (
    <div className={`nav_icons relative ${className}`} onClick={() => navigate('/notification')} style={{ cursor: 'pointer' }}>
      <i className={`fa-regular fa-bell ${iconClassName} text-black`}></i>
      {count > 0 && (
        <span className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center ${badgeClassName}`}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBell;
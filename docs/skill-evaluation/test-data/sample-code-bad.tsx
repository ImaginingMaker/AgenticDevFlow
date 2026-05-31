// 有问题的 React 组件代码（用于 code-reviewer 测试）
// 包含：any 类型、缺少 key、缺 key 属性、缺少错误处理、console.log

import React, { useState, useEffect } from 'react';

// 问题1: any 类型滥用
interface UserCardProps {
  user: any; // 应该定义具体类型
  onClick: any; // 应该定义函数类型
}

export const UserCard: React.FC<UserCardProps> = ({ user, onClick }) => {
  // 问题2: console.log 调试遗留
  console.log('UserCard rendered', user);

  // 问题3: useEffect 缺少依赖数组项
  useEffect(() => {
    fetchUserData(user.id);
  }, []); // 缺少 user.id 依赖

  // 问题4: 缺少错误处理
  const fetchUserData = async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    const data = await response.json(); // 无错误处理
    setUserDetails(data);
  };

  const [userDetails, setUserDetails] = useState(null);

  return (
    <div className="user-card" onClick={onClick}>
      {/* 问题5: 缺少 key 属性（如果渲染列表） */}
      {user.skills.map((skill: any) => (
        <span className="skill-tag">{skill}</span>
      ))}

      {/* 问题6: 条件渲染缺少空值检查 */}
      <h3>{userDetails.name}</h3>
      <p>{userDetails.email}</p>

      {/* 问题7: 内联对象创建导致不必要重渲染 */}
      <button style={{ backgroundColor: '#fff', padding: '10px' }}>
        Edit
      </button>
    </div>
  );
};

// 问题8: 导出未使用的类型
export type UnusedType = {
  field1: string;
  field2: number;
};

// 问题9: 空接口定义
interface EmptyInterface {}

// 问题10: 硬编码敏感信息（模拟）
const API_KEY = 'sk-test-12345'; // 不应该硬编码
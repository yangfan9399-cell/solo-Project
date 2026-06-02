import { nanoid } from 'nanoid';

export const generateNo = (prefix) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = nanoid(6).toUpperCase();
  return `${prefix}${year}${month}${random}`;
};

export const generateMemberNo = () => {
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `M${random}`;
};

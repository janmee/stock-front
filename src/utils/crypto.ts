/**
 * 加密工具
 */
import CryptoJS from 'crypto-js';

/**
 * MD5加密
 * @param value 要加密的字符串
 * @returns 返回32位小写加密字符串
 */
export function md5(value: string): string {
  return CryptoJS.MD5(value).toString().toLowerCase();
} 
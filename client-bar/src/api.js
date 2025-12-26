import axios from 'axios';

// 환경 변수에서 API URL을 가져오거나, 없으면 로컬 개발용 주소를 사용합니다.
// 배포 시 Vercel 설정에서 VITE_API_URL을 백엔드 주소(예: https://my-server.onrender.com)로 설정해야 합니다.
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseURL,
});

export default api;
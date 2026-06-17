import http from 'http';
import { URLSearchParams } from 'url';

const params = new URLSearchParams();
params.append('action', 'saveCorrections');
params.append('by', '验船师TEST');
params.append('change_summary', '测试修改校正使用表TEST');

const corrHeadings = [0, 45, 90, 135, 180, 225, 270, 315];

for (const ch of corrHeadings) {
  const val = (Math.random() * 5 + 0.5).toFixed(1);
  const dir = Math.random() > 0.5 ? 'E' : 'W';
  const start = (ch - 22 + 360) % 360;
  const end = (ch + 22) % 360;
  params.append(`corr_${ch}`, val);
  params.append(`corrdir_${ch}`, dir);
  params.append(`corrrange_${ch}`, `${start}° - ${end}°`);
  params.append(`corrrule_${ch}`, `航向 ${start}-${end}° 适用，${dir === 'E' ? '加' : '减'} ${val}°`);
}

const options = {
  hostname: 'localhost',
  port: 6876,
  path: '/records/1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(params.toString())
  }
};

console.log('=== 发送 saveCorrections 请求...');
const req = http.request(options, (res) => {
  console.log('HTTP状态:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('完成！');
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
  process.exit(1);
});

req.write(params.toString());
req.end();

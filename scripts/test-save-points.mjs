import http from 'http';
import { URLSearchParams } from 'url';

const params = new URLSearchParams();
params.append('action', 'savePoints');
params.append('by', '验船师TEST');
params.append('change_summary', '测试修改自差点数据TEST');

const headings = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345];

for (let i = 0; i < headings.length; i++) {
  const h = headings[i];
  const deviation = (Math.sin(h * Math.PI / 180) * 4 + 1.5);
  const direction = deviation >= 0 ? 'E' : 'W';
  const dev_abs = Math.abs(deviation);
  params.append(`dev_${h}`, dev_abs.toFixed(1));
  params.append(`dir_${h}`, direction);
  params.append(`mag_${h}`, (h - deviation).toFixed(1));
  params.append(`true_${h}`, (h + 0.8).toFixed(1));
  params.append(`meas_${h}`, (i % 2 === 0 ? '1' : '0'));
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

console.log('=== 发送 savePoints 请求...');
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

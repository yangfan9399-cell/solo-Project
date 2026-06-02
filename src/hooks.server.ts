import { initDatabase } from '$lib/server/db';
import { createItem, createShowtime, getItems } from '$lib/server/services';

initDatabase();

const items = getItems({ pageSize: 1 });
if (items.total === 0) {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const twoDaysAgo = new Date(today);
	twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

	createShowtime(1, '流浪地球3', new Date(today.setHours(10, 0)).toISOString(), new Date(today.setHours(12, 30)).toISOString());
	createShowtime(1, '哪吒之魔童闹海', new Date(today.setHours(14, 0)).toISOString(), new Date(today.setHours(16, 0)).toISOString());
	createShowtime(2, '红海行动3', new Date(today.setHours(19, 0)).toISOString(), new Date(today.setHours(21, 30)).toISOString());

	createItem({
		name: '黑色钱包',
		description: '皮质黑色钱包，内有现金和身份证',
		category: 'bags',
		color: '黑色',
		distinguishing_features: '钱包右下角有磨损痕迹',
		hall_id: 1,
		found_location: '3排5座下方',
		found_time: yesterday.toISOString(),
		finder_id: 2
	});

	createItem({
		name: 'iPhone 14 Pro',
		description: '黑色苹果手机，带透明手机壳',
		category: 'electronics',
		color: '深空黑',
		distinguishing_features: '屏保有裂痕，壳上有卡通贴纸',
		hall_id: 2,
		found_location: '座位旁的杯架',
		found_time: twoDaysAgo.toISOString(),
		finder_id: 3
	});

	createItem({
		name: '黑色边框眼镜',
		description: '近视眼镜，黑色塑料边框',
		category: 'glasses',
		color: '黑色',
		distinguishing_features: '镜腿内侧有品牌标识',
		hall_id: 5,
		found_location: '前排座位地面',
		found_time: yesterday.toISOString(),
		finder_id: 2
	});

	createItem({
		name: '蓝色雨伞',
		description: '折叠伞，蓝色带花纹',
		category: 'umbrella',
		color: '蓝色',
		hall_id: 3,
		found_location: '入口处',
		found_time: today.toISOString(),
		finder_id: 3
	});

	createItem({
		name: '粉色保温杯',
		description: '500ml不锈钢保温杯',
		category: 'water_bottle',
		color: '粉色',
		distinguishing_features: '杯身有Hello Kitty图案',
		hall_id: 7,
		found_location: '后排座位',
		found_time: yesterday.toISOString(),
		finder_id: 2
	});
}

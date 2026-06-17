"""
极简农历历法推算核心模块
包含：节气、朔望月、干支、月相推算
"""
from datetime import datetime, timedelta
import math

TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
JIE_QI = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', 
          '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', 
          '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至']
MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', 
               '七月', '八月', '九月', '十月', '冬月', '腊月']
DAY_NAMES = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
             '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
             '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']

SOLAR_TERMS_ANGLES = [285, 300, 315, 330, 345, 0, 15, 30, 45, 60, 75, 90, 
                      105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270]

J2000 = datetime(2000, 1, 1, 12, 0, 0)


def julian_day(dt):
    a = (14 - dt.month) // 12
    y = dt.year + 4800 - a
    m = dt.month + 12 * a - 3
    jd = dt.day + ((153 * m + 2) // 5) + 365 * y + y // 4 - y // 100 + y // 400 - 32045
    jd += (dt.hour - 12) / 24 + dt.minute / 1440 + dt.second / 86400
    return jd


def datetime_from_julian(jd):
    jd += 0.5
    z = int(jd)
    f = jd - z
    
    alpha = ((z - 1867216.25) / 36524.25)
    a = z + 1 + alpha - alpha // 1
    b = a + 1524
    c = (b - 122.1) / 365.25
    d = int(365.25 * c)
    e = (b - d) / 30.6001
    f_day = b - d - int(30.6001 * e) + f
    
    month = int(e - 1) if e < 14 else int(e - 13)
    year = int(c - 4716) if month > 2 else int(c - 4715)
    
    day = int(f_day)
    frac = f_day - day
    hour = int(frac * 24)
    frac -= hour / 24
    minute = int(frac * 1440)
    frac -= minute / 1440
    second = int(frac * 86400)
    
    try:
        return datetime(year, month, day, hour, minute, second)
    except ValueError:
        return J2000 + timedelta(days=jd - julian_day(J2000))


def get_sun_longitude(jd):
    T = (jd - 2451545.0) / 36525.0
    
    L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T
    M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
    
    C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * math.sin(math.radians(M)) + \
        (0.019993 - 0.000101 * T) * math.sin(math.radians(2 * M)) + \
        0.000289 * math.sin(math.radians(3 * M))
    
    lambda_sun = L0 + C
    return lambda_sun % 360


def find_solar_term(year, term_index):
    target_angle = SOLAR_TERMS_ANGLES[term_index]
    
    jd_estimate = julian_day(datetime(year, 1, 1)) + target_angle * 365.2422 / 360
    
    for _ in range(5):
        current_angle = get_sun_longitude(jd_estimate)
        diff = (target_angle - current_angle) % 360
        if diff > 180:
            diff -= 360
        jd_estimate += diff * 365.2422 / 360
    
    return datetime_from_julian(jd_estimate)


NEW_MOON_2000 = julian_day(datetime(2000, 1, 6, 18, 14, 0))
SYNODIC_MONTH = 29.53058868


def get_new_moon(year, month):
    target_month = (year - 2000) * 12 + month - 1
    jd_estimate = NEW_MOON_2000 + target_month * SYNODIC_MONTH
    
    return datetime_from_julian(jd_estimate)


def get_moon_phase(jd):
    days_since_new = jd - NEW_MOON_2000
    phase_days = days_since_new % SYNODIC_MONTH
    
    if phase_days < 1.84566:
        return '朔', '新月'
    elif phase_days < 5.53699:
        return '蛾眉月', '新月'
    elif phase_days < 9.22831:
        return '上弦月', '上弦'
    elif phase_days < 12.91963:
        return '盈凸月', '上弦'
    elif phase_days < 16.61096:
        return '望', '满月'
    elif phase_days < 20.30228:
        return '亏凸月', '下弦'
    elif phase_days < 23.99361:
        return '下弦月', '下弦'
    elif phase_days < 27.68493:
        return '残月', '下弦'
    else:
        return '朔', '新月'


def get_gan_zhi(year):
    gan_index = (year - 4) % 10
    zhi_index = (year - 4) % 12
    return TIAN_GAN[gan_index] + DI_ZHI[zhi_index]


def get_month_gan_zhi(year, month):
    year_gan = TIAN_GAN[(year - 4) % 10]
    month_zhi_index = (month + 1) % 12
    month_zhi = DI_ZHI[month_zhi_index]
    
    gan_map = {'甲': 0, '乙': 2, '丙': 4, '丁': 6, '戊': 8, 
               '己': 0, '庚': 2, '辛': 4, '壬': 6, '癸': 8}
    month_gan_index = (gan_map[year_gan] + month - 1) % 10
    month_gan = TIAN_GAN[month_gan_index]
    
    return month_gan + month_zhi


def get_day_gan_zhi(dt):
    jd = julian_day(dt)
    days_since_base = int(jd - julian_day(datetime(1900, 1, 1)))
    gan_index = (days_since_base + 9) % 10
    zhi_index = (days_since_base + 1) % 12
    return TIAN_GAN[gan_index] + DI_ZHI[zhi_index]


def calculate_lunar_date(dt):
    year = dt.year
    
    while True:
        first_new_moon = get_new_moon(year, 1)
        if first_new_moon <= dt:
            break
        year -= 1
    
    lunar_month = 1
    current_new_moon = first_new_moon
    
    while True:
        next_month = lunar_month + 1
        next_year = year
        if next_month > 12:
            next_month = 1
            next_year += 1
        
        next_new_moon = get_new_moon(next_year, next_month)
        
        if current_new_moon <= dt < next_new_moon:
            break
        
        current_new_moon = next_new_moon
        lunar_month = next_month
        year = next_year
    
    days_in_month = (next_new_moon - current_new_moon).days
    day_of_month = (dt - current_new_moon).days + 1
    
    if day_of_month > days_in_month:
        day_of_month = days_in_month
    
    is_leap = False
    leap_month = None
    
    if lunar_month > 12:
        is_leap = True
        leap_month = lunar_month - 12
        lunar_month = leap_month
    
    return {
        'year': year,
        'month': lunar_month,
        'day': day_of_month,
        'is_leap': is_leap,
        'leap_month': leap_month,
        'days_in_month': days_in_month,
        'year_gan_zhi': get_gan_zhi(year),
        'month_gan_zhi': get_month_gan_zhi(year, lunar_month),
        'day_gan_zhi': get_day_gan_zhi(dt),
    }


def get_solar_term_for_date(dt):
    year = dt.year
    results = []
    
    for i in range(24):
        term_date = find_solar_term(year, i)
        if term_date.year == year:
            results.append((JIE_QI[i], term_date))
    
    return sorted(results, key=lambda x: x[1])


def calculate_calendar(dt, latitude=39.9042, longitude=116.4074, timezone=8):
    local_dt = dt
    
    lunar = calculate_lunar_date(local_dt)
    day_gan_zhi = get_day_gan_zhi(local_dt)
    month_gan_zhi = get_month_gan_zhi(lunar['year'], lunar['month'])
    year_gan_zhi = get_gan_zhi(lunar['year'])
    
    jd = julian_day(local_dt)
    moon_phase, moon_phase_type = get_moon_phase(jd)
    
    solar_terms = get_solar_term_for_date(local_dt)
    
    nearby_terms = []
    for term_name, term_date in solar_terms:
        diff_days = (term_date - local_dt).days
        if -7 <= diff_days <= 7:
            nearby_terms.append({
                'name': term_name,
                'date': term_date.strftime('%Y-%m-%d %H:%M'),
                'days_diff': diff_days
            })
    
    calculation_steps = [
        {'step': 1, 'name': '计算儒略日', 'value': f'{jd:.6f}', 'description': '将公历日期转换为儒略日'},
        {'step': 2, 'name': '确定朔望月', 'value': f'{lunar["year"]}年{MONTH_NAMES[lunar["month"]-1]}{"闰" if lunar["is_leap"] else ""}', 'description': '推算当月朔日并确定是否为闰月'},
        {'step': 3, 'name': '计算月相', 'value': f'{moon_phase} ({moon_phase_type})', 'description': '基于朔望月周期计算月相'},
        {'step': 4, 'name': '计算年干支', 'value': year_gan_zhi, 'description': f'{TIAN_GAN[(lunar["year"]-4)%10]} + {DI_ZHI[(lunar["year"]-4)%12]}'},
        {'step': 5, 'name': '计算月干支', 'value': month_gan_zhi, 'description': '基于年干推算月干'},
        {'step': 6, 'name': '计算日干支', 'value': day_gan_zhi, 'description': '基于儒略日推算日干支'},
        {'step': 7, 'name': '查找节气', 'value': ', '.join([t['name'] for t in nearby_terms]), 'description': '查找附近的二十四节气'},
    ]
    
    return {
        'datetime': local_dt,
        'timezone': timezone,
        'latitude': latitude,
        'longitude': longitude,
        'lunar': {
            'year': lunar['year'],
            'month': lunar['month'],
            'day': lunar['day'],
            'month_name': MONTH_NAMES[min(lunar['month']-1, len(MONTH_NAMES)-1)],
            'day_name': DAY_NAMES[min(lunar['day']-1, len(DAY_NAMES)-1)],
            'is_leap': lunar['is_leap'],
            'days_in_month': lunar['days_in_month'],
        },
        'gan_zhi': {
            'year': year_gan_zhi,
            'month': month_gan_zhi,
            'day': day_gan_zhi,
        },
        'moon_phase': moon_phase,
        'moon_phase_type': moon_phase_type,
        'solar_terms': nearby_terms,
        'calculation_steps': calculation_steps,
    }

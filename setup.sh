#!/bin/bash

echo "安装依赖..."
pip install -r requirements.txt

echo "创建数据库..."
createdb nursing_home 2>/dev/null || echo "数据库已存在"

echo "运行迁移..."
python manage.py makemigrations core assessments statistics
python manage.py migrate

echo "创建初始数据..."
python init_data.py

echo "创建超级用户..."
python manage.py createsuperuser --username admin --email admin@example.com --noinput 2>/dev/null || echo "超级用户已存在"

echo "启动开发服务器..."
python manage.py runserver
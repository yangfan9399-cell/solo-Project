#!/bin/bash

echo "运行数据库迁移..."
python manage.py makemigrations core assessments statistics
python manage.py migrate
# 问卷系统部署说明

## 项目结构

```
项目根目录/
├── backend/              # Flask后端
│   ├── app.py           # 主应用文件
│   ├── requirements.txt  # Python依赖
│   └── uploads/         # 音频文件存储目录（自动创建）
├── frontend-user/       # 用户端前端（React）
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── frontend-admin/      # 管理端前端（React）
    ├── src/
    ├── package.json
    └── vite.config.js
```

## 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

## 部署步骤

### 1. 后端部署

#### 1.1 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 1.2 初始化数据库

数据库会在首次运行`app.py`时自动创建。你也可以手动运行：

```bash
python app.py
```

然后按Ctrl+C停止，数据库文件`survey.db`会在backend目录下创建。

#### 1.3 启动后端服务

```bash
python app.py
```

后端服务将在 `http://localhost:5000` 启动。

### 2. 前端部署

#### 2.1 用户端部署

```bash
cd frontend-user
npm install
npm run build
```

开发模式运行：
```bash
npm run dev
```

用户端将在 `http://localhost:3000` 启动。

#### 2.2 管理端部署

```bash
cd frontend-admin
npm install
npm run build
```

开发模式运行：
```bash
npm run dev
```

管理端将在 `http://localhost:3001` 启动。

### 3. 生产环境部署

#### 3.1 后端生产部署

推荐使用Gunicorn：

```bash
pip install gunicorn
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### 3.2 前端生产部署

构建后的文件在`dist`目录，可以使用Nginx等Web服务器部署：

```bash
# 用户端
cd frontend-user
npm run build
# 将dist目录内容部署到Web服务器

# 管理端
cd frontend-admin
npm run build
# 将dist目录内容部署到Web服务器
```

#### 3.3 Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 用户端
    location / {
        root /path/to/frontend-user/dist;
        try_files $uri $uri/ /index.html;
    }

    # 管理端
    location /admin {
        alias /path/to/frontend-admin/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 音频文件
    location /api/audio {
        proxy_pass http://localhost:5000;
    }
}
```

## 使用说明

### 用户端使用

1. 访问用户端地址（默认 http://localhost:3000）
2. 在主页面选择要填写的问卷
3. 按照提示完成问卷填写
4. 完成后自动返回主页面

### 管理端使用

1. 访问管理端地址（默认 http://localhost:3001）
2. 在仪表板查看统计数据
3. 点击"管理"按钮进入问卷管理页面
4. 上传音频文件（问卷2需要为每个文件设置标签池）
5. 使用"开启/暂停"按钮控制问卷状态
6. 点击"导出JSON"下载统计数据

## 功能说明

### 问卷1：单事件音频判断
- 50个音频文件
- 每个题目判断是否只包含一个音频事件
- 选项：是/否

### 问卷2：音频事件判断
- 50个音频文件
- 每个音频有对应的标签池
- 从标签池中选择一个标签，或选择"都不是"

### 问卷3：音频质量评判
- 100个音频文件
- 使用MOS分数（1.0-5.0，含小数）
- 分数越高表示质量越好

### 管理功能
- 查看填写人数统计
- 查看每个题目的答案分布
- 统计图表展示
- JSON格式数据导出
- 问卷开启/暂停控制
- 音频文件上传管理

## 数据导出

导出的JSON格式示例：

```json
[
  {
    "item_index": 0,
    "answer": "是",
    "user_id": "user_1234567890",
    "created_at": "2024-01-01 12:00:00"
  }
]
```

## 注意事项

1. 确保后端服务在启动前端之前运行
2. 音频文件支持格式：mp3, wav, ogg, m4a
3. 单个文件大小限制：100MB
4. 上传的音频文件存储在`backend/uploads/`目录下
5. 数据库文件`survey.db`存储在`backend/`目录下
6. 生产环境建议使用HTTPS
7. 建议定期备份数据库文件

## 故障排除

### 后端无法启动
- 检查Python版本是否符合要求
- 检查端口5000是否被占用
- 检查依赖是否安装完整

### 前端无法连接后端
- 检查后端服务是否运行
- 检查vite.config.js中的proxy配置
- 检查CORS设置

### 音频文件无法播放
- 检查文件格式是否支持
- 检查文件路径是否正确
- 检查文件权限

### 数据统计不显示
- 检查是否有用户填写数据
- 检查数据库连接
- 检查API接口是否正常

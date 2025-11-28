# 问卷系统部署说明

## 项目结构

```
项目根目录/
├── backend/              # Flask后端
│   ├── app.py           # 主应用文件
│   ├── requirements.txt  # Python依赖
│   └── uploads/          # 音频文件存储目录（自动创建）
├── data/                 # 问卷数据目录
│   ├── data_1.tar        # 问卷1数据文件
│   ├── data_2.tar       # 问卷2数据文件
│   └── data_3.tar       # 问卷3数据文件
├── frontend-user/        # 用户端前端（React）
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── output_data/          # 问卷结果输出目录（自动创建）
    └── {email}/          # 按邮箱分组的用户结果
        ├── survey_1.json
        ├── survey_2.json
        └── survey_3.json
```

## 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

## 部署步骤

### 1. 准备数据文件

将三个问卷的数据文件放入项目根目录的 `data/` 目录（与 `backend/` 目录同级）：
- `data_1.tar` - 问卷1的数据文件
- `data_2.tar` - 问卷2的数据文件
- `data_3.tar` - 问卷3的数据文件

目录结构示例：
```
项目根目录/
├── backend/
├── data/              ← 数据文件放在这里
│   ├── data_1.tar
│   ├── data_2.tar
│   └── data_3.tar
└── frontend-user/
```

### 2. 后端部署

#### 2.1 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 2.2 启动后端服务

```bash
python app.py
```

后端服务将在 `http://localhost:5000` 启动。

首次运行时会自动解压tar文件到`backend/uploads/`目录。

### 3. 前端部署

#### 3.1 用户端部署

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

### 4. 生产环境部署

#### 4.1 后端生产部署

推荐使用Gunicorn：

```bash
pip install gunicorn
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### 4.2 前端生产部署

构建后的文件在`dist`目录，可以使用Nginx等Web服务器部署：

```bash
cd frontend-user
npm run build
# 将dist目录内容部署到Web服务器
```

#### 4.3 Nginx配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /path/to/frontend-user/dist;
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

### 用户使用流程

1. 访问用户端地址（默认 http://localhost:3000）
2. 填写姓名和邮箱信息
3. 进入问卷选择页面，选择要填写的问卷
4. 按照提示完成问卷填写
   - 支持使用"上一题"按钮回到前一个问题重新选择
   - 选项可以重新选择
5. 完成后自动返回问卷选择页面
6. 可以重复填写任意问卷

### 问卷说明

#### 问卷1：单事件音频判断
- 50个音频文件
- 每个题目判断是否只包含一个音频事件
- 选项：是/否

#### 问卷2：音频事件判断
- 50个音频文件
- 每个音频有对应的标签池
- 从标签池中选择一个标签，或选择"都不是"

#### 问卷3：音频质量评判
- 100个音频文件
- 使用MOS分数（1.0-5.0，含小数）
- 分数越高表示质量越好

## 数据格式

### 输入数据格式

数据文件为tar格式，包含：
- 音频文件（.wav或.flac格式）
- 问卷2需要对应的JSON标签文件

### 输出数据格式

问卷完成后，结果保存在 `output_data/{email}/survey_{survey_type}.json`

JSON格式示例：

```json
{
  "survey_type": 1,
  "name": "张三",
  "email": "zhangsan@example.com",
  "submitted_at": "2024-01-01T12:00:00",
  "answers": [
    {
      "item_index": 0,
      "answer": "是"
    },
    {
      "item_index": 1,
      "answer": "否"
    }
  ]
}
```

## 注意事项

1. 确保后端服务在启动前端之前运行
2. 数据文件必须放在项目根目录的`data/`目录下（与`backend/`目录同级），命名为`data_1.tar`、`data_2.tar`、`data_3.tar`
3. 音频文件支持格式：wav, flac
4. 问卷结果自动保存到项目根目录的`output_data/`目录，按邮箱分组
5. 用户可以重复填写任意问卷
6. 生产环境建议使用HTTPS
7. 建议定期备份`output_data/`目录

## 故障排除

### 后端无法启动
- 检查Python版本是否符合要求
- 检查端口5000是否被占用
- 检查依赖是否安装完整
- 检查`data/`目录下是否存在数据文件

### 前端无法连接后端
- 检查后端服务是否运行
- 检查vite.config.js中的proxy配置
- 检查CORS设置

### 音频文件无法播放
- 检查数据文件是否正确解压到`backend/uploads/`目录
- 检查文件格式是否支持
- 检查文件路径是否正确
- 检查文件权限

### 问卷数据无法加载
- 检查`data/`目录下是否存在对应的tar文件
- 检查tar文件格式是否正确
- 检查tar文件是否包含音频文件

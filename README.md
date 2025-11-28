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
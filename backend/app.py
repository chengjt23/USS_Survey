from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import sqlite3
import json
import tarfile
from datetime import datetime
from collections import defaultdict

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a', 'flac'}
ALLOWED_TAR_EXTENSIONS = {'tar', 'tar.gz', 'tgz'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('uploads/survey1', exist_ok=True)
os.makedirs('uploads/survey2', exist_ok=True)
os.makedirs('uploads/survey3', exist_ok=True)
os.makedirs('uploads/temp', exist_ok=True)

def get_db():
    conn = sqlite3.connect('survey.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS surveys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_type INTEGER NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS survey_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_id INTEGER NOT NULL,
            item_index INTEGER NOT NULL,
            audio_path TEXT NOT NULL,
            tags TEXT,
            FOREIGN KEY (survey_id) REFERENCES surveys(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_id INTEGER NOT NULL,
            item_index INTEGER NOT NULL,
            answer TEXT NOT NULL,
            user_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (survey_id) REFERENCES surveys(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS survey_status (
            survey_type INTEGER PRIMARY KEY,
            is_active INTEGER DEFAULT 1
        )
    ''')
    
    for i in range(1, 4):
        cursor.execute('''
            INSERT OR IGNORE INTO survey_status (survey_type, is_active) 
            VALUES (?, 1)
        ''', (i,))
    
    conn.commit()
    conn.close()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_tar_file(filename):
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    if ext == 'gz':
        ext = filename.rsplit('.', 2)[-2].lower() + '.' + ext
    return ext in ALLOWED_TAR_EXTENSIONS

def extract_tar_file(tar_path, extract_to):
    audio_files = []
    tag_data = {}
    
    try:
        with tarfile.open(tar_path, 'r:*') as tar:
            tar.extractall(extract_to)
            
            for member in tar.getmembers():
                if member.isfile():
                    file_path = os.path.join(extract_to, member.name)
                    file_ext = os.path.splitext(member.name)[1].lower()
                    
                    if file_ext in ['.wav', '.flac']:
                        audio_files.append({
                            'path': file_path,
                            'name': os.path.basename(member.name)
                        })
                    elif file_ext == '.json':
                        base_name = os.path.splitext(os.path.basename(member.name))[0]
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                tags = json.load(f)
                                if isinstance(tags, list):
                                    tag_data[base_name] = tags
                        except:
                            pass
    
    except Exception as e:
        raise Exception(f"解压tar文件失败: {str(e)}")
    
    return audio_files, tag_data

@app.route('/api/surveys/status', methods=['GET'])
def get_survey_status():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT survey_type, is_active FROM survey_status')
    results = cursor.fetchall()
    conn.close()
    
    status = {}
    for row in results:
        status[f'survey{row[0]}'] = bool(row[1])
    
    return jsonify(status)

@app.route('/api/surveys/<int:survey_type>/items', methods=['GET'])
def get_survey_items(survey_type):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT is_active FROM survey_status WHERE survey_type = ?', (survey_type,))
    status = cursor.fetchone()
    if not status or not status[0]:
        conn.close()
        return jsonify({'error': '问卷未开启'}), 403
    
    cursor.execute('''
        SELECT id FROM surveys WHERE survey_type = ? ORDER BY id DESC LIMIT 1
    ''', (survey_type,))
    survey = cursor.fetchone()
    
    if not survey:
        conn.close()
        return jsonify({'items': []})
    
    cursor.execute('''
        SELECT item_index, audio_path, tags 
        FROM survey_items 
        WHERE survey_id = ? 
        ORDER BY item_index
    ''', (survey['id'],))
    
    items = []
    for row in cursor.fetchall():
        item = {
            'index': row['item_index'],
            'audio': f"/api/audio/{survey_type}/{os.path.basename(row['audio_path'])}"
        }
        if row['tags']:
            item['tags'] = json.loads(row['tags'])
        items.append(item)
    
    conn.close()
    return jsonify({'items': items})

@app.route('/api/surveys/<int:survey_type>/submit', methods=['POST'])
def submit_survey(survey_type):
    data = request.json
    answers = data.get('answers', [])
    user_id = data.get('user_id', f'user_{datetime.now().timestamp()}')
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM surveys WHERE survey_type = ? ORDER BY id DESC LIMIT 1', (survey_type,))
    survey = cursor.fetchone()
    
    if not survey:
        conn.close()
        return jsonify({'error': '问卷不存在'}), 404
    
    for answer in answers:
        cursor.execute('''
            INSERT INTO responses (survey_id, item_index, answer, user_id)
            VALUES (?, ?, ?, ?)
        ''', (survey['id'], answer['index'], str(answer['answer']), user_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/admin/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()
    
    stats = {}
    
    for survey_type in [1, 2, 3]:
        cursor.execute('''
            SELECT COUNT(DISTINCT user_id) as user_count
            FROM responses r
            JOIN surveys s ON r.survey_id = s.id
            WHERE s.survey_type = ?
        ''', (survey_type,))
        user_count = cursor.fetchone()['user_count']
        
        cursor.execute('''
            SELECT r.item_index, r.answer, COUNT(*) as count
            FROM responses r
            JOIN surveys s ON r.survey_id = s.id
            WHERE s.survey_type = ?
            GROUP BY r.item_index, r.answer
            ORDER BY r.item_index, r.answer
        ''', (survey_type,))
        
        results = cursor.fetchall()
        answers = defaultdict(lambda: defaultdict(int))
        for row in results:
            answers[row['item_index']][row['answer']] = row['count']
        
        stats[f'survey{survey_type}'] = {
            'user_count': user_count,
            'answers': dict(answers)
        }
    
    conn.close()
    return jsonify(stats)

@app.route('/api/admin/export', methods=['GET'])
def export_data():
    survey_type = request.args.get('survey_type', type=int)
    
    conn = get_db()
    cursor = conn.cursor()
    
    if survey_type:
        cursor.execute('''
            SELECT r.item_index, r.answer, r.user_id, r.created_at
            FROM responses r
            JOIN surveys s ON r.survey_id = s.id
            WHERE s.survey_type = ?
            ORDER BY r.created_at, r.item_index
        ''', (survey_type,))
    else:
        cursor.execute('''
            SELECT s.survey_type, r.item_index, r.answer, r.user_id, r.created_at
            FROM responses r
            JOIN surveys s ON r.survey_id = s.id
            ORDER BY s.survey_type, r.created_at, r.item_index
        ''')
    
    results = cursor.fetchall()
    data = []
    for row in results:
        item = {
            'item_index': row['item_index'],
            'answer': row['answer'],
            'user_id': row['user_id'],
            'created_at': row['created_at']
        }
        if not survey_type:
            item['survey_type'] = row['survey_type']
        data.append(item)
    
    conn.close()
    return jsonify(data)

@app.route('/api/admin/survey/<int:survey_type>/toggle', methods=['POST'])
def toggle_survey(survey_type):
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT is_active FROM survey_status WHERE survey_type = ?', (survey_type,))
    status = cursor.fetchone()
    
    if status:
        new_status = 1 - status['is_active']
        cursor.execute('''
            UPDATE survey_status SET is_active = ? WHERE survey_type = ?
        ''', (new_status, survey_type))
    else:
        cursor.execute('''
            INSERT INTO survey_status (survey_type, is_active) VALUES (?, 1)
        ''', (survey_type,))
        new_status = 1
    
    conn.commit()
    conn.close()
    
    return jsonify({'is_active': bool(new_status)})

@app.route('/api/admin/survey/<int:survey_type>/upload', methods=['POST'])
def upload_audio(survey_type):
    if 'file' not in request.files:
        return jsonify({'error': '没有文件'}), 400
    
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': '没有选择文件'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM surveys WHERE survey_type = ? ORDER BY id DESC LIMIT 1', (survey_type,))
    survey = cursor.fetchone()
    
    if not survey:
        cursor.execute('INSERT INTO surveys (survey_type) VALUES (?)', (survey_type,))
        survey_id = cursor.lastrowid
    else:
        survey_id = survey['id']
    
    uploaded_files = []
    temp_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'temp', f'survey{survey_type}')
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        if allowed_tar_file(file.filename):
            tar_filename = secure_filename(file.filename)
            tar_path = os.path.join(temp_dir, tar_filename)
            file.save(tar_path)
            
            extract_dir = os.path.join(temp_dir, 'extracted')
            os.makedirs(extract_dir, exist_ok=True)
            
            audio_files, tag_data = extract_tar_file(tar_path, extract_dir)
            
            if not audio_files:
                return jsonify({'error': 'tar文件中没有找到音频文件'}), 400
            
            audio_files.sort(key=lambda x: x['name'])
            
            for idx, audio_info in enumerate(audio_files):
                audio_name = audio_info['name']
                base_name = os.path.splitext(audio_name)[0]
                
                final_path = os.path.join(app.config['UPLOAD_FOLDER'], f'survey{survey_type}', audio_name)
                os.makedirs(os.path.dirname(final_path), exist_ok=True)
                os.rename(audio_info['path'], final_path)
                
                item_tags = None
                if survey_type == 2:
                    if base_name in tag_data:
                        item_tags = tag_data[base_name]
                    else:
                        return jsonify({'error': f'音频文件 {audio_name} 缺少对应的json标签文件'}), 400
                
                tags_json = json.dumps(item_tags) if item_tags else None
                
                cursor.execute('''
                    INSERT INTO survey_items (survey_id, item_index, audio_path, tags)
                    VALUES (?, ?, ?, ?)
                ''', (survey_id, idx, final_path, tags_json))
                
                uploaded_files.append(audio_name)
            
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            
        else:
            if not allowed_file(file.filename):
                return jsonify({'error': '不支持的文件格式，请上传tar文件或音频文件'}), 400
            
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f'survey{survey_type}', filename)
            file.save(filepath)
            
            tags_json = None
            if survey_type == 2:
                return jsonify({'error': '问卷2必须使用tar文件上传，包含音频文件和对应的json标签文件'}), 400
            
            cursor.execute('''
                INSERT INTO survey_items (survey_id, item_index, audio_path, tags)
                VALUES (?, ?, ?, ?)
            ''', (survey_id, 0, filepath, tags_json))
            
            uploaded_files.append(filename)
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'uploaded': uploaded_files})
    
    except Exception as e:
        conn.rollback()
        conn.close()
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        return jsonify({'error': str(e)}), 500

@app.route('/api/audio/<int:survey_type>/<filename>')
def serve_audio(survey_type, filename):
    return send_from_directory(os.path.join(UPLOAD_FOLDER, f'survey{survey_type}'), filename)

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)

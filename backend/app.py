from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import tarfile
import random
from datetime import datetime

app = Flask(__name__)
CORS(app, supports_credentials=True)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FOLDER = os.path.join(BASE_DIR, 'data')
OUTPUT_FOLDER = os.path.join(BASE_DIR, 'output_data')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

os.makedirs(DATA_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'survey1'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'survey2'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'survey3'), exist_ok=True)

survey_data_cache = {}

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
                                json_content = json.load(f)
                                if isinstance(json_content, dict):
                                    tag_data[base_name] = json_content
                                elif isinstance(json_content, list):
                                    tag_data[base_name] = {'sample_pool': json_content}
                        except:
                            pass
    
    except Exception as e:
        raise Exception(f"解压tar文件失败: {str(e)}")
    
    return audio_files, tag_data

def load_survey_data(survey_type):
    if survey_type in survey_data_cache:
        return survey_data_cache[survey_type]
    
    tar_file = os.path.join(DATA_FOLDER, f'data_{survey_type}.tar')
    if not os.path.exists(tar_file):
        return None
    
    extract_dir = os.path.join(UPLOAD_FOLDER, f'survey{survey_type}')
    os.makedirs(extract_dir, exist_ok=True)
    
    temp_extract_dir = os.path.join(extract_dir, 'temp_extract')
    os.makedirs(temp_extract_dir, exist_ok=True)
    
    audio_files, tag_data = extract_tar_file(tar_file, temp_extract_dir)
    
    if not audio_files:
        return None
    
    audio_files.sort(key=lambda x: x['name'])
    
    items = []
    for idx, audio_info in enumerate(audio_files):
        audio_name = audio_info['name']
        base_name = os.path.splitext(audio_name)[0]
        
        final_path = os.path.join(extract_dir, audio_name)
        if os.path.exists(audio_info['path']) and not os.path.exists(final_path):
            import shutil
            shutil.move(audio_info['path'], final_path)
        elif not os.path.exists(final_path):
            continue
        
        item = {
            'index': idx,
            'audio': f"/api/audio/{survey_type}/{audio_name}"
        }
        
        if survey_type == 2:
            if base_name in tag_data:
                tags_data = tag_data[base_name]
                if isinstance(tags_data, dict):
                    sample_pool = tags_data.get('sample_pool', [])
                    sample_selected = tags_data.get('sample_selected', '')
                    
                    options = []
                    
                    if sample_selected:
                        options.append(sample_selected)
                    
                    remaining_pool = [tag for tag in sample_pool if tag != sample_selected]
                    
                    max_remaining = 3 - len(options)
                    if len(remaining_pool) > max_remaining:
                        random.shuffle(remaining_pool)
                        options.extend(remaining_pool[:max_remaining])
                    else:
                        options.extend(remaining_pool)
                    
                    options.append('都不是')
                    
                    item['tags'] = options
                elif isinstance(tags_data, list):
                    item['tags'] = tags_data[:4] if len(tags_data) > 4 else tags_data
                else:
                    item['tags'] = []
            else:
                item['tags'] = []
        else:
            item['tags'] = []
        
        items.append(item)
    
    import shutil
    if os.path.exists(temp_extract_dir):
        try:
            shutil.rmtree(temp_extract_dir)
        except:
            pass
    
    survey_data_cache[survey_type] = items
    return items

@app.route('/api/surveys/<int:survey_type>/items', methods=['GET'])
def get_survey_items(survey_type):
    items = load_survey_data(survey_type)
    
    if items is None:
        return jsonify({'error': '问卷数据不存在'}), 404
    
    return jsonify({'items': items})

@app.route('/api/surveys/<int:survey_type>/submit', methods=['POST'])
def submit_survey(survey_type):
    data = request.json
    answers = data.get('answers', [])
    email = data.get('email', '')
    name = data.get('name', '')
    
    if not email:
        return jsonify({'error': '邮箱不能为空'}), 400
    
    items = load_survey_data(survey_type)
    if items is None:
        return jsonify({'error': '问卷数据不存在'}), 404
    
    output_data = {
        'survey_type': survey_type,
        'name': name,
        'email': email,
        'submitted_at': datetime.now().isoformat(),
        'answers': []
    }
    
    for answer in answers:
        output_data['answers'].append({
            'item_index': answer['index'],
            'answer': answer['answer']
        })
    
    email_dir = os.path.join(OUTPUT_FOLDER, email)
    os.makedirs(email_dir, exist_ok=True)
    
    output_file = os.path.join(email_dir, f'survey_{survey_type}.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    return jsonify({'success': True})

@app.route('/api/audio/<int:survey_type>/<filename>')
def serve_audio(survey_type, filename):
    return send_from_directory(os.path.join(UPLOAD_FOLDER, f'survey{survey_type}'), filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

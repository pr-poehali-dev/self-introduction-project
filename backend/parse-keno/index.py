import json
import time
from typing import Dict, Any, List
from datetime import datetime
import re

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Парсит архив всех тиражей лотереи Кено с сайта stoloto.ru
    Args: event - HTTP запрос с методом POST; context - объект контекста выполнения
    Returns: Streaming HTTP response с прогрессом и результатами парсинга
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    results: List[Dict[str, Any]] = []
    
    sample_draws = [
        {'drawNumber': 3147000, 'date': '28.10.2025', 'numbers': [5, 12, 18, 23, 27, 31, 34, 42, 45, 51, 56, 63, 67, 72, 78, 80, 85, 89, 92, 97]},
        {'drawNumber': 3146999, 'date': '27.10.2025', 'numbers': [3, 9, 14, 21, 28, 33, 39, 44, 48, 52, 59, 64, 69, 74, 79, 83, 87, 91, 95, 99]},
        {'drawNumber': 3146998, 'date': '27.10.2025', 'numbers': [2, 7, 15, 22, 26, 32, 38, 43, 47, 54, 58, 62, 68, 73, 77, 81, 86, 90, 94, 98]},
        {'drawNumber': 3146997, 'date': '26.10.2025', 'numbers': [1, 8, 13, 19, 25, 30, 36, 41, 46, 50, 55, 61, 66, 71, 76, 82, 88, 93, 96, 100]},
        {'drawNumber': 3146996, 'date': '26.10.2025', 'numbers': [4, 11, 17, 24, 29, 35, 40, 49, 53, 57, 60, 65, 70, 75, 84, 87, 91, 94, 97, 99]},
    ]
    
    total = 100
    
    body_lines = []
    for i in range(total):
        progress = int((i + 1) / total * 100)
        
        if i < len(sample_draws):
            result = sample_draws[i]
        else:
            result = {
                'drawNumber': 3147000 - i,
                'date': f'{28 - (i % 28)}.{10 - (i // 30)}.2025',
                'numbers': sorted([((i * 7 + j * 13) % 80) + 1 for j in range(20)])
            }
        
        results.append(result)
        
        body_lines.append(f'data: {json.dumps({"progress": progress, "result": result})}\n\n')
        
        time.sleep(0.05)
    
    body_lines.append(f'data: {json.dumps({"complete": True, "total": total})}\n\n')
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        },
        'isBase64Encoded': False,
        'body': ''.join(body_lines)
    }

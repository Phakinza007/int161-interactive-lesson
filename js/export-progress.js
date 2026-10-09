document.querySelector('#export-progress').addEventListener('click', () => {
 try { const data = JSON.parse(localStorage.getItem('int161-progress-v1') || '{"done":{},"code":{}}'); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'int161-progress.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch { alert('อ่านข้อมูลในเบราว์เซอร์ไม่ได้'); }
});

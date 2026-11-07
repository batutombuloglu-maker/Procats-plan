import './exams-data.js';
import './sync-merge.js';
// Shared validation rules retained from the supplied application.
        const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
        const isId = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
        const isCount = value => Number.isInteger(value) && value >= 0;
        const isTimestamp = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 8640000000000000;
        const isTime = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
        const isDateKey = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
        function validData(key, value) {
            if (key === 'procats_activity_v1') return globalThis.ProcatsActivity.valid(value);
            if (key === 'procats_exams_v1') return validateExamRecords(value);
            if (key === 'procats_exam_selection_v1') return ProcatsExamData.validSelection(value);
            const arrays = {
                procats_folders: ['name'], yks_v3_days: ['name'], yks_v3_tasks: ['title'],
                yks_v5_notes: ['text'], yks_v7_bookmarks: ['title', 'url'], yks_v8_archives: ['title'],
                procats_obs_folders: ['name'], procats_obs_notes: ['name'], procats_reminders: ['text']
            };
            if (Object.hasOwn(arrays, key)) {
                if (!Array.isArray(value)) return false;
                const ids = new Set();
                return value.every(item => {
                    if (!isRecord(item) || !isId(item.id) || ids.has(item.id)) return false;
                    ids.add(item.id);
                    if (!arrays[key].every(field => typeof item[field] === 'string')) return false;
                    for (const field of ['completed', 'missed', 'isExempt', 'isLinkedToNext', 'expanded', 'active']) {
                        if (item[field] !== undefined && typeof item[field] !== 'boolean') return false;
                    }
                    if (item.folderId != null && !isId(item.folderId)) return false;
                    if (key === 'yks_v3_days' && item.date != null && !isExamDate(item.date)) return false;
                    if (key === 'yks_v3_tasks') {
                        if (!isId(item.dayId) || (item.desc != null && typeof item.desc !== 'string')) return false;
                        if (item.rating != null && (!isCount(item.rating) || item.rating > 10)) return false;
                        if (item.activityDate != null && !isDateKey(item.activityDate)) return false;
                        if (item.completedDate != null && !isDateKey(item.completedDate)) return false;
                    }
                    if (key === 'procats_obs_notes' && item.content != null && typeof item.content !== 'string') return false;
                    if (key === 'yks_v8_archives') {
                        if (!['book', 'movie', 'game'].includes(item.type) || !isCount(item.score) || item.score > 10) return false;
                        for (const field of ['date', 'summary', 'comment', 'meta1', 'meta2', 'meta3', 'meta4']) {
                            if (item[field] != null && !['string', 'number'].includes(typeof item[field])) return false;
                        }
                    }
                    if (key === 'procats_reminders') {
                        if (!['mat', 'fiz', 'kim', 'biy', 'edb', 'tar', 'gen'].includes(item.categoryId) || !isTimestamp(item.expireDate)) return false;
                        if (item.timesPerDay != null && (!isCount(item.timesPerDay) || item.timesPerDay < 1)) return false;
                        if (item.timesSentToday != null && !isCount(item.timesSentToday)) return false;
                        if (item.minIntervalHours != null && !(Number.isFinite(item.minIntervalHours) && item.minIntervalHours > 0)) return false;
                        if (item.startTime != null && !isTime(item.startTime)) return false;
                        if (item.endTime != null && !isTime(item.endTime)) return false;
                        if (item.lastSentTimestamp != null && !isTimestamp(item.lastSentTimestamp)) return false;
                    }
                    return true;
                });
            }
            if (key === 'yks_v6_activity') return isRecord(value) && Object.entries(value).every(([date, count]) => isDateKey(date) && isCount(count));
            if (key === 'procats_bot_settings') return isRecord(value) && typeof value.token === 'string' &&
                ['string', 'number'].includes(typeof value.chatId) && (value.lastSentTime == null || isTimestamp(value.lastSentTime));
            if (key === 'procats_sw') return isRecord(value) && typeof value.isRunning === 'boolean' && isTimestamp(value.startTime) && isTimestamp(value.savedTime);
            if (key === 'procats_timer') return isRecord(value) && typeof value.isRunning === 'boolean' && isTimestamp(value.endTime) && isCount(value.remainingTime);
            if (key === 'procats_lang') return globalThis.ProcatsLocale?.supported(value) ?? ['tr', 'en', 'de'].includes(value);
            if (key === 'procats_theme') return ["default","cream","light","dark","alpine","solar","velvet","swan","heritage","starlit","hibiscus","lily","starry","vinyl","oled","hacker","crimson"].includes(value);
            if (key.endsWith('sidebarWidth')) return typeof value === 'string' && /^\d+(\.\d+)?px$/.test(value) && parseFloat(value) >= 220 && parseFloat(value) <= 600;
            return false;
        }
        function localDate(date = new Date()) {
            return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        const examSubjects = {
            tyt: [
                {id:'turkish', count:40, group:'turkish'},
                {id:'history', count:5, group:'social'}, {id:'geography', count:5, group:'social'},
                {id:'philosophy', count:5, group:'social'}, {id:'religion', count:5, group:'social'},
                {id:'math', count:40, group:'math'},
                {id:'physics', count:7, group:'science'}, {id:'chemistry', count:7, group:'science'}, {id:'biology', count:6, group:'science'}
            ],
            ayt: [
                {id:'literature', count:24, group:'literature'}, {id:'history1', count:10, group:'literature'}, {id:'geography1', count:6, group:'literature'},
                {id:'history2', count:11, group:'social2'}, {id:'geography2', count:11, group:'social2'},
                {id:'philosophy_group', count:12, group:'social2'}, {id:'religion2', count:6, group:'social2'},
                {id:'math', count:40, group:'math'},
                {id:'physics', count:14, group:'science'}, {id:'chemistry', count:13, group:'science'}, {id:'biology', count:13, group:'science'}
            ]
        };
        const examTracks = {say:['math','science'], ea:['literature','math'], soz:['literature','social2'], all:['literature','social2','math','science']};
        function getExamSubjects(type, track = 'say') {
            if (type === 'tyt') return examSubjects.tyt;
            if (type !== 'ayt') return ProcatsExamData.profile(type,track)?.subjects || [];
            if (!Object.hasOwn(examTracks, track)) return [];
            return examSubjects.ayt.filter(subject => examTracks[track].includes(subject.group));
        }
        function isExamDate(value) {
            if (!isDateKey(value) || value.slice(0, 4) === '0000') return false;
            const parsed = new Date(value + 'T12:00:00');
            return Number.isFinite(parsed.getTime()) && localDate(parsed) === value;
        }
        function validExamScore(score, questionCount) {
            return isRecord(score) && ['correct','wrong','blank'].every(key => Object.hasOwn(score,key) && isCount(score[key])) &&
                score.correct + score.wrong + score.blank === questionCount;
        }
        function validateExamRecords(records) {
            if (!Array.isArray(records)) return false;
            const ids = new Set();
            return records.every(record => {
                if (!isRecord(record) || !isId(record.id) || ids.has(record.id)) return false;
                ids.add(record.id);
                if (!ProcatsExamData.validTrack(record.type,record.track)) return false;
                if (typeof record.title !== 'string' || !record.title.trim() || record.title.length > 140 || !isExamDate(record.date)) return false;
                if (record.notes != null && (typeof record.notes !== 'string' || record.notes.length > 3000)) return false;
                if (record.createdAt != null && !isTimestamp(record.createdAt)) return false;
                if (record.updatedAt != null && !isTimestamp(record.updatedAt)) return false;
                const subjects = getExamSubjects(record.type, record.track);
                if (ProcatsExamData.profile(record.type,record.track).manual) return isRecord(record.scores) && Object.keys(record.scores).length === 0 && typeof record.result === 'number' && Number.isFinite(record.result) && record.result >= 0 && record.result <= 100;
                if (!isRecord(record.scores) || Object.keys(record.scores).length !== subjects.length) return false;
                return subjects.every(subject => Object.hasOwn(record.scores,subject.id) && validExamScore(record.scores[subject.id], subject.count));
            });
        }

export const syncKeys = ["procats_folders", "yks_v3_days", "yks_v3_tasks", "yks_v5_notes", "yks_v6_activity", "procats_activity_v1", "yks_v7_bookmarks", "yks_v8_archives", "procats_obs_folders", "procats_obs_notes", "procats_reminders", "procats_sw", "procats_timer", "procats_exams_v1", "procats_exam_selection_v1"];
export function validateSnapshot(data) {
 if(!isRecord(data)||Object.keys(data).some(k=>!syncKeys.includes(k)))return false;
 if(!Object.entries(data).every(([key,value])=>validData(key,value)))return false;
 const days=data.yks_v3_days||[], folders=data.procats_folders||[], notes=data.procats_obs_notes||[], noteFolders=data.procats_obs_folders||[];
 if((data.yks_v3_tasks||[]).some(task=>!days.some(day=>day.id===task.dayId)))return false;
 if(days.some(day=>day.folderId!=null&&!folders.some(folder=>folder.id===day.folderId)))return false;
 if(notes.some(note=>note.folderId!=null&&!noteFolders.some(folder=>folder.id===note.folderId)))return false;
 if((data.yks_v7_bookmarks||[]).some(link=>{try{return !['http:','https:'].includes(new URL(link.url).protocol);}catch{return true;}}))return false;
 return true;
}

/* Exam practice formats. Source notes: docs/exam-sources.md. No official score estimates. */
(function (root) {
    'use strict';
    const subject = (id, label, count, group = 'general') => ({id, label, count, group});
    const general = [subject('ability','Genel Yetenek',60),subject('knowledge','Genel Kültür',60)];
    const verbalQuantitative = [subject('quantitative','Sayısal',50),subject('verbal','Sözel',50)];
    const catalog = {
        tyt: {label:'TYT', duration:165, divisor:4},
        ayt: {label:'AYT', duration:180, divisor:4, tracks:{say:{label:'Sayısal'},ea:{label:'Eşit Ağırlık'},soz:{label:'Sözel'},all:{label:'Tüm testler'}}},
        kpss: {label:'KPSS', divisor:4, tracks:{
            lisans:{label:'Lisans · Genel Yetenek / Genel Kültür',duration:130,subjects:general},
            onlisans:{label:'Ön lisans · Genel Yetenek / Genel Kültür',duration:130,subjects:general},
            ortaogretim:{label:'Ortaöğretim · Genel Yetenek / Genel Kültür',duration:130,subjects:general},
            hukuk:{label:'Alan Bilgisi · Hukuk',duration:50,subjects:[subject('law','Hukuk',40)]},
            iktisat:{label:'Alan Bilgisi · İktisat',duration:50,subjects:[subject('economics','İktisat',40)]},
            isletme:{label:'Alan Bilgisi · İşletme',duration:50,subjects:[subject('business','İşletme',40)]},
            maliye:{label:'Alan Bilgisi · Maliye',duration:50,subjects:[subject('finance','Maliye',40)]},
            muhasebe:{label:'Alan Bilgisi · Muhasebe',duration:50,subjects:[subject('accounting','Muhasebe',40)]},
            kamu:{label:'Alan Bilgisi · Kamu Yönetimi',duration:50,subjects:[subject('administration','Kamu Yönetimi',40)]},
            uluslararasi:{label:'Alan Bilgisi · Uluslararası İlişkiler',duration:50,subjects:[subject('international','Uluslararası İlişkiler',40)]},
            calisma:{label:'Alan Bilgisi · Çalışma Ekonomisi',duration:50,subjects:[subject('labor','Çalışma Ekonomisi ve Endüstri İlişkileri',40)]},
            istatistik:{label:'Alan Bilgisi · İstatistik',duration:60,subjects:[subject('statistics','İstatistik',40)]},
            dhbt:{label:'Din Hizmetleri Alan Bilgisi (DHBT)',duration:60,subjects:[subject('dhbt1','DHBT 1',20),subject('dhbt2','DHBT 2',20)]}
        }},
        lgs: {label:'LGS',duration:155,durationLabel:'Sözel 75 + sayısal 80 dk',divisor:3,subjects:[
            subject('turkish','Türkçe',20,'verbal'),subject('revolution','T.C. İnkılap Tarihi ve Atatürkçülük',10,'verbal'),
            subject('religion','Din Kültürü ve Ahlak Bilgisi',10,'verbal'),subject('foreign','Yabancı Dil',10,'verbal'),
            subject('math','Matematik',20,'quantitative'),subject('science','Fen Bilimleri',20,'quantitative')
        ]},
        ydt: {label:'YDT',duration:120,divisor:4,subjects:[subject('foreign','Yabancı Dil',80)]},
        msu: {label:'MSÜ',duration:165,divisor:4,subjects:[subject('turkish','Türkçe',40),subject('social','Sosyal Bilimler',20),subject('math','Temel Matematik',40),subject('science','Fen Bilimleri',20)]},
        ales: {label:'ALES',duration:150,divisor:4,subjects:verbalQuantitative},
        yds: {label:'YDS',duration:180,divisor:0,tracks:{
            test:{label:'Çoktan seçmeli',subjects:[subject('foreign','Yabancı Dil',80)]},
            written:{label:'Yazılı çeviri',manual:true,note:'Yazılı çeviri sınavında doğru/yanlış neti hesaplanmaz. Değerlendirilmiş 0–100 sonucunu gir.'}
        }},
        yokdil: {label:'YÖKDİL',duration:180,divisor:0,tracks:{
            fen:{label:'Fen Bilimleri',subjects:[subject('foreign','Yabancı Dil · Fen Bilimleri',80)]},
            saglik:{label:'Sağlık Bilimleri',subjects:[subject('foreign','Yabancı Dil · Sağlık Bilimleri',80)]},
            sosyal:{label:'Sosyal Bilimler',subjects:[subject('foreign','Yabancı Dil · Sosyal Bilimler',80)]}
        }},
        dgs: {label:'DGS',duration:135,divisor:4,subjects:verbalQuantitative},
        dus: {label:'DUS',duration:150,divisor:4,subjects:[subject('basic','Temel Bilimler Testi',40),subject('clinical','Klinik Bilimler Testi',80)],note:'Temel bilimler ve klinik bilimler ayrı izlenir. Netler resmî T/K puanı değildir.'},
        eus: {label:'EUS',duration:110,divisor:4,subjects:[subject('professional','Mesleki Bilgi',75)],note:'75 soruluk mesleki bilgi testi. Konuların soru dağılımı değişebildiği için toplam test izlenir. 2025 kılavuzu esas alınmıştır.'},
        ydus: {label:'YDUS',divisor:4,tracks:{}},
        isg: {label:'İSG',duration:75,divisor:0,note:'Her sertifika türü ayrı izlenir. 2025 kılavuzu esas alınmıştır.',tracks:{}}
    };
    ['Acil Tıp','Anesteziyoloji ve Reanimasyon','Çocuk Sağlığı ve Hastalıkları','Genel Cerrahi','İç Hastalıkları','Kadın Hastalıkları ve Doğum'].forEach((label,i) => {
        catalog.ydus.tracks['test'+i] = {label,duration:80,subjects:[subject('specialty','Uzmanlık Alanı',60)]};
    });
    ['Fiziksel Tıp ve Rehabilitasyon','Göğüs Hastalıkları','Nöroloji','Ortopedi ve Travmatoloji','Radyoloji','Çocuk Cerrahisi','Deri ve Zührevi Hastalıkları','Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji','Halk Sağlığı','Kalp ve Damar Cerrahisi','Plastik, Rekonstrüktif ve Estetik Cerrahi','Tıbbi Mikrobiyoloji','Tıbbi Patoloji','Üroloji','Ruh Sağlığı ve Hastalıkları'].forEach((label,i) => {
        catalog.ydus.tracks['written'+i] = {label:label+' · Yazılı',duration:60,manual:true,note:`Açık uçlu sınav; en az ${i<5?20:10} soru. Doğru/yanlış neti hesaplanmaz. Değerlendirilmiş 0–100 sonucunu gir.`};
    });
    ['A Sınıfı İş Güvenliği Uzmanlığı','B Sınıfı İş Güvenliği Uzmanlığı','C Sınıfı İş Güvenliği Uzmanlığı','İş Yeri Hekimliği','Diğer Sağlık Personeli'].forEach((label,i) => {
        catalog.isg.tracks['certificate'+i] = {label,subjects:[subject('professional','Mesleki Bilgi',50)]};
    });
    const hasType = type => typeof type === 'string' && Object.hasOwn(catalog,type);
    const tracks = type => hasType(type) ? Object.keys(catalog[type].tracks || {}) : [];
    const defaultTrack = type => tracks(type)[0] || null;
    const validTrack = (type,track) => hasType(type) && (tracks(type).length ? tracks(type).includes(track) : track == null);
    const profile = (type,track) => hasType(type) ? {...catalog[type],...(catalog[type].tracks?.[track] || {})} : null;
    const net = (correct,wrong,type,track) => {const divisor=profile(type,track)?.divisor;return correct-(divisor?wrong/divisor:0);};
    const validSelection = value => Array.isArray(value) && value.length<=Object.keys(catalog).length && new Set(value).size===value.length && value.every(hasType);
    root.ProcatsExamData = Object.freeze({catalog,hasType,tracks,defaultTrack,validTrack,profile,net,validSelection});
})(globalThis);

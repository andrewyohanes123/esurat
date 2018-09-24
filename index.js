const express = require('express');
const app = express();
const http = require('http').Server(app);
const bodyParser = require('body-parser');
const crypto = require('crypto');
const token = require('jsonwebtoken');
const multer = require('multer');
const io = require('socket.io')(http);
const path = require('path');
const db = require('node-querybuilder').QueryBuilder({
  host: 'localhost',
  database: 'esurat',
  user: 'root',
  password: ''
},'mysql', 'single');
const cors = require('cors');
const qrcode = require('qrcode');
const merge = require('sharp');
const imgSize = require('image-size');
const pixel = require('get-image-pixels');
const fs = require('fs');
let token_secret = 'iy98hcbh489n38984y4h498';
const port = 8080;

const storage = multer.diskStorage({
  destination : './upload/file_surat',
  filename(req, file, cb) {
    cb(null, `${crypto.createHash('md5').update(`${file.originalname}-${Date.now()}`).digest('hex')}${path.extname(file.originalname)}`);
  }
});

const profileStorage = multer.diskStorage({
  destination : './upload/foto_profil',
  filename(req, file, cb) {
    cb(null, `${crypto.createHash('md5').update(`${file.originalname}-${Date.now()}`).digest('hex')}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage
});

const profile = multer({
  storage : profileStorage
});

// app.use(app.bodyParser({limit : '50mb'}));
app.use(bodyParser.json({limit: '1024mb'}));
app.use(bodyParser.urlencoded({extended : true, limit: '1024mb'}));
app.use(cors());
app.use('/api/images/', express.static('upload'));

app.get('/', (req, res) => {
  res.json({msg : 'Connected'});
});

app.get('/test', async (req, res) => {  
  const file = path.join(__dirname, 'upload/foto_profil/test.jpg');
  const file2 = path.join(__dirname, 'upload/foto_profil/test2.png');
  await merge(file)
  .resize(400, 400)
  .crop('center')
  .toFile(file2);

  await res.sendFile(file2);
});

app.post('/api/login', function(req, res){
  req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
  db.select('id, foto_profil, username, jabatan, skpd,nama_depan, nama_belakang, user_type').where(req.body).get('users', (err, result) => {
    if (err) throw err;
    var tkn = (result.length) ? token.sign({
      id : result[0].id,
      username : result[0].username,
      password : result[0].password
    }, token_secret) : '';
    (result.length) ? result[0].token = tkn : '';
    (result.length) ? res.json(result[0]) : res.json({'msg' : 'Username atau password salah'});
  });
});

app.get('/image', (req, res) => {
  res.sendFile(path.join(__dirname, 'upload/qrcode.png'));
});

app.use((req, res, next) => {
  var tkn = req.headers['x-access-token'] || req.body.token;
  if (tkn)
  {
    token.verify(tkn, token_secret, (err, decoded) => {
      if (!err) {
        req.decoded = decoded;
        next();
      } else {
        res.status(403).json({msg : 'invalid token'});
      }
    })
  }
  else
  {
    res.status(403).json({msg : 'invalid authentication'})
  }
});

app.get('/api/cek', (req, res) => {
  const tkn = req.headers['x-access-token'];
  const {id, username} = token.decode(tkn);
  db.where({ id, username}).get('users', (err, result) => {
    if (err) console.log(err);
    res.json(result);
  });
});

app.put('/api/update_user', (req, res)=> {
  if (!req.body.password) {
    delete req.body.password;
  } else {
    req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
  }
  
  const {id} = req.body;
  db.update('users', req.body, {id : id},(err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

app.get('/api/cek_jlh_surat_approved/:type/:id', (req, res) => {
  if (req.params.type === 'pimpinan')
  {
    db.where({'approved': 1,}).get('surat', (err, result) => {
      if (err) console.log(err);
  
      if (result) res.json({ jumlah : result.length });
    });
  }
  else if (req.params.type === 'skpd')
  {
    db.where({'approved': 1,user_id : req.params.id}).get('surat', (err, result) => {
      if (err) console.log(err);
  
      if (result) res.json({ jumlah : result.length });
    });
  }
});

app.get('/api/cek_jlh_surat_blm_approved/:type/:id', (req, res) => {
  if (req.params.type === 'pimpinan')
  {
    db.where({'approved': 0, ditolak : 0}).get('surat', (err, result) => {
      if (err) console.log(err);
  
      if (result) res.json({ jumlah : result.length });
    });
  }
  else if (req.params.type === 'skpd')
  {
    db.where({'approved': 0, ditolak : 0, user_id : req.params.id}).get('surat', (err, result) => {
      if (err) console.log(err);
  
      if (result) res.json({ jumlah : result.length });
    });
  }
});

app.get('/api/cek_jlh_surat_ditolak/:type/:id', (req, res) => {
  if (req.params.type === 'pimpinan')
  {
    db.where({ditolak : 1}).get('surat', (err, result) => {
      if (err) console.log(err);
  
      if (result) res.json({ jumlah : result.length });
    });
  }
  else if (req.params.type === 'skpd')
  {
    db.where({ditolak : 1, user_id : req.params.id}).get('surat', (err, result) => {
      if (err) console.log(err);
  
      if (result) res.json({ jumlah : result.length, result });
    });
  }
});

app.post('/api/buat_user/', (req, res) => {
  req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
  db.insert('users', req.body, (err, result) => {
    if (err) console.log(err);

    res.json(result);
  });
});

app.get('/api/get_user/:limit/:page', (req, res) => {
  const {limit, page} = req.params;
  let offset = (parseInt(page) - 1) * parseInt(limit);
  db.get('users', (err, result) => {
    if (err) console.log(result);
    db.limit(parseInt(limit), offset).get('users', (error, users) => {
      if (error) console.log(error);
      res.json({
        total : result.length,
        total_halaman : Math.ceil(result.length/parseInt(limit)),
        data : users
      });
    });
  });
});

app.delete('/api/hapus_user/:id', (req, res) => {
  const {id} = req.params;

  db.delete('users', {id}, (err, result) => {
    if (err) console.log(err);
    res.json(result);
  });
});

app.put('/api/update_profil', profile.single('foto_profil'), async (req, res) => {
  const file = path.join(__dirname, `upload/foto_profil/${req.file.filename}`);
  const file2 = path.join(__dirname, `upload/foto_profil/${req.file.filename}.png`);
  await merge(file).resize(400, 400).crop('center').toFile(file2);
  req.body.foto_profil = req.file.filename + ".png";
  const {id} = req.body;
  await db.update('users', req.body, {id: id}, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
})

app.post('/api/buat_surat', upload.array('file_surat'), (req, res) => {
  // req.body.file_surat = req.files;
  // res.json(req.files);
  req.body.approved = 0;
  req.body.action_by = 0;
  req.body.dibaca = 0;

  db.insert('surat', req.body, (err, result) => {
    if (err) return console.log(err);
    let files = [];
    for (i in req.files) {
      files.push({
        'file_surat.file_surat' : req.files[i].filename,
        id_surat : result.insertId
      });
    }
    
    db.insert_batch('file_surat', files, (err, results) => {
      if (err) return console.log(err);
      console.log(results.insert_id);
    });
    res.json(result);
  });
});

app.delete('/api/hapus_surat/:id', (req, res) => {
  const {id} = req.params;
  db.where('id_surat', id).get('file_surat', (err, result) => {
    if (err) console.log(err);
    if (result.length) {
      for (let i = 0; i < result.length; i++) {
        fs.unlink(path.join(__dirname,`upload/file_surat/${result[i].file_surat}`));
        result[i].approved_file !== null ? fs.unlink(path.join(__dirname,`upload/approved_file/${result[i].approved_file}`)) : '';
      }
    }
  });

  db.delete('surat', {id}, (err, result) => {
    if (err) console.log(err);
    res.json(result);
  });
});

app.put('/api/surat/update/:id', (req, res) => {
  const {id} = req.params;
  db.update('surat', req.body, {id}, (err, result) => {
    if (err) console.log(err);

    res.json(result);
  });
});

app.get('/api/cek_notifikasi', (req, res) => {
  db.select('dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
  .join('users', 'user_id = users.id')
  .limit(5)
  .order_by('id', 'desc')
  .get('surat', (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

app.get('/api/cek_notifikasi_skpd/:id', (req, res) => {
  db.select('subjek, ditolak, ditolak_by, surat.id, tanggal, tanggal_approved,users.nama_depan, users.nama_belakang, action_by')
  .join('users', 'action_by = users.id')
  .where({'user_id' : req.params.id, approved : 1})
  .or_where({ditolak : 1,})
  .limit(5)
  .order_by('surat.id', 'desc')
  .get('surat', (err, result) => {
    if (err) console.log(err);

    res.json(result);
  });
});

app.get('/api/jumlah_surat/:type/:id', (req, res) => {
  const {type, id} = req.params;
  if (type === 'pimpinan')
  {
    db.query(`select approved, ditolak, count(id) as jumlah from surat group by approved`, (err, result) => {
      if (err) console.log(`Jumlah surat error : ${err}`);
      (result) ? res.json(result) : res.json([
        { jumlah : 0, approved : 0},
        { jumlah : 0, approved : 1}
      ]);
    }); 
  }
  else if (type === 'skpd')
  {
    db.query(`select approved, count(id) as jumlah from surat where user_id = ${id} group by approved`, (err, result) => {
      if (err) console.log(`Jumlah surat error : ${err}`);
      (result) ? res.json(result) : res.json([
        { jumlah : 0, approved : 0},
        { jumlah : 0, approved : 1}
      ]);
    });
  }
});

app.get('/api/get_profile/:id', (req, res) => {
  db.select('id, foto_profil, username, jabatan, skpd,nama_depan, nama_belakang, user_type')
  .where('id', req.params.id)
  .get('users', (err, result) => {
    if (err) throw err;

    (result.length) ? res.json(result[0]) : res.json([]);
  });
});

app.get('/api/get_surat_by_id/:id', (req, res) => {
  db.select('nomor_surat, ditolak, ditolak_by, deskripsi_penolakan,deskripsi, file_surat.approved_file, file_surat.file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.username, users.nama_depan, users.nama_belakang, users.foto_profil, file_surat.id as id_file')
  .join('users', 'surat.user_id = users.id')
  .join('file_surat', 'surat.id = file_surat.id_surat')
  .where({'surat.id' : req.params.id})
  .order_by('file_surat.id', 'desc')
  .get('surat', (err, result) => {
    if (err) throw err;
    (result.length) ? res.json(result) : res.status(404).json({msg : 'Surat tidak ada'});
  });
});

app.post('/api/simpan_gambar', (req, res) => {
  const {data, imageName} = req.body;
  const buffer = Buffer.from(data.split(',')[1] , 'base64');
  merge(buffer)
  .jpeg({
    quality : 100,
    chromaSubsampling : '4:4:4'
  })
  .toFile(path.join(__dirname, `upload/file_surat/${path.basename(imageName)}.jpeg`), (err, info) => {
    if (err) console.log(`Error sharp : ${err}`);
  });  
  db.update('file_surat', {file_surat : `${path.basename(imageName)}.jpeg`}, {file_surat : imageName}, (err, result) => {
    res.json({
      msg : buffer,
      result
    });
  });
});

app.post('/api/approve_surat/', (req, res) => {
  // let qr = '';
  const {subjek,id, action_by, track} = req.body;
  // const pic = path.join(__dirname, `upload/${file_surat}`);
  
  qrcode.toFile(path.join(__dirname, `qrcode/qrcode.png`), id + '',{
    rendererOpts : {
      deflateLevel : 1
    }
  },(err) => {
    if (err) throw err;
    const date = new Date().toISOString();
    const tanggal_approved = `${date.split('T')[0]} ${date.split('T')[1].split('.')[0]}`;
    const approved_surat = {
      approved : 1,
      dibaca : 1,
      action_by,
      tanggal_approved
    };
    for (let i = 0; i < track.length; i++) {
      const img = path.join(__dirname, `upload/file_surat/${track[i].target}`);
      imgSize(img, async (err, dimensions) => {
        if (err) throw err;
        
        if (track[i].x !== 0 && track[i].y !== 0 && track[i].width !== 0 && track[i].height !== 0) {
          const qrHeight = Math.round(dimensions.height / (100/15));
          const qrWidth = qrHeight;
          const backHeight = Math.round(dimensions.height / (100/track[i].height));
          const backWidth = Math.round(dimensions.width / (100/track[i].width)) + 10;
          const signDimensions = await imgSize(path.join(__dirname, 'ttd/ttd.png'));
          const signWidth = Math.round(dimensions.width / (100/30));
          const signHeight = Math.round(signDimensions.height * (signWidth/signDimensions.width));
          await merge(path.join(__dirname, 'qrcode/qrcode.png')).resize(qrHeight, qrWidth)
          .toFile(path.join(__dirname, `qrcode/qrcode2.png`));

          await merge(path.join(__dirname, 'ttd/backdrop.jpg'))
          .resize(backWidth, backHeight)
          .toFile(path.join(__dirname, `ttd/backdrop.png`));

          await merge(path.join(__dirname, `ttd/ttd.png`))
          .resize(signWidth, signHeight)
          .toFile(path.join(__dirname, 'ttd/ttd2.png'))

          const top = (dimensions.height - (5 + qrHeight));
          const left = (dimensions.width - (5 + qrWidth));
          const pic1 = await merge(path.join(__dirname, `upload/file_surat/${track[i].target}`))
          .overlayWith(path.join(__dirname, 'ttd/backdrop.png'), {
            top : Math.round(dimensions.height / (100/track[i].y)),
            left : Math.round(dimensions.width / (100/track[i].x + 2))
          }).toBuffer();

          const pic2 = await merge(pic1)
          .overlayWith(path.join(__dirname, 'ttd/ttd2.png'), {
            top : Math.round(dimensions.height / (100/track[i].y)),
            left : Math.round(dimensions.width / (100/track[i].x))
          }).toBuffer();
          

          await merge(pic2)
          .overlayWith(path.join(__dirname, `qrcode/qrcode2.png`), {
            top,
            left
          })
          .jpeg({
            quality : 100,
            chromaSubsampling : '4:4:4'
          })
          .toFile(path.join(__dirname, `upload/approved_file/verified-${track[i].target}.jpeg`), (err, info) => {
            if (err) console.log(`Error sharp : ${err}`);
          });
        } else {
          await merge(img)
          .jpeg({
            quality : 100,
            chromaSubsampling : '4:4:4'
          })
          .toFile(path.join(__dirname, `upload/approved_file/verified-${track[i].target}.jpeg`), (err, info) => {
            if (err) console.log(`Error sharp : ${err}`);
          });
        }

        await db.update('file_surat', { approved_file : `verified-${track[i].target}.jpeg`}, { file_surat : track[i].target }, (err, result) => {
          if (err) return console.log(err);
          
          console.log(result);
        });
      });
    }
    db.update('surat', approved_surat, {id}, (err, result) => {
      if (err) return console.log(err);
      
      res.json(result);
    });
  });
  // res.send(qr);
});

app.put('/api/tolak_surat/:id', (req, res) => {
  const {deskripsi_penolakan, ditolak_by} = req.body;
  const tanggal_approved = `${date.split('T')[0]} ${date.split('T')[1].split('.')[0]}`;
  db.update('surat', {
    deskripsi_penolakan,
    action_by : ditolak_by,
    ditolak : 1,
    tanggal_approved
  }, {id : req.params.id}, (err, result) => {
    if (err) console.log(err);
    res.json({
      msg : 'success',
      result
    });
  });
});

app.get('/api/get_approved_surat/:id/:type/:page/:limit', (req, res) => {
  const {page, type, limit, id} = req.params;
  const {q} = req.query;
  let total = 1;
  let offset = (parseInt(page) - 1) *  (parseInt(limit));
  if (type == 'pimpinan') {
    db.where({'approved': 1}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;
      db.select('deskripsi, file_surat.approved_file, file_surat.file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .join('file_surat', 'surat.id = file_surat.id_surat')
      .where({'approved': 1})
      .like('subjek', q, 'both')
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
      .group_by('surat.id')
      .get('surat', (err, result) => {
        if (err) throw err; 
        res.json({
          data : result,
          total_halaman : Math.ceil(total/parseInt(limit))
        });
      });
    });
  } else if (type === 'skpd') {
    db.where({'user_id' : id , approved : 1}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;
      if (err) console.log(err); 
      db.select('deskripsi, file_surat.approved_file, file_surat.file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .join('file_surat', 'surat.id = file_surat.id_surat')
      .like('subjek', q, 'both')
      .where({'user_id' : id , approved : 1})
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
      .group_by('surat.id')
      .get('surat', (err, result) => {
        if (err) throw err;
        res.json({
          data : result,
          total_halaman : Math.ceil(total/parseInt(limit))
        });
      });
    });
  }
});

app.get('/api/get_surat_pending/:id/:type/:page/:limit', (req, res) => {
  const {page, type, limit, id} = req.params;
  const {q} = req.query;
  let total = 1;
  let offset = (parseInt(page) - 1) *  (parseInt(limit));
  if (type == 'pimpinan') {
    db.where({'approved': 0}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;      
      db.select('deskripsi, file_surat.approved_file, file_surat.file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .join('file_surat', 'surat.id = file_surat.id_surat')
      .like('subjek', q, 'both')
      .where({'approved': 0})
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
      .group_by('surat.id')
      .get('surat', (err, result) => {
        if (err) throw err; 
        res.json({
          data : result,
          total_halaman : Math.ceil(total/parseInt(limit))
        });
      });
    });
  } else if (type === 'skpd') {
    db.where({'user_id' : id , approved : 0}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;
      db.select('deskripsi, file_surat.approved_file, file_surat.file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .join('file_surat', 'surat.id = file_surat.id_surat')
      .like('subjek', q, 'both')
      .where({'users.id' : id , approved : 0})      
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
      .group_by('surat.id')
      .get('surat', (err, result) => {
        if (err) throw err;
        res.json({
          data : result,
          total_halaman : Math.ceil(total/parseInt(limit))
        });
      });
    });
  }
});

app.get('/api/get_surat_ditolak/:id/:type/:page/:limit', (req, res) => {
  const {page, type, limit, id} = req.params;
  const {q} = req.query;
  let total = 1;
  let offset = (parseInt(page) - 1) *  (parseInt(limit));
  if (type == 'pimpinan') {
    db.where({'ditolak': 1}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;      
      db.select('deskripsi, file_surat.approved_file, file_surat.file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, surat.ditolak, surat.ditolak_by,tanggal, users.nama_depan, users.nama_belakang, users.foto_profil, ditolak')
      .join('users', 'user_id = users.id')
      .join('file_surat', 'surat.id = file_surat.id_surat')      
      .where({'ditolak': 1})
      .like('subjek', q, 'both')
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
      .group_by('surat.id')
      .get('surat', (err, result) => {
        if (err) throw err; 
        res.json({
          data : result,
          total_halaman : Math.ceil(total/parseInt(limit))
        });
      });
    });
  } else if (type === 'skpd') {
    db.where({'user_id' : id , ditolak : 1}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;
      db.select('deskripsi, file_surat.approved_file, file_surat.file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil, ditolak')
      .join('users', 'surat.action_by = users.id')
      .join('file_surat', 'surat.id = file_surat.id_surat')      
      .where({'user_id' : id , 'surat.ditolak' : 1, 'surat.approved' : 0})  
      .like('surat.subjek', q, 'both')
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
      .group_by('surat.id')
      .get('surat', (err, result) => {
        if (err) throw err;
        res.json({
          data : result,
          total_halaman : Math.ceil(total/parseInt(limit)),
          params : req.params
        });
      });
    });
  }
});

app.put('/api/update_baca_surat/:id', (req, res) => {
  const {id} = req.params;
  db
  .update('surat', {dibaca : 1}, { id : id }, (err, result) => {
    if (err) console.log(err);
    res.json(result);
  });
});

http.listen(port, () => {
  console.log(`Listening to port ${port}`);
});

io.on('connection', (socket) => {
  socket.on('surat baru', (msg) => {
    socket.broadcast.to('pimpinan').emit('surat baru', (msg));
  });

  socket.on('approve surat', (data) => {
    const {username} = data.surat;
    socket.to(username + '').emit('approve surat', data)
  });

  socket.on('baca surat', (data) => {
    socket.broadcast.emit('baca surat', (data));
  });

  socket.on('tolak surat', (data) => {
    const {username} = data.surat;
    socket.to(username + '').emit('tolak surat', data);
  });

  socket.on('login', (user) => {
    if (user.user_type === 'pimpinan')
    {
      socket.join('pimpinan');
    }
    else
    {
      socket.join(user.username);
    }
  });

  socket.on('disconected', (msg) => {
    console.log('Someone is disconected');
  });
});
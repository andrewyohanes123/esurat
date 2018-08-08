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
  destination : './upload',
  filename(req, file, cb) {
    cb(null, `${crypto.createHash('md5').update(file.originalname).digest('hex')}.${file.originalname}`);
  }
});

const upload = multer({
  storage
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(cors());
app.use('/api/images/', express.static('upload'));

app.get('/', (req, res) => {
  res.json({msg : 'Connected'});
});

app.get('/test', async (req, res) => {  
  const pic = path.join(__dirname, 'upload/b997e0ff5c8521cf8b892fb6790b2a67.suratcontoh.png');
  const ttd = path.join(__dirname, 'ttd/ttd2.jpg');
  const dim = await imgSize(pic);
  const ttdSize = await imgSize(ttd);
  const resizePic = await merge(pic)
  .resize(track.img.width, track.img.height)
  .toBuffer()

  const pic1 = await merge(resizePic)
  .overlayWith(path.join(__dirname, 'ttd/backdrop.png'), {
    top : 590,
    left : 101
  }).toBuffer();

  const sign = await merge(ttd)
  .resize(
   Math.round(ttdSize.width / (100/21.5)),
    Math.round(ttdSize.height / (100/21.5)))
  .toBuffer();

  const pic2 = await merge(pic1)
  .overlayWith(sign, {
    top : 590,
    left : 101
  }).toFile(path.join(__dirname, 'upload/test.png'))

  await res.sendFile(path.join(__dirname, 'upload/test.png'));
});

app.get('/pix', (req, res) =>{
  const data = pixel(path.join(__dirname, 'upload/df37f5303a32e434e35fa1bd12bc1296.138277444-suratpeminjamansofamipa-1-638.jpg'));
  res.json(data);
})

app.post('/api/login', function(req, res){
  req.body.password = crypto.createHash('md5').update(req.body.password).digest('hex');
  db.select('id, foto_profil, username, jabatan, skpd,nama_depan, nama_belakang, user_type').where(req.body).get('users', (err, result) => {
    if (err) throw err;
    var tkn = (result.length) ? token.sign({
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
  res.json(req.session.user);
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

app.put('/api/update_profil', upload.single('foto_profil'), (req, res) => {
  req.body.foto_profil = req.file.filename;
  const {id} = req.body;
  db.update('users', req.body, {id: id}, (err, result) => {
    if (err) throw err;
    res.json(result);
  });
})

app.post('/api/buat_surat', upload.single('file_surat'), (req, res) => {
  req.body.file_surat = req.file.filename;
  db.insert('surat', req.body, (err, result) => {
    if (err) throw err;

    res.json(result);
  });
});

app.delete('/api/hapus_surat/:id', (req, res) => {
  const {id} = req.params;
  db.where('id', id).get('surat', (err, result) => {
    if (result.length) {
      fs.unlink(path.join(__dirname,`upload/${result[0].file_surat}`));
      result[0].approved_file_surat !== null ? fs.unlink(path.join(__dirname,`upload/${result[0].approved_file_surat}`)) : '';
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
  db.select('subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, approved_by')
  .join('users', 'approved_by = users.id')
  .where({'approved' : 1, 'surat.user_id' : req.params.id})
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
    db.query(`select approved, count(id) as jumlah from surat group by approved`, (err, result) => {
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
  db.select('nomor_surat, deskripsi, approved_file_surat, file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.username, users.nama_depan, users.nama_belakang, users.foto_profil')
  .join('users', 'surat.user_id = users.id')
  .where({'surat.id' : req.params.id})
  .get('surat', (err, result) => {
    if (err) throw err;
    (result.length) ? res.json(result[0]) : res.status(404).json({msg : 'Surat tidak ada'});
  });
});

app.post('/api/approve_surat/', (req, res) => {
  // let qr = '';
  const {subjek, file_surat,id, approved_by, track} = req.body;
  const pic = path.join(__dirname, `upload/${file_surat}`);
  
  qrcode.toFile(path.join(__dirname, `qrcode/qrcode.png`), id + '',{
    rendererOpts : {
      deflateLevel : 1
    }
  },(err) => {
    if (err) throw err;
    const date = new Date().toISOString();
    const tanggal_approved = `${date.split('T')[0]} ${date.split('T')[1].split('.')[0]}`;
    const approved_surat = {
      approved_file_surat : `verified-${file_surat}.png`,
      approved : 1,
      dibaca : 1,
      approved_by,
      tanggal_approved
    };
    imgSize(pic, async (err, dimensions) => {
      if (err) throw err;
      const qrHeight = Math.round(dimensions.height / (100/15));
      const qrWidth = qrHeight;
      const backHeight = Math.round(dimensions.height / (100/track.height));
      const backWidth = Math.round(dimensions.width / (100/track.width)) + 10;
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
      // .toBuffer()
      .toFile(path.join(__dirname, 'ttd/ttd2.png'))

      const top = (dimensions.height - (5 + qrHeight));
      const left = (dimensions.width - (5 + qrWidth));
      
      const pic1 = await merge(path.join(__dirname, `upload/${file_surat}`))
      .overlayWith(path.join(__dirname, 'ttd/backdrop.png'), {
        top : Math.round(dimensions.height / (100/track.y)),
        left : Math.round(dimensions.width / (100/track.x + 2))
      }).toBuffer();

      const pic2 = await merge(pic1)
      .overlayWith(path.join(__dirname, 'ttd/ttd2.png'), {
        // .overlayWith(ttd, {
        top : Math.round(dimensions.height / (100/track.y)),
        left : Math.round(dimensions.width / (100/track.x))
      }).toBuffer();
      

      await merge(pic2)
      .overlayWith(path.join(__dirname, `qrcode/qrcode2.png`), {
        top,
        left
      })
      .toFile(path.join(__dirname, `upload/verified-${file_surat}.png`), (err, info) => {
        if (err) console.log(`Error sharp : ${err}`);
      });

      await db.update('surat', approved_surat, {id}, (err, result) => {
        if (err) throw err;
        
        res.json(result);
      });
    });
  });
  // res.send(qr);
});

app.get('/api/get_approved_surat/:id/:type/:page/:limit', (req, res) => {
  const {page, type, limit, id} = req.params;
  let total = 1;
  let offset = (parseInt(page) - 1) *  (parseInt(limit));
  if (type == 'pimpinan') {
    db.where({'approved': 1}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;
      db.select('deskripsi, approved_file_surat, file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .where({'approved': 1})
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
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
      db.select('deskripsi, approved_file_surat, file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .where({'user_id' : id , approved : 1})
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
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
  let total = 1;
  let offset = (parseInt(page) - 1) *  (parseInt(limit));
  if (type == 'pimpinan') {
    db.where({'approved': 0}).get('surat', (err, result) => {
      total = (result) ? result.length : 0;      
      db.select('deskripsi, approved_file_surat, file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .where({'approved': 0})
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
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
      db.select('deskripsi, approved_file_surat, file_surat, tujuan, surat.skpd, approved, dibaca, subjek, surat.id, tanggal, users.nama_depan, users.nama_belakang, users.foto_profil')
      .join('users', 'user_id = users.id')
      .where({'users.id' : id , approved : 0})
      .limit(parseInt(limit), offset)
      .order_by('surat.id', 'desc')
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
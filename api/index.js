const express = require('express');
const cors = require('cors');
const { mongoose } = require('mongoose');
const User = require('./models/User')
const Post = require('./models/Post')
const bodyParser = require("body-parser")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs')

const app = express();

const salt = bcrypt.genSaltSync(10);
const secret = 'hebjhbhvrh322vrh3L'

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
app.use('/uploads', express.static(__dirname + '/uploads'))

mongoose.connect('mongodb+srv://blog:helloKitty@cluster0.4i7nl7h.mongodb.net/?retryWrites=true&w=majority')

app.get('/test', (req, res) => {
    res.json('test ok')
})

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.create({ username, password: bcrypt.hashSync(password, salt) });
        res.json(userDoc)
    }
    catch (e) {
        console.log(e)
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.findOne({ username });
        const passCheck = bcrypt.compareSync(password, userDoc.password);
        // res.json(passCheck)
        if (passCheck) {
            jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
                if (err) throw err;
                // storing the data in form of cookies
                res.cookie('token', token).json({
                    id: userDoc._id,
                    username,
                })
            })
        }
        else {
            res.status(400).json('wrong credentials')
        }
    }
    catch (e) {
        console.log(e)
    }
})

app.get('/profile', (req, res) => {
    const { token } = req.cookies

    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err
        res.json(info)
    })
})

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok')
})

app.post('/post', upload.single('file'), async (req, res) => {
    // res.json({ files: req.file })

    // taking orignal name & path of the image from checking network and splitting it orig name extension(like jpg, png) and adding to path of the image obtained to able to see it by renaming it using fs funct

    const { originalname } = req.file
    const { path } = req.file
    const parts = originalname.split('.')
    const ext = parts[parts.length - 1]
    const newPath = path + '.' + ext
    fs.renameSync(path, newPath)
    // res.json({ ext })

    const { token } = req.cookies

    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err
        const { title, content, summary } = req.body
        const postDoc = await Post.create({
            title: title,
            summary: summary,
            content: content,
            cover: newPath,
            author: info.id
        })
        res.json(postDoc)
    })
})

app.get('/post', async (req, res) => {
    res.json(await Post.find().populate('author', ['username']).sort({ createdAt: -1 }).limit(15))
})

app.get('/post/:id', async (req, res) => {
    const { id } = req.params
    const resp = await Post.findById(id).populate('author', ['username'])
    res.json(resp)
})

app.put('/post', upload.single('file'), async (req, res) => {
    let newPath = null
    if (req.file) {
        const { originalname } = req.file
        const { path } = req.file
        const parts = originalname.split('.')
        const ext = parts[parts.length - 1]
        newPath = path + '.' + ext
        fs.renameSync(path, newPath)
    }
    const { token } = req.cookies

    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err
        const { id, title, content, summary } = req.body
        const postDoc = await Post.findById(id)
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('you are not the author');
        }

        try {
            const updateDoc = await postDoc.updateOne({
                title,
                summary,
                content,
                cover: newPath ? newPath : postDoc.cover,
            })
            res.json(updateDoc)
            // await postDoc.update({
            //     title,
            //     summary,
            //     content,
            //     cover: newPath ? newPath : postDoc.cover,
            // });
            // console.log(updateDoc)
            // if (updateDoc.modifiedCount > 0) {
            //     res.json({ status: 200 });
            // }
            // else {
            //     res.json({ status: 400 })
            // }
        }
        catch (error) {
            console.log(error)
        }
    })
})

app.listen(4000, () => {
    console.log("lsitening to port 4000...")
});


// mongodb+srv://blog:helloKitty@cluster0.4i7nl7h.mongodb.net/?retryWrites=true&w=majority
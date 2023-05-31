const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const sessions = require('express-session');
const fileUpload = require('express-fileupload');
const fastcsv = require('fast-csv');
const dotenv = require("dotenv");

//use twig as template rendering engine
const twig = require('twig');
app.set('view engine', 'twig');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(fileUpload({}));
dotenv.config();

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
//set locals for twig
app.use((req, res, next) => {
    if (req.session?.user) {
        res.locals.user = req.session?.user;
        next();
    } else {
        //check if url is login
        if (req.url === '/login') {
            next();
        } else {
            res.redirect('/login');
        }
    }
});

const loginRouter = require('./routes/login/login.js');
app.use('/login', loginRouter);

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

const adminRouter = require('./routes/admin/admin.js');
app.use('/admin', adminRouter);

const frontRouter = require('./routes/front/front.js');
app.use('/', frontRouter);

app.listen(port, () => {
    console.log(`Application running on http://localhost:${port}`);
});


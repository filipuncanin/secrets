
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// ===================
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// ===================

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session({
    secret: "Out little secret.",
    resave: false,
    saveUninitialized: false,
    
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', true);     // Disable DeprecationWarning
mongoose.connect('mongodb+srv://filipu:filip123@cluster0.hnfrjsa.mongodb.net/userDB');	
//mongoose.connect('mongodb://0.0.0.0:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res) {
    res.render('home');
});

app.get('/login', function(req, res) {
    res.render('login');
});

app.get('/register', function(req, res) {
    res.render('register');
});

app.get('/secrets', function(req, res) {
    User.find({'secret': {$ne:null}}, function(err, foundUsers) {
        if(err) {
            console.log(err);
        } else {
            res.render('secrets', {
                usersWithSecrets: foundUsers
            });
        }
    });
});

app.get('/submit', function(req, res) {
    if(req.isAuthenticated()) {
        res.render('submit');
    } else {
        res.redirect('/login');
    }
});

app.post('/submit', function(req, res) {
    const submittedSecret = req.body.secret;
    User.findByIdAndUpdate(req.user.id, { secret: submittedSecret }, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("Secret added.");
            res.redirect('/secrets');
        }
    });
});

app.get('/logout', function(req, res) {
    req.logout(function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect('/');
        }
    });
});

app.post('/register', function(req, res) {
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/secrets');
            });
        }
    });
});

app.post('/login', function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate('local')(req, res, function() {
                res.redirect('/secrets');
            });
        }
    });
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Server is running.');
});
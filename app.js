const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongo = require('mongodb');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/AdvancedDatabase', { useNewUrlParser: true });
const db = mongoose.connection;

const routes = require('./routes/unauth_routes');
const auth = require('./routes/auth_routes');
const confirmed = require('./routes/confirmed_routes');
const admin = require('./routes/admin_routes');
const payment = require('./routes/payment_routes');

//Start
const app = express();

//Start view
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({
    defaultLayout: 'defaultLayout',
    helpers: require("./views/layouts/helpers.js").helpers,
}));
app.set('view engine', 'handlebars');


//Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Static folder
app.use(express.static(path.join(__dirname, 'public')));

//Session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

//Passport
app.use(passport.initialize());
app.use(passport.session());

//Validator
app.use(expressValidator({
    errorFormatter: (param, msg, value) => {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));

//Flash
app.use(flash());

//Global
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

const checkAuthentication = (req, res, next) => req.isAuthenticated() ? next() : res.redirect("/login");

const checkAdmin = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.role == "admin") {
            next();
        } else {
            req.flash('error_msg', 'Nie masz uprawnień do tych zasobow');
            res.redirect('/auth/panel');
        }
    } else {
        res.redirect("/login");
    }
}

const checkPaymentMode = (req, res, next) => {
    if (req.isAuthenticated() && req.session.payment_mode == true) next();
    else {
        req.flash('error_msg', 'Nie tak szybko hackerze. Nie na warcie Martenzytycznego Mściciela!');
        res.redirect('/');
    }
}

const checkConfirmation = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.role == "confirmed" || req.user.role == "admin") next();
        else {
            req.flash('error_msg', 'Musisz byc zweryfikowany aby moc wykonac tą czynnośc');
            res.redirect('/auth/panel');
        }
    } else res.redirect("/login");
}

//Routes
app.use('/', routes);
app.use('/auth', checkAuthentication, auth);
app.use('/confirmed', checkConfirmation, confirmed);
app.use('/admin', checkAdmin, admin);
app.use('/payment', checkPaymentMode, payment);

//Port
app.set('port', (process.env.PORT || 3001));
app.listen(app.get('port'), () => {
    console.log('Server started on port ' + app.get('port'));
});
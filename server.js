const express       = require('express');
const app           = express();
const body_parser   = require('body-parser');
const cors          = require('cors');
const { store }     = require('./store');
const { utils }     = require('./utils');

app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(cors({
    origin: [
        'http://127.0.0.1:1255',
        'http://localhost:8000',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
    ]
}));
let port = process.env.PORT || 8888;

let router = express.Router();

// -=-=-=-=-=-=-=-=-=-=-=-=-= API LIST =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

router.get('/api/accounts', utils.verify_token, (req, res) => {
    store.get_accounts().then(data => res.json({
        error: '', accounts: data.rows
    }))
    .catch(er => {
        console.log('error fetching accounts from db!:', er);
        res.json({
            error: 'try again', accounts: []
        });
    })
})

router.get('/api/accounts_agregate', utils.verify_token, (req, res) => {
    store.get_accounts_aggregate().then(data => res.json(data))
    .catch(er => {
        console.log('error fetching accounts aggregate from db!:', er);
        res.json(er);
    })
})

router.get('/api/accounts_by_name', utils.verify_token, (req, res) => {
    // console.log('searching by name: ', req.query);
    store.get_accounts_by_name(req.query.name).then(data => res.json({
        error: '', accounts: data.rows
    }))
    .catch(er => {
        console.log('error fetching accounts from db!:', er);
        res.json({
            error: 'try again', accounts: []
        });
    })
})

router.get('/api/accounts_by_acc_id', utils.verify_token, (req, res) => {
    store.get_accounts_by_acc_id(req.query.acc_id).then(data => res.json({
        error: '', accounts: data.rows
    }))
    .catch(er => {
        console.log('error fetching accounts from db!:', er);
        res.json({
            error: 'try again', accounts: []
        });
    })
})

router.get('/api/account_by_id', utils.verify_token, (req, res) => {
    store.get_account_by_id(req.query.acc_id).then(data => res.json({
        error: '', account: data.account
    }))
    .catch(er => {
        console.log('error fetching accounts from db!:', er);
        res.json({
            error: 'try again', account: null
        });
    })
})
router.get('/api/delete_account_by_id', utils.verify_token, (req, res) => {
    store.delete_account_by_id(req.query.acc_id).then(data => res.json({
        error: '', account: data.account
    }))
    .catch(er => {
        console.log('error fetching accounts from db!:', er);
        res.json({
            error: 'try again', account: null
        });
    })
})

router.post('/api/add_account', utils.verify_token, (req, res) => {
    // console.log('post request insert')
    store.add_account(req.body).then(d => res.json({
        error: '', message: 'added successfully!', acc_id: d.acc_id,
    }))
    .catch(er => {
        console.log('error adding account into db!:', er);
        res.json({
            error: 'something went wrong. plz try again!',
        });
    })
})

router.post('/api/update_account_by_id', utils.verify_token, (req, res) => {
    // console.log('post request update')
    store.update_account(req.body).then(d => res.json({
        error: '', message: 'updated successfully!', acc_id: d.acc_id,
    }))
    .catch(er => {
        console.log('error updating account!:', er);
        res.json({
            error: 'something went wrong. plz try again!',
        });
    })
});

router.post('/api/auth_user', (req, res) => {
    let user = req.body;
    // console.log('auth_user data:', user);
    store.is_user_valid(user).then(dat => {
        // console.log('is user valid:', dat.is_valid);
        if(dat.is_valid) {
            let d = {token: utils.get_token(user)};
            store.update_user(d, user.mail_id).then(d => console.log('updated user!'))
            .catch(er => console.log('error updating the user!', er));
            res.json(d);
        }
        else {
            res.status(500).send('access denied!');
        }
    })
    .catch(er => console.log('error:', er));
})

app.use('/', router);

function start_server() {
    app.listen(port);
    console.log('listening on port: ' + port);
}

start_server();

module.exports = {
    start_server,
}
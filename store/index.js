const sqlite3       = require('sqlite3');
const path          = require('path');
const { normalize } = require('./utils');

const db_path = path.resolve(path.join(__dirname, 'db'), 'jms_1.db');
let db = new sqlite3.Database(db_path, sqlite3.OPEN_READWRITE, err => {
    if (err) {
        console.error(err.message);
    }
    else {
        console.log('Connected to the jms database.');
        db.run(`CREATE TABLE IF NOT EXISTS 
            User(
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                mail_id TEXT UNIQUE NOT NULL, 
                pass_code TEXT NOT NULL,
                token TEXT,
                updated_on INTEGER
            )`
        );
        db.run(`CREATE TABLE IF NOT EXISTS Transactions(
            tx_id         INTEGER NOT NULL UNIQUE,
            dated         INTEGER,
            description   TEXT,
            credit          REAL DEFAULT 0.0,
            debit   REAL DEFAULT 0.0,
            balance       REAL DEFAULT 0.0,
            updated_on    INTEGER,
            priority    INTEGER,
            acc_id        INTEGER NOT NULL,
            PRIMARY KEY(tx_id AUTOINCREMENT),
            FOREIGN KEY(acc_id) REFERENCES Accounts(acc_id) ON UPDATE CASCADE ON DELETE CASCADE
        )`
        );
        db.run(`CREATE TABLE IF NOT EXISTS Accounts(
            acc_id        INTEGER NOT NULL UNIQUE,
            name          TEXT,
            credit_total     REAL DEFAULT 0.0,
            debit_total     REAL DEFAULT 0.0,
            balance_total     REAL DEFAULT 0.0,
            deleted       INTEGER DEFAULT 0,
            updated_on    INTEGER,
            added_by      TEXT,
            phone         TEXT,
            address       TEXT,
            PRIMARY KEY(acc_id AUTOINCREMENT)
        )`
        );
    }
});

let acc_cols = ['name', 'credit_total', 'debit_total', 'balance_total', 'updated_on', 'added_by', 'phone', 'address'];	
let tx_cols = ['dated', 'description', 'credit', 'debit', 'balance', 'updated_on', 'priority', 'acc_id'];

function _insert_transactions(txs, acc_id, resolve, reject) {
    tc = tx_cols;
    
    let q = `INSERT INTO Transactions(${tc.join(',')}) VALUES ${txs.map(item => `(${tc.map(c => `'${item[c]}'`).join(',')})`).join(',')}`
        
    //console.log('multiple insert query:', q);
    
    db.run(q, [], function(err) {
        if (err) {
            console.log('error inserting item into Transactions table:', err);
            reject({error: !0, message: err.message});
            return;
        }
        
        // finally!
        resolve({acc_id});
    });
}

function _get_new_amounts(old, nw) {
    
    return nw;
}

function _add_account(account, resolve, reject) {
	let d = [], q = '';
	let updated_on = Math.floor(Date.now()/1000);
    account.updated_on = updated_on;
    console.log('Add Account');
    account = _get_new_amounts(null, account);
    d = acc_cols.map(c => account[c]);
    q = `INSERT INTO Accounts(${acc_cols.join(',')}) VALUES(${acc_cols.map(ac => `'${account[ac]}'`).join(',')})`;
    
    //console.log('insert query:', q);

	db.run(q, [], function(err) {
		if (err) {
			console.log('error inserting into table accounts:', err);
			return reject({ // reject if account not added!
					err: !0,
					msg: err.message
			});
		}
		
        let acc_id = this.lastID;
		console.log(`A row inserted in accounts table with rowid ${acc_id}`);
        
        d = account.txs.map(item => {
            return {
                ...item, acc_id, updated_on,
            }
        });
        
        _insert_transactions(d, acc_id, resolve, reject);        
	})
      
}

function _update_account_internal(account, resolve, reject) {
    updated_on = Math.floor(Date.now()/1000);
    account['updated_on'] = updated_on;
    let q = `UPDATE Accounts SET ${acc_cols.map(a => `${a}='${account[a]}'`).join(',')} WHERE acc_id=${account.acc_id}`;
    let acc_id = account.acc_id;
    //console.log('update data:');
    
	db.run(q, [], function(err) {
		if (err) {
			console.log('error updating account:', err);
			return reject({ // reject if account not added!
					err: !0,
					msg: err.message
			});
		}
        
		console.log(`A row updated in account table with rowid ${acc_id}`);

        function update_tx(i) {
            let d = account.txs[i];
            d['acc_id'] = acc_id;
            q = `UPDATE Transactions SET ${tx_cols.map(c => `${c}='${d[c]}'`)} WHERE tx_id=${d.tx_id}`
            db.run(q, [], function(err) {
                if (err) {
                    console.log('error inserting tx into Transactions table:', err);
                    return;
                }
                if(i !== account.txs.length-1) update_tx(i+1);
            });
        }
        
        account.txs.length > 0 && update_tx(0)
        
        // now lets delete txs if any
        if(account.removed_tx_ids.length) {
            q = `DELETE FROM Transactions WHERE tx_id in (${account.removed_tx_ids.join(',')})`
            db.run(q, [], function(err) {
                if (err) console.log('error deleting txs from Transactions table:', err);
            });
        }

        if(account.new_inserts.length) {
            account.new_inserts = account.new_inserts.map(tx => {
                return {
                    ...tx, acc_id, updated_on,
                }
            })
            _insert_transactions(account.new_inserts, acc_id, resolve, reject);
        } else resolve({acc_id});
	})
}

function _update_account(account, resolve, reject) {
    console.log('Update account');
	let old_acc = new Promise((r, j) => _get_account_by_id(account.acc_id, r, j));
    old_acc.then(old => {
        account = _get_new_amounts(old, account);
        _update_account_internal(account, resolve, reject);
    })
    .catch(e => {
        reject({
            err: !0,
            msg: 'could not get account with that id'
        })
    })
}

function _get_account_by_id(id, resolve, reject) {
    let q = `SELECT ${acc_cols.map(a => `a.${a}`).join(',')},${tx_cols.map(i => `tx.${i}`).join(',')},tx.tx_id tx_id FROM Accounts a JOIN Transactions tx ON a.acc_id = tx.acc_id WHERE a.acc_id=${id} AND NOT a.deleted ORDER BY tx.priority`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an Account:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched an Account with id ${id}.`);
        resolve({
            err: !1,
            account: normalize(rows, [...acc_cols], [...tx_cols]),
        });
      });
}

function _delete_account_by_id(id, resolve, reject) {
    let q = `UPDATE Accounts SET deleted=1 WHERE acc_id=${id}`;
    db.run(q, [], function(err) {
        if (err) {
            console.log('error deleting Account:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        q = `UPDATE Transactions SET deleted=1 WHERE acc_id=${id}`;
        db.run(q, [], err => {
            if (err) {
                console.log('error deleting Account:', err);
                return reject({
                    err: !0,
                    msg: err.message
                });
            }
            console.log(`Successfully deleted an Account with id ${id}.`);
            resolve({
                err: !1,
                message: 'Deletion Success!',
            });
        })       
      });
}

function _get_accounts(resolve, reject) {
    let q = `SELECT * FROM Accounts where NOT deleted ORDER BY acc_id`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an Account:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched Accounts. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _get_accounts_aggregate(resolve, reject) {
    let q = `SELECT debit_total, credit_total FROM Accounts where NOT deleted`;
    db.all(q, [], function(err, accs) {
        if (err) {
            console.log('error querying an Account:', err);
            return reject({
                error: !0,
                message: err.message
            });
        }
        console.log(`Successfully fetched Accounts. count:` + accs.length);
        let data = {
            overall_credit: 0.0,
            overall_debit: 0.0,
        };
        accs.forEach(acc => {
            data.overall_credit += acc.credit_total;
            data.overall_debit += acc.debit_total;
        });
        resolve({
            error: !1,
            ...data,
        });
      });
}

function _get_accounts_by_name(name, resolve, reject) {
    let q = `SELECT * FROM Accounts WHERE name like '%${name}%' AND NOT deleted ORDER BY acc_id`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an Account:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched Accounts. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _get_accounts_by_acc_id(acc_id, resolve, reject) {
    let q = `SELECT * FROM Accounts WHERE acc_id like '%${acc_id}%' AND NOT deleted ORDER BY acc_id`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an Account:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched Accounts. count:` + rows.length);
        resolve({
            err: !1,
            rows,
        });
      });
}

function _is_user_valid(user, resolve, reject) {
    let q = `SELECT * FROM User WHERE mail_id='${user.mail_id}' and pass_code='${user.pass_code}'`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an user:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched user. count:` + rows.length);
        resolve({
            err: !1,
            is_valid: rows.length ? true : false,
        });
      });
    //   db.close();
}

function _is_token_valid(token, resolve, reject) {
    let q = `SELECT * FROM User WHERE token='${token}' AND not disabled`;
    db.all(q, [], function(err, rows) {
        if (err) {
            console.log('error querying an user:', err);
            return reject({
                err: !0,
                msg: err.message
            });
        }
        console.log(`Successfully fetched user. count:`, rows.length);
        resolve({
            err: !1,
            is_valid: rows.length ? true : false,
        });
      });
    //   db.close();
}

function _update_user(data, mail, resolve, reject) {
    data.updated_on = Math.floor(Date.now()/1000);
    let cols = Object.keys(data);
    let q = `UPDATE User SET ${cols.map(c => `${c}=?`).join(',')} WHERE mail_id='${mail}'`;
    db.run(q, cols.map(c => data[c]) , function(err) {
      if (err) {
        console.log('error updating user:', err);
        return reject({
            err: !0,
            msg: err.message
        });
      }
    //   console.log(`Row(s) updated: ${this.changes}`);
      console.log(`Row(s) updated successfully!`);
      resolve();
    });
}

const store = {
    add_account: d => new Promise((r, j) => _add_account(d, r, j)),
    update_account: d => new Promise((r, j) => _update_account(d, r, j)),
    get_account_by_id: acc_id => new Promise((r, j) => _get_account_by_id(acc_id, r, j)),
    delete_account_by_id: acc_id => new Promise((r, j) => _delete_account_by_id(acc_id, r, j)),
    get_accounts: _ => new Promise((r, j) => _get_accounts(r, j)),
    get_accounts_aggregate: _ => new Promise((r, j) => _get_accounts_aggregate(r, j)),
    get_accounts_by_name: n => new Promise((r, j) => _get_accounts_by_name(n, r, j)),
    get_accounts_by_acc_id: bn => new Promise((r, j) => _get_accounts_by_acc_id(bn, r, j)),
    is_user_valid: u => new Promise((r, j) => _is_user_valid(u, r, j)),
    is_token_valid: t => new Promise((r, j) => _is_token_valid(t, r, j)),
    update_user: (d, m) => new Promise((r, j) => _update_user(d, m, r, j)),
};
module.exports = {
    store
}




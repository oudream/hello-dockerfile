'use strict';

exports = module.exports = HttpSqlite3Server;


let http = require('http');

let sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':memory:');

/**
 * Class HttpSqlite3Server
 * @constructor
 * @param option = {
    dbFilePath: ':memory:',
    user: 'root',
    password: '123456',
    database: 'db1',
}
 */
function HttpSqlite3Server(option) {
    this._option = {
        dbFilePath: option.dbFilePath ? option.dbFilePath : ':memory:',
        user: option.user ? option.user : 'root',
        password: option.password ? option.password : '123456',
        database: option.database ? option.database : 'db1',
    };
    this._db = new sqlite3.Database(this._option.dbFilePath);
    console.log('Create sqlite3 by option : ', this._option);
}

HttpSqlite3Server.prototype.close = function() {
    if (this._db !== null) {
        this._db.close();
        this._db = null;
    }
};

HttpSqlite3Server.prototype.getOption = function () {
    return this._option;
};

HttpSqlite3Server.prototype.isOpen = function () {
    return this._db;
};

/**
 * HttpSqlite3Server.prototype.query
 * @param {String} sql
 * @param {function} callback
 */
HttpSqlite3Server.prototype.query = function (sql, callback) {
    this._pool.getConnection(function(err, connection) {
        if (err) {
            console.log('HttpSqlite3Server-query: ', err);
            if (callback) {
                callback(err);
            }
            return;
        }
        // let sql = 'SELECT id,name FROM users';
        connection.query(sql, [], function(err, values, fields) {
            connection.release(); // always put connection back in pool after last query
            if (err) {
                console.log('HttpSqlite3Server-query: ', err);
                if (callback) {
                    callback(err);
                }
                return;
            }
            if (callback) {
                callback(false, values, fields);
            }
        });
    });
};

HttpSqlite3Server.prototype.querySql = function (sql, vs, callback) {
    this._pool.getConnection(function(err, connection) {
        if (err) {
            console.log('HttpSqlite3Server-query: ', err);
            if (callback) {
                callback(err);
            }
            return;
        }
        // let sql = 'SELECT id,name FROM users';
        connection.query(sql, vs, function(err, values, fields) {
            connection.release(); // always put connection back in pool after last query
            if (err) {
                console.log('HttpSqlite3Server-query: ', err);
                if (callback) {
                    callback(err);
                }
                return;
            }
            if (callback) {
                callback(false, values, fields);
            }
        });
    });
};

/**
 * HttpSqlite3Server.prototype.queryPromise
 * @param {HttpSqlite3Server} dbMysql
 * @param {String} sql
 * @param {Array} values
 * @return {Array}
 */
HttpSqlite3Server.prototype.queryPromise = function(sql, values) {
    return new Promise((resolve, reject) => {
        this._pool.getConnection(function(err, connection) {
            if (err) {
                reject(err);
            } else {
                connection.query(sql, values, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                    connection.release();
                });
            }
        });
    });
};

HttpSqlite3Server.prototype._promiseQueryQueue1 = function(executors) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(executors)) {
            executors = Array.from(executors)
        }
        if (executors.length <= 0) {
            return resolve([])
        }

        let rs = [];
        executors = executors.map((x, i) => () => {
            let p = typeof x === 'function' ? new Promise(x) : Promise.resolve(x);
            p.then(msg => {
                rs[i] = msg;
                if (msg.err !== null || i === executors.length - 1) {
                    resolve(rs);
                } else {
                    executors[i + 1]()
                }
            }, reject)
        });
        executors[0]();
    })
};

HttpSqlite3Server.prototype._promiseQueryQueue2 = function(executors) {
    return new Promise((resolve, reject) => {
        if (!Array.isArray(executors)) {
            executors = Array.from(executors)
        }
        if (executors.length <= 0) {
            return resolve([])
        }

        let rs = [];
        executors = executors.map((x, i) => () => {
            let p = typeof x === 'function' ? new Promise(x) : Promise.resolve(x);
            p.then(msg => {
                rs[i] = msg;
                if (i === executors.length - 1) {
                    resolve(rs);
                } else {
                    executors[i + 1]()
                }
            }, reject)
        });
        executors[0]();
    })
};

/**
 *
 * @param sqlAry
 * @param sqlValuesAry
 * @param callback
 */
HttpSqlite3Server.prototype.queryTrans = function(sqlAry, sqlValuesAry, callback) {
    if (! Array.isArray(sqlAry) || sqlAry.length < 1) {
        if (callback) {
            callback(new Error('sqlAry invalid!'));
        }
        return;
    }
    let sqlValuesAry2 = Array.isArray(sqlValuesAry) && sqlValuesAry.length === sqlAry.length ? sqlValuesAry : sqlAry.map(x => []);

    this._pool.getConnection((err, connection) => {
        if (err) {
            if (callback) {
                callback(err);
            }
            return;
        }

        let querySql = (sql, sqlValues) => {
            return resolve => {
                connection.query(sql, sqlValues, (err, values, fields) => {
                    resolve({err:err, values:values, fields:fields});
                });
            }
        };

        connection.beginTransaction(err => {
            if (err) {
                connection.release();
                if (callback) {
                    callback(err);
                }
                return;
            }

            let querySqlFns = [];
            for (let i = 0; i < sqlAry.length; i++) {
                querySqlFns.push(querySql(sqlAry[i], sqlValuesAry2[i]));
            }
            let queryQueueCallback = (rs) => {
                let err = Array.isArray(rs) && rs.length > 0 ? rs[rs.length - 1].err : null;
                if (! err) {
                    connection.commit(err2 => {
                        if (err2) {
                            connection.rollback((err3)=>{
                                connection.release();
                                if (callback) {
                                    callback(err2, rs);
                                }
                            });
                        } else {
                            connection.release();
                            if (callback) {
                                callback(null, rs);
                            }
                        }
                    });
                } else {
                    connection.rollback((err2) => {
                        connection.release();
                        if (callback) {
                            callback(err2 ? err2 : err, rs);
                        }
                    });
                }
            };
            this._promiseQueryQueue1(querySqlFns).then(queryQueueCallback);
        });
    })
};

HttpSqlite3Server.prototype.querySqls = function(sqlAry, sqlValuesAry, callback) {
    if (! Array.isArray(sqlAry) || sqlAry.length < 1) {
        if (callback) {
            callback(new Error('sqlAry invalid!'));
        }
        return;
    }
    let sqlValuesAry2 = Array.isArray(sqlValuesAry) && sqlValuesAry.length === sqlAry.length ? sqlValuesAry : sqlAry.map(x => []);

    this._pool.getConnection((err, connection) => {
        if (err) {
            if (callback) {
                callback(err);
            }
            return;
        }

        let querySql = (sql, sqlValues) => {
            return resolve => {
                connection.query(sql, sqlValues, (err, values, fields) => {
                    if (err) {
                        resolve({err:err, values:values, fields:fields});
                    }
                    else {
                        resolve({err:null, values:values, fields:fields});
                    }
                });
            }
        };

        let querySqlFns = [];
        for (let i = 0; i < sqlAry.length; i++) {
            querySqlFns.push(querySql(sqlAry[i], sqlValuesAry2[i]));
        }
        let queryQueueCallback = (rs) => {
            if (callback) {
                let err = Array.isArray(rs) && rs.length > 0 ? rs.find(x => x.err) : null;
                err = err ? err.err : null;
                callback(err, rs);
            }
            connection.release();
        };
        this._promiseQueryQueue2(querySqlFns).then(queryQueueCallback);
    })
};

/**
 * handle http request
 * url : http://localhost:xxxx/ics.cgi/sql/req.select?filetype=json

 # req
 {
    "sql":"select * from table1",
    "session": "xx",
 }

 res
 {
    "session": "xx",
    "err": "",
    "data":
    [
        {
            "field1": "value1",
            "field2": "value2"
        },
        {
            "field1": "value1",
            "field2": "value2"
        }
    ]
 }

 *
 * @param req
 * @param res
 */
HttpSqlite3Server.prototype.dealRequest = function(req, res) {
    let self = this;
    let reqBody = null;

    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'POWERED-BY-AID,Content-Type,Content-Length,Authorization,Accept,X-Requested-With');
        res.setHeader('Access-Control-Max-Age', '30');
        res.writeHead(200);
        res.end();
    } else if (req.method === 'POST') {
        let body = '';
        req.on('data', function(chunk) {
            body += chunk;
        });
        req.on('end', function() {
            if (body) {
                try {
                    reqBody = JSON.parse(body);
                } catch (e) {
                    let err = 'error: JSON.parse(body) by url :' + req.url;
                    callback(err);
                    console.log(err);
                    return;
                }
            }
            let sql = reqBody && reqBody.sql ? reqBody.sql : '';
            if (sql) {
                self._pool.getConnection(function(err, connection) {
                    if (err) {
                        callback(err);
                        console.log('HttpSqlite3Server-query: ', err);
                        return;
                    }
                    // let sql = 'SELECT id,name FROM users';
                    connection.query(sql, [], function(err, values, fields) {
                        connection.release(); // always put connection back in pool after last query
                        if (err) {
                            callback(err);
                            console.log('HttpSqlite3Server-query: ', err);
                            return;
                        }
                        callback(false, reqBody, values, fields);
                    });
                });
            } else {
                let err = 'error: JSON.parse(body) Success, but sql is empty. by url :' + req.url;
                callback(err)
            }
        });
    } else if (req.method === 'GET') {
        res.writeHead(404);
        res.end();
    } else {
        res.writeHead(404);
        res.end();
    }

    function callback(err, reqBody, values, fields) {
        let session = reqBody && reqBody.session ? reqBody.session : '';
        let r = {
            'session': session,
        };
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'POWERED-BY-AID,Content-Type,Content-Length,Authorization,Accept,X-Requested-With');
        res.setHeader('Access-Control-Max-Age', '30');
        res.setHeader("Content-Type", 'json');
        res.writeHead(200);
        // res.statusCode = res.statusCode || 200;
        if (err) {
            r.err = err;
            res.end(JSON.stringify(err));
        } else {
            r.err = '';
            r.data = values;
            res.end(JSON.stringify(r));
        }
    }

};

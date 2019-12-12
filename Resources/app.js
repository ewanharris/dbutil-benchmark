const Benchmark = require('benchmark');
const DBUtil = require('./ti.dbutil');
let running = false;

const dbName = 'my_data.db';

const win = Ti.UI.createWindow({
    backgroundColor: '#fff'
});

const label = Ti.UI.createLabel({
    text: 'tap to run benchmarks',
    color: "#333",
    font: {
        fontSize: 20
    }
});
const setup = function () {
    const db = Ti.Database.open(dbName);
    db.execute("DROP TABLE IF EXISTS test;");
    db.execute("CREATE TABLE test(id integer PRIMARY KEY, name TEXT);");
    db.execute("CREATE INDEX test_name ON test(name);");
    db.close();
}

label.addEventListener('click', () => {
    if (running) {
        return;
    }
    running = true;
    label.text = 'running benchmarks';
    const suite = new Benchmark.Suite;
    setup();
    // add tests
    suite
        .add('dbutil noTransactions: true', {
            defer: true,
            setup,
            fn: (deferred) => {
                const dbutil = new DBUtil({
                    dbname: dbName,
                    noTransactions: true
                });
                for (var index = 1; index <= 1000; index++) {
                    dbutil.execute("INSERT INTO test(name) VALUES ('Row " + index + "');");
                }
                dbutil.close();
                deferred.resolve();
            }
        })
        .add('dbutil noTransactions: false', {
            defer: true,
            setup,
            fn: (deferred) => {
                const dbutil = new DBUtil({
                    dbname: dbName,
                    noTransactions: false,
                    onCommit: () => {
                        deferred.resolve();
                    }
                })
                for (var index = 1; index <= 1000; index++) {
                    dbutil.execute("INSERT INTO test(name) VALUES ('Row " + index + "');");
                }
                dbutil.close();
            }
        })
        // add listeners
        .on('cycle', function(event) {
            console.log(String(event.target));
        })
        .on('error', function (event) {
            console.log(event);
        })
        .on('complete', function() {
            console.log('Fastest is ' + this.filter('fastest').map('name'));
            running = false;
            label.text = 'tap to run benchmarks';
        })
        .run({
            async: true
        });
});


win.add(label);
win.open();
